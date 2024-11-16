import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"
window.self = null
export const App = {
    render() {
        window.self = this
        return h(
            "div",
            {
                id:"root",
                class: ["red","hard"],
                onCLick() {
                    console.log("click");
                    
                }
            },
            [h("div",{class: "red"},"hi, "+ this.msg),h(Foo,{count:1})]
        )
    },
    setup() {
        return {
            msg:"mini-vue"
        }
    }
}