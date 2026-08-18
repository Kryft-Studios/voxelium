import { nodeListToArray } from "../../helpers/arrayConversion";
import { COUNT } from "../../types/count";
import { BlockControlsManager } from "./blockControls";

export class HotbarManager {
    z_selectedEl;
    z_hotbarMembers;
    setSelected(selected: COUNT<9>){
        this.z_selectedEl.classList.remove("inven-selected");
        this.z_selectedEl=this.z_hotbarMembers[selected]
        this.z_selectedEl.classList.add("inven-selected")
    }
    constructor(
        public blockControls: BlockControlsManager,
        public el: HTMLDivElement = document.getElementById("hotbar") as HTMLDivElement
    ){
        this.z_selectedEl = el.querySelector(".inven-selected") as HTMLButtonElement;
        this.z_hotbarMembers = nodeListToArray(el.querySelectorAll("button")) as HTMLButtonElement[] & {length:10};
        document.addEventListener("keydown",(ev)=>{
            // digit key = Digit[number]
            if(ev.code[0]==="D"&&ev.code[2]==="g"){
                const NUM = +ev.code[5] as COUNT<9>
                this.setSelected(NUM);
            }
        })
    }
}