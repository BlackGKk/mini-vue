import { h } from "../../lib/guide-mini-vue.esm.js"
export const Foo = {
    setup(props, {emit}) {
      const emitAdd = () => {
        console.log("emit add")
        emit("add");
      }
      const emitAddFoo = () => {
        console.log("emit add-foo")
        emit("add-foo");
      }
      return {
        emitAdd,
        emitAddFoo
      }
    },
    render() {
      const btn = h("button",{
        onClick: this.emitAdd
      },
      "emitAdd"
      )
      const btn1 = h("button",{
        onClick: this.emitAddFoo
      },
      "emitAdd"
      )
      const foo = h('p',{},"foo")
      return h("div",{}, [foo,btn,btn1])
    }
}