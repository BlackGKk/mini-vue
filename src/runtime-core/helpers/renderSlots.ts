import { createVNode, Fragment } from '../vnode'

export function renderSlots(slots, name, props) {
  console.log(slots);
  const slot = slots[name]
  
  if (slot) {
    if(typeof slot === "function") {
      return createVNode(Fragment, {}, slot(props))
    }
  }
}
