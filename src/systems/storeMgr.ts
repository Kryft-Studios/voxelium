import { Chunk } from "noa-engine/dist/src/lib/chunk";
import * as VC from "../thirdparty/vc";
import { Logger } from "../helpers/logger";
type VALID_DB_VERSION = keyof typeof VXWorldStorage.z_initLookup;
class VXWorldStorage {
    z_resolve!: (value: unknown) => void;
    z_reject!: () => void;
    constructor(
        name: string
    ) {
        const req = indexedDB.open(name, VXWorldStorage.z_maxVersion)
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
    //todo: impl
    get(id: string) {
        return this.z_initPromise.then(() => {
            return new Promise<IDBRequest["result"]>((resolve, reject) => {
                const req = this.z_db
                    .transaction("chunks", "readonly", { durability: "relaxed" })
                    .objectStore("chunks")
                    .get(id);

                req.addEventListener("success", () => {
                    resolve(req.result);
                });

                req.addEventListener("error", () => {
                    VXWorldStorage.logger.error("while getting ", id, " ", req.error)
                    reject(req.error);
                });
            });
        });
    }
    writeChunk(chunkId: string, data: Chunk) {
        this.z_initPromise.then(() => {
            this.z_db
                .transaction("chunks", "readwrite", { durability: "relaxed" })
                .objectStore("chunks")
                .put({
                    chunkId,
                    data: this.z_encode(data)
                });
        });
    }
    z_decode(data: Uint16Array) {
        return VC.decode(data, new Array(32768));
    }
    z_encode(chunk: Chunk) {
        return VC.encode(chunk.voxels.data, new Uint16Array(VC.size(chunk.voxels.data)))
    }
}