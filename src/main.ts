import { NOA } from "./scenemgmt/initialRegister";
import { BlockManager } from "./systems/blockManager";
import { PlayerControls } from "./systems/playerControls";
import { VXWorldStorage } from "./systems/storeMgr"

const STORAGE = new VXWorldStorage("world2");
NOA.world.maxChunksPendingCreation = 1000

const CONTROLS = new PlayerControls()
// noa may request chunks while IndexedDB is opening. The handler itself waits
// for z_initPromise, so attach it before the first await to avoid losing them.
STORAGE.addEventListeners();
await STORAGE.init()

// The pending-count promise does not guarantee that this particular chunk has
// been created. Wait for the chunk that will receive the test block instead.
await new Promise<void>((resolve) => {
    if (NOA.world._storage.getChunkByIndexes(0, 0, 0)) {
        resolve();
        return;
    }

    const OCA_EV = (chunk: { i: number, j: number, k: number }) => {
        if (chunk.i !== 0 || chunk.j !== 0 || chunk.k !== 0) return;
        NOA.world.off("chunkAdded", OCA_EV);
        resolve();
    };
    NOA.world.on("chunkAdded", OCA_EV);
});

const BLOCKS: BlockManager = new BlockManager();
BLOCKS.material("dirt", {color: [0,1,1]});
const DIRT = BLOCKS.block(1, {"material":"dirt"});
;
(window as any).WT = STORAGE;
// The player starts at [0, 0, 0] and the camera initially faces +Z.
// Put the test block in front of the camera rather than inside the player.
NOA.setBlock(DIRT, 0, 1, 3);

