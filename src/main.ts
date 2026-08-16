import { noa } from "./scenemgmt/initialRegister";
import { PlayerMovement } from "./systems/playerMovement";
import { ScrollManager } from "./systems/scrollManager";
import { VXWorldStorage } from "./systems/storeMgr"

const worldStorage = new VXWorldStorage("ga,e2");
await worldStorage.init()
worldStorage.addEventListeners(noa);
await worldStorage.fullyLoadedPromise
const material = noa.registry.registerMaterial("dirt", {"color": [0,0,0]})
const dirtID = noa.registry.registerBlock(1, {
    material: "dirt" 
});
(window as any).WT = worldStorage;
noa.world.setBlockID(dirtID, 0, 0, 0);
console.log(dirtID)

const playerMovement = new PlayerMovement();
const scrollManager = new ScrollManager();
