/** a helper function to zero all the properties in the object */
export default function zero(obj: any, properties: (string | symbol | number)[]) {
    for (const PROP of properties) {
        obj[PROP] = 0
    }
}