import { noa } from "./scenemgmt/initialRegister";
import { BlockManager } from "./systems/blockManager";
import { PlayerControls } from "./systems/playerControls";
import { VXWorldStorage } from "./systems/storeMgr"

const worldStorage = new VXWorldStorage("world1");
noa.world.maxChunksPendingCreation = 1000

const playerControls = new PlayerControls()
// noa may request chunks while IndexedDB is opening. The handler itself waits
// for z_initPromise, so attach it before the first await to avoid losing them.
worldStorage.addEventListeners(noa);
await worldStorage.init()
await worldStorage.fullyLoadedPromise
const blockManager: BlockManager = new BlockManager();
blockManager.material("dirt", {color: [0,0,0]});
const dirt = blockManager.block(1, {"material":"dirt"});
;
(window as any).WT = worldStorage;
// The player starts at [0, 0, 0] and the camera initially faces +Z.
// Put the test block in front of the camera rather than inside the player.
noa.setBlock(dirt, 0, 1, 3);

