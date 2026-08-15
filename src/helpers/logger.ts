
export interface Logger extends Logger.LOGGED {
}
export class Logger {
    constructor(
        public tag: string,
        /** Whether to debug or not */
        public shouldDebug: boolean = true,
        /** States if the class should end the group when you create a new one */
        public shouldAutoEndGroups: boolean = true
    ){}
    
    static z_group = false;
    static z_groupDestroyedPromise?: Promise<void>;
    group(name: string): Logger.GROUP_HANDLE{
        if(this.shouldDebug)return {end(){}};
        if(Logger.z_group) {
            Logger.z_groupDestroyedPromise ?
            // take advantage of short circuits in JS
            // since it returns Promise, we negativate it , JS will fire the next || statement
            !Promise.resolve(Logger.z_groupDestroyedPromise) 

            // now delete the promise too
            || delete Logger.z_groupDestroyedPromise :
            void 0;
        } else Logger.z_group = true
        return new Logger.GroupHandle(name);
    }
    static z_endCurrentGroup(){
        console.groupEnd();
    }
}
function c(any:Function){
    return function(this: Logger, ...a:any[]){
        if(this.shouldDebug){
            any(this.tag, " ", ...a)
        }
    }
}

Logger.prototype.debug = c(console.debug)
Logger.prototype.error = c(console.error)
Logger.prototype.log = c(console.log)
Logger.prototype.warn = c(console.warn)

export namespace Logger {
    export type LOGGED = Record<VALID_LOG_KEYS,  (...data: any[])=>void>
    export type VALID_LOG_KEYS = "warn"|"error"|"debug"|"log"
    export interface GROUP_HANDLE {
        end(): asserts this is {} & void;
    }
    export class GroupHandle implements GROUP_HANDLE {
        z_wasDestroyed: boolean = false;
        constructor(
            public label: string
        ){
            Logger.z_groupDestroyedPromise = new Promise(()=>{})
            Promise.all([Logger.z_groupDestroyedPromise]).then(()=> {
                this.z_wasDestroyed = true;
            })
            
        }
        end(){
            if(this.z_wasDestroyed)return;
            Logger.z_group = false;
            Promise.resolve(Logger.z_groupDestroyedPromise);
            delete Logger.z_groupDestroyedPromise
            console.groupEnd()
        }
    }
}
