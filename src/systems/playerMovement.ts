import * as VPE from "voxel-physics-engine";
import { noa, playerEntity, playerPhysics } from "../scenemgmt/initialRegister";
import { DESKTOPKEY } from "../types/keys";
import zero from "../helpers/zero"
import { GameInputs } from "game-inputs";
export namespace NoaEventRegisterer {
    export function registerKey(
        keys: DESKTOPKEY[] | DESKTOPKEY,
        event: string,
        whenDown: ()=>any
    ){
        z_registerCommon(keys,event);
        noa.inputs.down.on(event, whenDown)
    };
    export function z_registerCommon(keys: DESKTOPKEY[] | DESKTOPKEY, event: string){
        noa.inputs.state[event] ??= false;
        for(const key of keys){
        //@ts-ignore
        (noa.inputs._keyBindmap as any)[key]??=[]
        }
        noa.inputs.bind(event, ...keys) 
    }
    export function registerKey_tick(
        keys: DESKTOPKEY[] | DESKTOPKEY,
        event: string,
        onFire: Function,
        onStopFire: Function
    ){
        z_registerCommon(keys,event);
        let firedState = noa.inputs.state[event]
        noa.on("tick", ()=>{
            if(noa.inputs.state[event]){
            onFire();
            firedState = true;
            } else {
                if(firedState){
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
    ){
        this.movement = noa.ents.getMovement(entity); 
        this.physics = noa.ents.getPhysics(entity)?.body as VPE.RigidBody;
        // we will control jump ourselves
        this.movement.airJumps = 0;
        // stop from falling
        playerPhysics.gravity = [0,0,0]
        NoaEventRegisterer.registerKey_tick("KeyC", "crouch", ()=>{
            this.physics.applyImpulse([0,-this.moveYSpeed,0])
        },this.stopY.bind(this))
        NoaEventRegisterer.registerKey_tick("Space", "jump",()=>{
            this.physics.applyImpulse([0,this.moveYSpeed,0])
        }, this.stopY.bind(this));
        noa.on("tick",()=>{
            if(!this.movement.running){
                zero(this.physics.velocity, [0,2])
            }
        })
    }
    stopY(this: PlayerMovement){
        console.log(this)
        this.physics.velocity[1] = 0
    }
}