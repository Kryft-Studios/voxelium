import { NOA } from "../../scenemgmt/initialRegister";
import { DESKTOPKEY } from "../../types/keys";

export namespace NoaEventRegisterer {
    /** 
     * registers a key bind with a whenDown checker too
    */
    export function registerKey$downev(
        keys: DESKTOPKEY[] | DESKTOPKEY,
        event: string,
        whenDown: () => any
    ) {
        registerKey(keys, event);

        // register the down ev
        NOA.inputs.down.on(event, whenDown)
    };
    export function registerKey(keys: DESKTOPKEY[] | DESKTOPKEY, event: string) {

        // make a array
        const KEYLS = Array.isArray(keys) ? keys : [keys];
        
        // register it w/ noa
        NOA.inputs.bind(event, ...KEYLS);
    }
    /** register a key with a tick ev */
    export function registerKey$tick(
        keys: DESKTOPKEY[] | DESKTOPKEY,
        event: string,
        onFire: Function,
        onStopFire: Function
    ) {
        registerKey(keys, event);
        
        // initially, if its fired
        // or else, false
        let firedState = !!NOA.inputs.state[event]
        
        // register a new tick ev
        NOA.on("tick", () => {
            // if down, fire the tick ev
            if (NOA.inputs.state[event]) {
                onFire();
                // set fired to true
                firedState = true;
            } else {
                // if it was previously fired
                if (firedState) {
                    onStopFire();
                }
                firedState = false;
            }
        })
    }
}