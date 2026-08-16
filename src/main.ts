import { noa } from "./scenemgmt/initialRegister";
import { BlockManager } from "./systems/blockManager";
import { PlayerControls } from "./systems/playerControls";
import { VXWorldStorage } from "./systems/storeMgr"

const worldStorage = new VXWorldStorage("world1");
noa.world.maxChunksPendingCreation = 1000
// Render newly loaded/edited chunks immediately; the default waits for six
// neighboring chunks before creating terrain meshes.
noa.world.minNeighborsToMesh = 0

const playerControls = new PlayerControls()
// noa may request chunks while IndexedDB is opening. The handler itself waits
// for z_initPromise, so attach it before the first await to avoid losing them.
worldStorage.addEventListeners(noa);
await worldStorage.init()

// The pending-count promise does not guarantee that this particular chunk has
// been created. Wait for the chunk that will receive the test block instead.
await new Promise<void>((resolve) => {
    if (noa.world._storage.getChunkByIndexes(0, 0, 0)) {
        resolve();
        return;
    }

    const onChunkAdded = (chunk: { i: number, j: number, k: number }) => {
        if (chunk.i !== 0 || chunk.j !== 0 || chunk.k !== 0) return;
        noa.world.off("chunkAdded", onChunkAdded);
        resolve();
    };
    noa.world.on("chunkAdded", onChunkAdded);
});

const blockManager: BlockManager = new BlockManager();
blockManager.material("dirt", {color: [1,0,1]});
const dirt = blockManager.block(1, {"material":"dirt"});
;
(window as any).WT = worldStorage;
// The player starts at [0, 0, 0] and the camera initially faces +Z.
// Put the test block in front of the camera rather than inside the player.
noa.setBlock(dirt, 0, 1, 3);

