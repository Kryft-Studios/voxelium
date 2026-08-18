import { Material } from "@babylonjs/core"
import { NOA } from "../scenemgmt/initialRegister"
import { VEC3 } from "../types/vectors"
import { Engine } from "noa-engine"

/**
 * A simple block manager, used for registering blocks & noajs materials
 */
export class BlockManager<M extends string[] = []>  {
    materials: M = [] as string[] as M;
    /** register a material with a solid color */
    material<NAME extends string>(name: NAME, options: BlockManager.TEXTURE_WITH_DEFAULT_COLOR): asserts this is BlockManager<[...M, NAME]> ;
    /** register a material with a texture url */
    material<NAME extends string>(name: NAME, options: BlockManager.TEXTURE_WITH_URL): asserts this is BlockManager<[...M, NAME]> ;
    /** register a material with a custom babylonjs material */
    material<NAME extends string>(name: NAME, options: BlockManager.TEXTURE_CUSTOM): asserts this is BlockManager<[...M, NAME]> ;
    material<NAME extends string>(
        name: NAME,
        options: BlockManager.TEXTURE_WITH_DEFAULT_COLOR | BlockManager.TEXTURE_CUSTOM | BlockManager.TEXTURE_WITH_URL
    ): asserts this is BlockManager<[...M, NAME]> {
        this.materials.push(name)

        // CASE 1- COLOURED BLOCK
        {
            const WCOLOR = options as BlockManager.TEXTURE_WITH_DEFAULT_COLOR
            if (WCOLOR.color) {

                // register a coloured material
                NOA.registry.registerMaterial(name, WCOLOR)
                return;
            }
        }
        // CASE 2 - CUSTOM TEXTURE URL
        {
            const WURL = options as BlockManager.TEXTURE_WITH_URL;
            if (WURL.url) {
                NOA.registry.registerMaterial(name, {
                    textureURL: WURL.url,
                    texHasAlpha: WURL.alpha
                });
                return;
            }
        }
        // CASE 3 - just fucking babylon.js Material
        NOA.registry.registerMaterial(name, {
            renderMaterial: (options as BlockManager.TEXTURE_CUSTOM).material
        });
    }
    /**
     * create a block id with registered materials
     */
    block(id: number, blockOpts: BlockManager.NOA_BLOCK_OPTS<M>){
        return NOA.registry.registerBlock(id, blockOpts);
    }
}
export namespace BlockManager {
    // .registerMaterial overloads
    export type TEXTURE_WITH_DEFAULT_COLOR = { color: VEC3 }
    export type TEXTURE_WITH_URL = {
        url: string,
        alpha?: boolean
    }
    export type TEXTURE_CUSTOM = {
        material: Material
    }

    // extract the material opts
    export type NOA_MATERIAL_OPTS = Exclude<Parameters<Engine["registry"]["registerMaterial"]>[1], undefined>

    // extract the block opts
    export type NOA_BLOCK_OPTS<M extends readonly string[]> = Exclude<Parameters<Engine["registry"]["registerBlock"]>[1], undefined> & {material: M[number]}
}