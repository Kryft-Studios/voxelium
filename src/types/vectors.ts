// i dont know how i got this working
export type Recursive_<T, MAX extends number, U extends T[] = []> = U["length"] extends MAX ? U : Recursive_<T, MAX, [T,...U]>
export type Vector<NUM extends number> = Recursive_<number, NUM>
export type Vector3 = Vector<3>
export type Vector2 = Vector<2>
export type Vector4 = Vector<4>