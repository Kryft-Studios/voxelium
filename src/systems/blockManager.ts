import { Material, RegisterUniversalCamera } from "@babylonjs/core"
import { noa } from "../scenemgmt/initialRegister"
import { VEC3 } from "../types/vectors"
import { Engine } from "noa-engine"

export class BlockManager<M extends string[] = []>  {
    constructor() {

    }
    materials: M = [] as string[] as M;
    material<NAME extends string>(name: NAME, options: BlockManager.TEXTURE_WITH_DEFAULT_COLOR): asserts this is BlockManager<[...M, NAME]> ;
    material<NAME extends string>(name: NAME, options: BlockManager.TEXTURE_WITH_URL): asserts this is BlockManager<[...M, NAME]> ;
    material<NAME extends string>(name: NAME, options: BlockManager.TEXTURE_CUSTOM): asserts this is BlockManager<[...M, NAME]> ;
    material<NAME extends string>(
        name: NAME,
        options: BlockManager.TEXTURE_WITH_DEFAULT_COLOR | BlockManager.TEXTURE_CUSTOM | BlockManager.TEXTURE_WITH_URL
    ): asserts this is BlockManager<[...M, NAME]> {
        this.materials.push(name)
        let exopts!: BlockManager.NOA_MATERIAL_OPTS
        // Co Routine to avoid typing .registerMaterial a million times
        // "CO ROUTINES" BRO ESCAPED FROM C++ 😭😭😭😭😭😭😭😭
        // For readers: this unnecesary but whatever
        const cr = (function* () {
            yield;
            noa.registry.registerMaterial(name, exopts);
        })();

        // CASE 1- COLOURED BLOCK
        {
            const coloured = options as BlockManager.TEXTURE_WITH_DEFAULT_COLOR
            if (coloured.color) {
                exopts = coloured;
                cr.next();
                return;
            }
        }
        // CASE 2 - CUSTOM TEXTURE URL
        {
            const wurl = options as BlockManager.TEXTURE_WITH_URL;
            if (wurl.url) {
                exopts = {
                    textureURL: wurl.url,
                    texHasAlpha: wurl.alpha
                }
                cr.next();
                return;
            }
        }
        // CASE 3 - just fucking babylon.js Material
        exopts = {
            renderMaterial: (options as BlockManager.TEXTURE_CUSTOM).material
        }
        cr.next();
    }

    block(id: number, blockOpts: BlockManager.NOA_BLOCK_OPTS<M>){
        return noa.registry.registerBlock(id, blockOpts);
    }
}
export namespace BlockManager {
    export const materials = []
    export type TEXTURE_WITH_DEFAULT_COLOR = { color: VEC3 }
    export type TEXTURE_WITH_URL = {
        url: string,
        alpha?: boolean
    }
    export type TEXTURE_CUSTOM = {
        material: Material
    }
    export type NOA_MATERIAL_OPTS = Exclude<Parameters<Engine["registry"]["registerMaterial"]>[1], undefined>
    export type NOA_BLOCK_OPTS<M extends readonly string[]> = Exclude<Parameters<Engine["registry"]["registerBlock"]>[1], undefined> & {material: M[number]}
}