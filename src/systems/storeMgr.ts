import ndArray from "ndarray";
import { Engine } from "noa-engine";
import { Chunk } from "noa-engine/dist/src/lib/chunk";
import { Logger } from "../helpers/logger";
import { promisifyIDBRequest } from "../helpers/promisify";
import * as VC from "../thirdparty/vc";
import { VEC3 } from "../types/vectors";
import { noa } from "../scenemgmt/initialRegister";
type VALID_DB_VERSION = keyof typeof VXWorldStorage.z_initLookup;
export class VXWorldStorage {
    z_resolve!: (value: unknown) => void;
    z_reject!: () => void;
    constructor(
        name: string
    ) {
        const req = indexedDB.open(name, VXWorldStorage.z_maxVersion)
        console.log("register")
        req.onupgradeneeded = (event) => {
            if (!event.target) return;
            const db = (event.target as any).result as IDBDatabase;

            // keep cycling changes until max version
            let __currentCycle: VALID_DB_VERSION = event.oldVersion as VALID_DB_VERSION;
            while (VXWorldStorage.z_upgradeLookup[__currentCycle] != undefined) {

                // @ts-ignore - __currentCycle wont ever be set to undefined because of the check above!
                __currentCycle = VXWorldStorage.z_upgradeLookup[__currentCycle]
                VXWorldStorage.z_initLookup[__currentCycle](db)
            }
        }

        this.z_initPromise = new Promise((resolve, reject) => { this.z_resolve = resolve; this.z_reject = reject })
        req.onsuccess = (event) => {
            this.z_db = (event.target as any).result as IDBDatabase;

            // Promise Resolution
            this.z_resolve("resol");
            this.z_initialized = true;

            // success log
            VXWorldStorage.logger.log("Success")
        }
        req.onerror = () => {

            // reject init promise
            this.z_reject()
            VXWorldStorage.logger.error(req.error)
        }
    }
    static logger = new Logger("VXWorldStorage")

    static z_maxVersion: VALID_DB_VERSION = 1
    static z_upgradeLookup = {
        [0]: this.z_maxVersion,
        [1]: undefined

        // add this so ts doesnt scream
        //.... later, when you add version 2, add [1]: 2!
    }
    static z_tag(message: any, ...strings: string[]) { return `[VXWorldStorage.${strings.join(".")}] ${JSON.stringify(message)}` }
    static z_initLookup = {
        [1](db: IDBDatabase) {
            db.createObjectStore("chunks", {
                // in noa.js, it's x|y|z
                "keyPath": "chunkId"
            })
        }
    }
    async init(): Promise<unknown> { return this.z_initPromise }
    z_db!: IDBDatabase;
    z_initPromise;
    z_initialized = false;
    async has(id: string): Promise<boolean> {
        return await promisifyIDBRequest(
            this.z_db
                .transaction("chunks", "readonly")
                .objectStore("chunks")
                .getKey(id)
        ) !== undefined;
    }
    async get(id: string) {
        return await this.z_initPromise.then(() => {
            return promisifyIDBRequest(
                this.z_db
                    .transaction("chunks", "readonly", { durability: "relaxed" })
                    .objectStore("chunks")
                    .get(id));
        });
    }
    resolveFirstTimeLoad!: (a: unknown) => void
    fullyLoadedPromise = new Promise((resolve) => { this.resolveFirstTimeLoad = resolve })
    async writeChunk(chunkId: string, data: Chunk) {
        const dta = this.z_encode(data);
        if (!dta) return;
        return await this.z_initPromise.then(() => {
            return promisifyIDBRequest(this.z_db
                .transaction("chunks", "readwrite", { durability: "relaxed" })
                .objectStore("chunks")
                .put({
                    chunkId,
                    data: dta
                }));
        });
    }
    z_decode(data: Uint16Array) {
        console.log(data)
        return VC.decode(data, new Array(32768));
    }
    z_encode(chunk: Chunk) {
        if (!chunk?.voxels) return;
        return VC.encode(chunk.voxels.data, new Uint16Array(VC.size(chunk.voxels.data)))
    }
    z_chunkDbWorker: Promise<void> = Promise.resolve();
    z_queueChunkTask(task: () => Promise<void>) {
        this.z_chunkDbWorker = this.z_chunkDbWorker
            .catch(err => {
                VXWorldStorage.logger.error("Chunk worker failed:", err);
            })
            .then(task);

        return this.z_chunkDbWorker;
    }
    addEventListeners(noa: Engine) {
        VXWorldStorage.logger.log("helo")
        noa.world.on(
            "worldDataNeeded",
            (id: string, data, x: number, y: number, z: number) => {
                VXWorldStorage.logger.log("WORLD DATA NEEDED", id);

                this.z_queueChunkTask(async () => {
                    VXWorldStorage.logger.log("TASK START", id);

                    const stored = await this.get(id) ?? { data: VXWorldStorage.z_createEmptyArr() };
                    VXWorldStorage.logger.log("GET DONE", id, stored);

                    const decoded = this.z_decode(stored.data);

                    for (let i = 0; i < decoded.length; i++) {
                        data.data[i] = decoded[i];
                    }


                    VXWorldStorage.logger.log("DATA FILLED", id);
                    const before = Object.keys(noa.world._chunksPending.hash).length;

                    noa.world.setChunkData(id, data);

                    const after = Object.keys(noa.world._chunksPending.hash).length;

                    console.log({
                        id,
                        before,
                        after,
                        stillPending: !!(noa.world._chunksPending.hash as any)[id]
                    });
                    if (after === 0 || after === 1) {
                        this.resolveFirstTimeLoad("")
                    }
                    VXWorldStorage.logger.log("SET CHUNK DONE", id);
                });
            }
        );
        const strg = noa.world._storage;
        noa.world.on("chunkBeingRemoved", (id: string) => {
            this.z_queueChunkTask(async () => {
                await this.writeChunk(id, strg.getChunkByIndexes(...VXWorldStorage.z_chkIdToChkPos(id)))
            })
        })
    }
    static z_createEmptyArr() {
        return new Array(32 ** 3).fill(0);
    }
    static z_chkIdToChkPos(id: string) {
        const [x, y, z] = id.split("|");
        return [Number(x), Number(y), Number(z)] as const;
    }
}