import { Type } from "avsc";
import { VEC3 } from "../types/vectors";

export namespace BloxdSchemManager {
    /** chunk options in bloxd schem format */
    export interface BSF_CHUNKFMT {
        /** the position of the chunk */
        pos: VEC3,
        /** The bytes, encoded by voxel crunch */
        bytes: Buffer
    }
    /** block data format in bloxd schem */
    export interface BSF_BDFMT {
        /** the position of the block of which this data is */
        pos: VEC3,

        /** the data.
         * 
         * use {persisted: {...}} for persisted properties
         */
        data: object
    }
    /** the simplified bloxd schem format */
    export interface BLOXD_SCHEM_FORMAT {
        /** the name of the bloxd schem */
        name: string,
        /** the size of the bloxd schem */
        size: VEC3,
        /** the db id of the creator */
        dbId: string,
        /**  the block datas */
        blockDatas?: BSF_BDFMT
        /** the chunks */
        chunks: BSF_CHUNKFMT,
        /** the world code */
        code?: string
    };
    /** 
     * the Reverse engineered avro datum
     * 
     * thanks to Hansdiewurst ('random'), delfineon and a little of me
     */
    export const BLOXD_AVRO_DATUM = Type.forSchema({
        type: "record",
        name: "Schematic",
        fields: [
            // header - version of bloxdschem frmt
            { name: 'headers', type: { name: "headers", type: 'fixed', size: 4 }, default: "\u{4}\u{0}\u{0}\u{0}" },
            // name of this schem
            { name: "name", type: "string" },
            // copied from
            { name: "x", type: "int" },
            { name: "y", type: "int" },
            { name: "z", type: "int" },
            // size
            { name: "width", type: "int" },
            { name: "height", type: "int" },
            { name: "length", type: "int" },
            {
                // chunks
                name: "chunks",
                type: {
                    type: "array",
                    items: {
                        type: "record",
                        name: "chunk",
                        fields: [
                            // the position of the chunk
                            { name: "x", type: "int" },
                            { name: "y", type: "int" },
                            { name: "z", type: "int" },
                            // the blocks [encoded with VC]
                            { name: "blocks", type: "bytes" }
                        ]
                    }
                }
            },
            {
                // all the block datas
                name: "blockDatas",
                type: {
                    type: "array",
                    items: {
                        type: "record",
                        name: "blockdata",
                        fields: [
                            // x,y,z of the block data we are describing
                            { name: "blockX", type: "int" },
                            { name: "blockY", type: "int" },
                            { name: "blockZ", type: "int" },
                            { name: "data", type: "string" }
                        ]
                    }
                },
                default: []
            },
            // paste pos
            { name: "globalX", type: "int", default: 0 },
            { name: "globalY", type: "int", default: 0 },
            { name: "globalZ", type: "int", default: 0 },
            {
                // the world code stuff
                name: "worldcode",
                type: [
                    "null",
                    {
                        type: "record",
                        name: "worldcode",
                        fields: [
                            // the world code str
                            { name: "code", type: "string", default: "" },
                            // the db id of the publisher
                            { name: "dbId", type: "string", default: "" },
                            //idk what these mean, but they seem to be integers
                            { name: "someint", type: "int", default: 0 },
                            { name: "someotherint", type: "int", default: 0 },

                            // i think thats what it means
                            { name: "exportedCode", type: "boolean", default: true }
                        ]
                    }
                ],
                default: null
            },

        ]
    });
    export function assembleBloxdSchem() { }
}