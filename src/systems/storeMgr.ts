import { Chunk } from "noa-engine/dist/src/lib/chunk";
import { Logger } from "../helpers/logger";
import { promisifyIDBRequest } from "../helpers/promisify";
import * as VC from "../thirdparty/vc";
import { NOA } from "../scenemgmt/initialRegister";
type VALID_DB_VERSION = keyof typeof VXWorldStorage.z_initLookup;
export class VXWorldStorage {

    // --------------------------
    // CLASS STATIC PROPERTIES
    // --------------------------
    
    // its logger
    static logger = new Logger("VXWorldStorage")

    // --------------------------
    // CLASS INTERNAL STATIC PROPERTIES
    // --------------------------

    static z_maxVersion: VALID_DB_VERSION = 1

    /** 0 -> next -> next -> ... -> z_maxVersion -> undefined */
    static z_upgradeLookup = {
        [0]: 1,
        [1]: undefined

        // add this so ts doesnt scream
        //.... later, when you add version 2, add [1]: 2!
    }
    /** functions for initializing specific versions */
    static z_initLookup = {
        [1](db: IDBDatabase) {

            // version 1 - just a simple chunks[]
            db.createObjectStore("chunks", {
                // in noa.js, it's x|y|z|default
                "keyPath": "chunkId"
            })
        }
    }

    // --------------------------
    // CLASS INTERNAL STATIC  METHODS
    // --------------------------
    static z_decode(data: Uint16Array) {
        console.log(data)
        return VC.decode(data, new Array(32768));
    }
    static z_encode(chunk: Chunk) {
        // sometimes the chunk is just missing idk how
        if (!chunk?.voxels) return;
        return VC.encode(chunk.voxels.data, new Uint16Array(VC.size(chunk.voxels.data)))
    }
    static z_createEmptyArr() {
        return new Array(32 ** 3).fill(0);
    }
    static z_chkIdToChkPos(id: string) {
        const [X,Y,Z] = id.split("|");
        return [Number(X), Number(Y), Number(Z)] as const;
    }
    // --------------------------
    // CONSTRUCTOR
    // --------------------------
    constructor(
        name: string
    ) {
        // open the indexed db database
        const REQUEST = indexedDB.open(name, VXWorldStorage.z_maxVersion)

        // upgrade the db
        REQUEST.onupgradeneeded = (event) => {
            if (!event.target) return;
            const DB = (event.target as any).result as IDBDatabase;

            // keep cycling changes until max version
            let __currentCycle: VALID_DB_VERSION = event.oldVersion as VALID_DB_VERSION;
            while (VXWorldStorage.z_upgradeLookup[__currentCycle] != undefined) {

                // @ts-ignore - __currentCycle wont ever be set to undefined because of the check above!
                __currentCycle = VXWorldStorage.z_upgradeLookup[__currentCycle]
                VXWorldStorage.z_initLookup[__currentCycle](DB)
            }
        }

        // promise for waiters
        this.z_initPromise = new Promise((resolve, reject) => { this.z_resolve = resolve; this.z_reject = reject })

        REQUEST.onsuccess = (event) => {
            this.z_db = (event.target as any).result as IDBDatabase;

            // Promise Resolution
            this.z_resolve("resol");
            this.z_initialized = true;

            // success log
            VXWorldStorage.logger.log("Success")
        }
        REQUEST.onerror = () => {

            // reject init promise
            this.z_reject()

            // log the error so we can debug it
            VXWorldStorage.logger.error(REQUEST.error)
        }
    }

    
    // --------------------------
    // CLASS PROPERTIES
    // --------------------------

    // @kryft-ignore  - z_resolve first time load is required to be at top because of fullyLoadedPROMISE
    z_resolveFirstTimeLoad!: (a: unknown) => void
    fullyLoadedPromise = new Promise((resolve) => { this.z_resolveFirstTimeLoad = resolve })
    // -------------------------- 
    // CLASS INTERNAL PROPERTIES 
    // --------------------------

    /** the indexed db database */
    z_db!: IDBDatabase;
    /** internal initialization promise */
    z_initPromise;

    /** initializaed bool */
    z_initialized = false;

    /** resolve handle for resolving z_initPromise */
    z_resolve!: (value: unknown) => void;
    /** reject handle for rejecting z_initPromise */
    z_reject!: () => void;

    /** chunk event listeners worker */
    z_chunkDbWorker: Promise<void> = Promise.resolve()

    async getAllChunks() {

        // init checks
        await this.init();


        const ALL_CHUNKS = (await promisifyIDBRequest(this.z_db.transaction("chunks", "readonly")
            .objectStore("chunks")
            .getAll())) as { chunkId: string, data: Uint16Array & { length: 32768 } }[]
        const CD = [];
        for (const CHUNK of ALL_CHUNKS) {
            const POS = VXWorldStorage.z_chkIdToChkPos(CHUNK.chunkId);

        }
    }
    // --------------------------
    // CLASS METHODS
    // --------------------------
    /** waiter */
    async init(): Promise<unknown> { return this.z_initPromise }
    /**
     * See if the database of the world has the chunk you want.
     * @param id x|y|z|default
     * @returns 
     */
    async has(id: string): Promise<boolean> {
        await this.init()
        return await promisifyIDBRequest(
            this.z_db
                .transaction("chunks", "readonly")
                .objectStore("chunks")
                .getKey(id)
        ) !== undefined;
    }
    /**
     * Get the data of the chunk in this world
     * @param id x|y|z|default
     * @returns 
     */
    async get(id: string) {
        // MAKE SURE USER INIT
        await this.init()

        // read the chunk
        return await
            promisifyIDBRequest(
                this.z_db
                    .transaction("chunks", "readonly", { durability: "relaxed" })
                    .objectStore("chunks")
                    .get(id));

    }
    /**
     * Write a chunk in the world's database
     */
    async writeChunk(chunkId: string, data: Chunk) {

        // the encoded output from voxelcrunch. Bloxdschem use this
        const ENCODED_DATA = VXWorldStorage.z_encode(data);
        if (!ENCODED_DATA) return;

        VXWorldStorage.logger.log("WRITE CHUNK",chunkId,ENCODED_DATA)

        // write the chunk in the db
        return await this.z_initPromise.then(() => {
            return promisifyIDBRequest(this.z_db
                .transaction("chunks", "readwrite", { durability: "relaxed" })
                .objectStore("chunks")
                .put({
                    chunkId,
                    data: ENCODED_DATA
                }));
        });
    }
    /**
     * save all the chunks that are loaded right now
     */
    async saveAllChunks() {

        // currently loaded chunks that noa has stored
        const CHUNKS: InstanceType<typeof Chunk>[] = Object.values(NOA.world._storage.hash)

        // write them individually
        for (const CHUNK of CHUNKS) {
            await this.writeChunk(CHUNK.requestID, CHUNK);
        }
    }
    /**
     * create event listeners for functionality in noa
     */
    addEventListeners() {
        NOA.world.on(
            "worldDataNeeded",
            (id: string, data, x: number, y: number, z: number) => {
                VXWorldStorage.logger.log("WORLD DATA NEEDED", id);

                this.z_queueChunkTask(async () => {
                    VXWorldStorage.logger.log("TASK START", id);

                    // get the stored data from the db, or create a empty array as placeholder
                    const STORED = await this.get(id) ?? { data: VXWorldStorage.z_createEmptyArr() };
                    VXWorldStorage.logger.log("GET DONE", id, STORED);

                    // decode it via VC
                    const DECODED = VXWorldStorage.z_decode(STORED.data);

                    // Modify NDArray's internal array
                    for (let i = 0; i < DECODED.length; i++) {
                        data.data[i] = DECODED[i];
                    }

                    VXWorldStorage.logger.log("DATA FILLED", id);
                    const BEFORE = Object.keys(NOA.world._chunksPending.hash).length;
                    // give the data to noa
                    NOA.world.setChunkData(id, data);
                    const AFTER = Object.keys(NOA.world._chunksPending.hash).length;

                    console.log({
                        id,
                        BEFORE,
                        AFTER,
                        stillPending: !!(NOA.world._chunksPending.hash as any)[id]
                    });
                    if (AFTER === 0 || AFTER === 1) {
                        this.z_resolveFirstTimeLoad("")
                    }
                    VXWorldStorage.logger.log("SET CHUNK DONE", id);
                });
            }
        );
        const strg = NOA.world._storage;
        NOA.world.on("chunkBeingRemoved", (id: string) => {
            this.z_queueChunkTask(async () => {

                // write the chunk data
                await this.writeChunk(id, 
                    // get the UINT16 that noa stores
                    strg.getChunkByIndexes(

                        // noa's special fmt -> pos
                        ...VXWorldStorage.z_chkIdToChkPos(id)
                    ))
            })
        })
    }
    
    // --------------------------
    // CLASS INTERNAL METHODS
    // --------------------------
    /** queue chunk task */
    z_queueChunkTask(task: () => Promise<void>) {
        this.z_chunkDbWorker = this.z_chunkDbWorker
            .catch(err => {
                VXWorldStorage.logger.error("Chunk worker failed:", err);
            })
            .then(task);

        return this.z_chunkDbWorker;
    }
}
