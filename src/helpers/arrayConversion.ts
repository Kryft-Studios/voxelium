export function nodeListToArray<T extends Node>(nodeList: NodeListOf<T>): T[] {
    return iteratorToArray(nodeList.values())
}
export function iteratorToArray<T>(iterator: Iterator<T>):T[]{
    let iter: IteratorResult<T> = iterator.next();
    const ARRAY: T[] = []
    while(!iter.done){
        ARRAY.push(iter.value);
        iter = iterator.next()
    }
    return ARRAY;
}