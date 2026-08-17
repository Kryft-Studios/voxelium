/**
 * Promisify functions
 */
/** waits for a given amount of time */
export function wait(
    ms: number
) {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}
export function promisifyEventListener(
    eventListener: Function,
    eventName: string,
) {
    return new Promise<void>((resolve) => [
        eventListener(eventName, () => {
            resolve()
        })
    ])
}
export type EVENT_LISTENER = (eventName: string, listener: Function) => any;

export function interval(
    times: number,
    time: number,
    doTask?: (timesDone: number) => any
) {
    return new Promise<void>((resolve) => {
        let timesDone = 0;
        let interval!: NodeJS.Timeout;
        interval = setInterval(() => {
            timesDone++
            doTask?.(timesDone);
            if (timesDone >= times) return clearInterval(interval), resolve();
        }, time)
    })
}