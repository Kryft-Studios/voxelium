import { Chunk } from "noa-engine/dist/src/lib/chunk";
import * as VC from "../thirdparty/vc";
class VXWorldStorage {
    constructor(
        name: string
    ){}
    //todo: impl
    get(){}

    z_encode(chunk:Chunk){
        return VC.encode(chunk.voxels.data, new Uint16Array(VC.size(chunk.voxels.data)))
    }
}