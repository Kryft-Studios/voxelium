
import { PlayerMovement } from "./playerControls/movement";
import { ScrollManager } from "./playerControls/scroll";
import { BlockControlsManager } from "./playerControls/blockControls";
import { HotbarManager } from "./playerControls/hotbar";
export class PlayerControls {
    movement = new PlayerMovement();
    scroll = new ScrollManager();
    blockControls = new BlockControlsManager();
    hotbar = new HotbarManager(this.blockControls)
}