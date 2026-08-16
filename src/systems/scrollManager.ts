import { noa } from "../scenemgmt/initialRegister";

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