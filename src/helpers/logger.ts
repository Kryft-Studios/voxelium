
export interface Logger extends Logger.LOGGED {
}
/** Helper for logging in debug mode. you can easily switch debugging by doing .shouldDebug = false */
export class Logger {
    constructor(
        /** The tag e.g. VXWorldStorage */
        public tag: string,
        /** Whether to debug or not */
        public shouldDebug: boolean = true,
        /** States if the class should end the group when you create a new one */
        public shouldAutoEndGroups: boolean = true
    ){}
    
    /** If there is any active console group */
    static z_group = false;

    /** Internal promise, provided for GroupHandle to know if the group it made was destroyed */
    static z_groupDestroyedPromise?: Promise<void>;

    /** Helper for creating groups in Console */
    group(name: string): Logger.GROUP_HANDLE{
        // if you cant debug than just return
        if(!this.shouldDebug)return {end(){}};

        // check if there is already a group
        if(Logger.z_group) {
            Logger.z_groupDestroyedPromise ?
            // take advantage of short circuits in JS
            // since it returns Promise, we negativate it , JS will fire the next || statement
            !Promise.resolve(Logger.z_groupDestroyedPromise) 

            // now delete the promise too
            || delete Logger.z_groupDestroyedPromise :
            void 0;

            // z_group is already true, no need 2 set it again
        } else 
            // else just create a group
            Logger.z_group = true
        return new Logger.GroupHandle(name);
    }
}
/**  helper function for creating console.*(...) wrappers */
function c(any:Function){
    return function(this: Logger, ...a:any[]){
        if(this.shouldDebug){
            any("[",this.tag, "] ", ...a)
        }
    }
}

// all the console[VALID_LOG_KEYS] implemented
Logger.prototype.debug = c(console.debug)
Logger.prototype.error = c(console.error)
Logger.prototype.log = c(console.log)
Logger.prototype.warn = c(console.warn)

export namespace Logger {
    // console.*
    export type LOGGED = Record<VALID_LOG_KEYS,  (...data: any[])=>void>
    export type VALID_LOG_KEYS = "warn"|"error"|"debug"|"log"
    
    // a group handle.
    export interface GROUP_HANDLE {
        /** End the group. you cannot end it again. */
        end(): asserts this is {} & void;
    }
    export class GroupHandle implements GROUP_HANDLE {
        /** if the group is already destroyed */
        z_wasDestroyed: boolean = false;

        constructor(
            public label: string
        ){
            // asign the group destroyed promise
            Logger.z_groupDestroyedPromise = new Promise(()=>{})
            
            // when the group is destroyed, inform
            Logger.z_groupDestroyedPromise.then(()=> {
                this.z_wasDestroyed = true;
            })
        }
        end(){
            // if the group is already destroyed
            if(this.z_wasDestroyed)return;

            // else destruct
            Logger.z_group = false;
            delete Logger.z_groupDestroyedPromise

            // inform
            Promise.resolve(Logger.z_groupDestroyedPromise);
            
            // realy do it
            console.groupEnd()
        }
    }
}
