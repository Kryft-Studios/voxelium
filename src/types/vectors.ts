// i dont know how i got this working
export type REC_<T, MAX extends number, U extends T[] = []> = U["length"] extends MAX ? U : REC_<T, MAX, [T,...U]>
export type VEC<NUM extends number> = REC_<number, NUM>
export type VEC3 = VEC<3>
export type VEC2 = VEC<2>
export type VEC4 = VEC<4>