import { NOA } from "../../scenemgmt/initialRegister";
import { VEC3 } from "../../types/vectors";
import { NoaEventRegisterer } from "./noaEvReg";

export class BlockControlsManager {
    /** whether the player can place blocks */
    canPlace = true;

    /** whether the player can destroy blocks */
    canDestroy = true;

    /** selected block of the user. must be registered */
    selectedBlock = 1;
    destroy() {
        if (!this.canDestroy) return;
        if (NOA.targetedBlock) {

            // destroy the block at the player's target highlight
            const POS = NOA.targetedBlock.position as VEC3
            NOA.setBlock(0, ...POS)
        }
    }
    place() {
        if (!this.canPlace) return;
        if (NOA.targetedBlock) {

            // place the selected block at the player's highlighted block
            const POS = NOA.targetedBlock.adjacent as VEC3
            NOA.setBlock(this.selectedBlock, ...POS)
        }

    }
    constructor() {
        NoaEventRegisterer.registerKey$downev("Enter", "fire", this.place.bind(this))
        // when player tries to destroy (LEFT CLICK)
        NOA.inputs.down.on('fire', this.place.bind(this))

        // when player tries to destroy (RIGHT CLICK)
        NOA.inputs.down.on('alt-fire', this.destroy.bind(this))
    }
}