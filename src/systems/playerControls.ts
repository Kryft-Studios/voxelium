import * as VPE from "voxel-physics-engine";
import { noa, playerEntity, playerPhysics } from "../scenemgmt/initialRegister";
import { DESKTOPKEY } from "../types/keys";
import zero from "../helpers/zero"
import { GameInputs } from "game-inputs";
export namespace NoaEventRegisterer {
    export function registerKey(
        keys: DESKTOPKEY[] | DESKTOPKEY,
        event: string,
        whenDown: () => any
    ) {
        z_registerCommon(keys, event);
        noa.inputs.down.on(event, whenDown)
    };
    export function z_registerCommon(keys: DESKTOPKEY[] | DESKTOPKEY, event: string) {
        const keyList = Array.isArray(keys) ? keys : [keys];
        noa.inputs.bind(event, ...keyList);
    }
    export function registerKey_tick(
        keys: DESKTOPKEY[] | DESKTOPKEY,
        event: string,
        onFire: Function,
        onStopFire: Function
    ) {
        z_registerCommon(keys, event);
        let firedState = noa.inputs.state[event]
        noa.on("tick", () => {
            if (noa.inputs.state[event]) {
                onFire();
                firedState = true;
            } else {
                if (firedState) {
                    onStopFire();
                }
                firedState = false;
            }
        })
    }
}
export class PlayerMovement {
    movement
    physics
    moveYSpeed = 2
    constructor(
        /** generally noa.playerEntity */
        public entity: number = playerEntity
    ) {
        this.movement = noa.ents.getMovement(entity);
        this.physics = noa.ents.getPhysics(entity)?.body as VPE.RigidBody;
        // we will control jump ourselves
        this.movement.airJumps = 0;
        // stop from falling
        playerPhysics.gravity = [0, 0, 0]
        NoaEventRegisterer.registerKey_tick("KeyC", "crouch", () => {
            this.physics.applyImpulse([0, -this.moveYSpeed, 0])
        }, this.stopY.bind(this))
        NoaEventRegisterer.registerKey_tick("Space", "jump", () => {
            this.physics.applyImpulse([0, this.moveYSpeed, 0])
        }, this.stopY.bind(this));
        noa.on("tick", () => {
            if (!this.movement.running) {
                zero(this.physics.velocity, [0, 2])
            }
        })
    }
    stopY(this: PlayerMovement) {
        this.physics.velocity[1] = 0
    }
}


export class ScrollManager {
    zoomSpeed = 1;
    zoomMin = 0;
    zoomMax = 10
    constructor() {
        noa.on("tick", () => {
            const scroll = noa.inputs.pointerState.scrolly;
            if (scroll !== 0) {
                noa.camera.zoomDistance += (scroll > 0) ? this.zoomSpeed : -this.zoomSpeed
                if (noa.camera.zoomDistance < this.zoomMin) noa.camera.zoomDistance = this.zoomMin
                else if (noa.camera.zoomDistance > this.zoomMax) noa.camera.zoomDistance = this.zoomMax
            }
        })
    }
}
export class BlockControlsManager {
    canPlace = true;
    canDestroy = true;
    selectedBlock = 1;
    destroy() {
        if (!this.canDestroy) return;
        if (noa.targetedBlock) {
            var pos = noa.targetedBlock.position
            noa.setBlock(0, pos[0], pos[1], pos[2])
        }
    }
    place() {
        if (!this.canPlace) return;
        if (noa.targetedBlock) {
            var pos = noa.targetedBlock.adjacent
            noa.setBlock(this.selectedBlock, pos[0], pos[1], pos[2])
        }

    }
    constructor() {
        NoaEventRegisterer.registerKey("Enter", "fire", this.place.bind(this))
        // when player tries to destroy (LEFT CLICK)
        noa.inputs.down.on('fire', this.place.bind(this))

        // when player tries to destroy (RIGHT CLICK)
        noa.inputs.down.on('alt-fire', this.destroy.bind(this))
    }
}
export class PlayerControls {
    movement = new PlayerMovement();
    scroll = new ScrollManager();
    blockControls = new BlockControlsManager();
}