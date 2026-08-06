// THIRD PARTY ---- imported because voxel-crunch doesnt have .d.ts types.
// im bored, im gonna descript this file
import * as bits from "./bittwiddle"

type UintArray =  Uint8Array | Uint16Array | Uint32Array
function size(chunk: number[]) {
  // size var
  let count = 0
  // amt of blocks in chunk
  let chunk_len = chunk.length

  // v = empty var declared for no redeclaration of v = chunk[i]. Probably for performance reasons?
  // i have renamed it to `currentBlock`
  let currentBlock!: number, 
  // 
      l

  for(let i=0; 
      i < chunk_len; 
      // Don't increment this. This is incremented in the while loop below
    ) {
    currentBlock = chunk[i]
    l = 0
    while(i < chunk_len && chunk[i] === currentBlock) {
      ++i
      ++l
    }
    // 0 to convert to int32 (remove floats)
    count += (bits.log2(l) / 7)|0
    count += (bits.log2(currentBlock>>>0) / 7)|0
    count += 2
  }
  return count
}

function encode(chunk: number[], runs?: UintArray) {
// use modern operator "??=" instead of if(!runs)
  runs ??= new Uint8Array(size(chunk))

  var rptr = 0, nruns = runs.length
  var i = 0, v, l
  while(i<chunk.length) {
    v = chunk[i]
    l = 0
    while(i < chunk.length && chunk[i] === v) {
      ++i
      ++l
    }
    while(rptr < nruns && l >= 128) {
      runs[rptr++] = 128 + (l&0x7f)
      l >>>= 7
    }
    if(rptr >= nruns) {
      throw new Error("RLE buffer overflow")
    }
    runs[rptr++] = l
    v >>>= 0
    while(rptr < nruns && v >= 128) {
      runs[rptr++] = 128 + (v&0x7f)
      v >>>= 7
    }
    if(rptr >= nruns) {
      throw new Error("RLE buffer overflow")
    }
    runs[rptr++] = v
  }
  return runs
}
function decode(runs: UintArray, chunk: number[]) {
  var buf_len = chunk.length
  var nruns = runs.length
  var cptr = 0
  var ptr = 0
  var l, s, v, i
  while(ptr < nruns) {
    l = 0
    s = 0
    while(ptr < nruns && runs[ptr] >= 128) {
      l += (runs[ptr++]&0x7f) << s
      s += 7
    }
    l += runs[ptr++] << s
    if(ptr >= nruns) {
      throw new Error("RLE buffer underrun")
    }
    if(cptr + l > buf_len) {
      throw new Error("Chunk buffer overflow")
    }
    v = 0
    s = 0
    while(ptr < nruns && runs[ptr] >= 128) {
      v += (runs[ptr++]&0x7f) << s
      s += 7
    }
    if(ptr >= nruns) {
      throw new Error("RLE buffer underrun")
    }
    v += runs[ptr++] << s
    for(i=0; i<l; ++i) {
      chunk[cptr++] = v
    }
  }
  return chunk
}
export {decode,encode,size}
