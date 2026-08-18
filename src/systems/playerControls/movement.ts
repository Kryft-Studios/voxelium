import zero from "../../helpers/zero";
import { NOA, PLAYERET, PLAYERPHY } from "../../scenemgmt/initialRegister";
import { NoaEventRegisterer } from "./noaEvReg";
import * as VPE from "voxel-physics-engine"
export class PlayerMovement {

    /** the movement body of the noa entity */
    movement

    /**  the physics body of the noa entity */
    physics

    /** the y fly speed */
    moveYSpeed = 2
    constructor(
        /** generally noa.playerEntity */
        public entity: number = PLAYERET
    ) {
        this.movement = NOA.ents.getMovement(entity);
        this.physics = NOA.ents.getPhysics(entity)?.body as VPE.RigidBody;
        // we will control jump ourselves ("fly")
        this.movement.airJumps = 0;
        // stop from falling
        PLAYERPHY.gravity = [0, 0, 0]
        // key c is usually crouch too, many bloxd users use that
        NoaEventRegisterer.registerKey$tick(["KeyC","ControlLeft"], "crouch", () => {

            // down
            this.physics.applyImpulse([0, -this.moveYSpeed, 0])
        }, 
        // bind to maintain 'this' context
        this.stopY.bind(this)
        )

        // fly handling
        NoaEventRegisterer.registerKey$tick("Space", "jump", () => {
            this.physics.applyImpulse([0, this.moveYSpeed, 0])
        }, this.stopY.bind(this));

        // register tick event to prevent the player keep walking  (noa.js bug)
        NOA.on("tick", () => {
            if (!this.movement.running) {
                zero(this.physics.velocity, [0, 2])
            }
        })
    }
    stopY(this: PlayerMovement) {
        this.physics.velocity[1] = 0
    }
}