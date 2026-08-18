// THIRD PARTY ---- imported because voxel-crunch doesnt have .d.ts types.

/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

"use strict"; "use restrict";

export function log2 (v: number) {
    let r, shift;
    //@ts-ignore
    r = (v > 0xFFFF) << 4; v >>>= r;
    //@ts-ignore

    shift = (v > 0xFF) << 3; v >>>= shift; r |= shift;
    //@ts-ignore

    shift = (v > 0xF) << 2; v >>>= shift; r |= shift;
    //@ts-ignore

    shift = (v > 0x3) << 1; v >>>= shift; r |= shift;
    return r | (v >> 1);
}