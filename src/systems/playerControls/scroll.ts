import { NOA } from "../../scenemgmt/initialRegister";

export class ScrollManager {
    zoomSpeed = 1;
    zoomMin = 0;
    zoomMax = 10
    constructor() {
        NOA.on("tick", () => {
            const SCROLL = NOA.inputs.pointerState.scrolly;
            if (SCROLL !== 0) {
                // increment the zoom distance by the $zoomspeed
                NOA.camera.zoomDistance += (SCROLL > 0) ? this.zoomSpeed : -this.zoomSpeed

                // ensure limits
                if (NOA.camera.zoomDistance < this.zoomMin) NOA.camera.zoomDistance = this.zoomMin
                else if (NOA.camera.zoomDistance > this.zoomMax)NOA.camera.zoomDistance = this.zoomMax
            }
        })
    }
}