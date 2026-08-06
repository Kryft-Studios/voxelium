import { Engine } from "noa-engine"
import { Vector3, Vector4 } from "../types/vectors";

interface Opts {
   debug: boolean, // default false
   silent: boolean, // default false
   playerHeight: number, // default 1.8
   playerWidth: number, // default 0.6
   playerStart: Vector3, // default 0,10,0
   playerAutoStep:boolean, // default true
   playerShadowComponent: boolean, //default true
   tickRate: number, //default 30
   maxRenderRate: number, // default 0 // max FPS, 0 for uncapped
   blockTestDistance: number, // default 10
   stickyPointerLock: boolean, // default true
   dragCameraOutsidePointerLock: boolean, //default true
   stickyFullscreen: boolean, // default false
   skipDefaultHighlighting: boolean, // default false
   originRebaseDistance: number, // default 25
   silentBabylon: boolean,
   showFPS: boolean,
   chunkSize: number,
   chunkAddDistance: number,
   chunkRemoveDistance: number,
   sensitivityX: number,
   sensitivityY: number,
   inverseX : boolean,
   inverseY: boolean,
   sensitivityMul: number,
   sensitivityMultOutsidePointerlock: number, 
   heading: number, // num between 0..2pi
   pitch: number,
   cameraTarget: number, // refer to ent-comp's ECS.createEntity by fenomas
   initialZoom: number, 
   zoomSpeed: number,
   domElement: string,
   shadowDistance: number,
   bindings: Record<string /* jump, etc. */, string /* KeyW, KeyC, etc. */>,
   texturePath: string,
   renderOnResize: boolean,
   useAO: boolean,
   reverseAOMultiplier: number,
   antiAlias: boolean,
   preserveDrawingBuffer: boolean,
   octreeBlockSize: number,
   clearColor: Vector4,
   ambientColor: Vector3,
   lightVector: Vector3,
   lightDiffuse: Vector3,
   lightSpecular: Vector3,
   manuallyControlChunkLoading: boolean,
   worldGenWhilePaused: boolean
}
type Opt_ = Partial<Opts>
export const opts: Opt_ = {
    debug: true,
    silent: false,
    showFPS: true,
    chunkSize: 32,
    chunkAddDistance: 2.5,
    chunkRemoveDistance: 3.5, 
    playerStart: [0, 0, 0],
}
export const noa = new Engine(opts);
