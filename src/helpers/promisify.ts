/** A helper function to convert a IDBRequest into a promise */
export function promisifyIDBRequest<RET>(
    req: IDBRequest<RET>
): Promise<RET> {
    return new Promise((resolve, reject) => {
        req.addEventListener("success", () => resolve(req.result));
        req.addEventListener("error", () => reject(req.error));
    });
}