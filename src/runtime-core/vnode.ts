import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode (type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlags(type), // 初步根据 type 判断 shapeFlag
        el: null
    }
    // 针对 children 进一步判断 shapeFlag
    if(typeof children ==="string") {
        // 使用 | 运算符，这样就能兼顾 type 和 children
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }else if(Array.isArray(children) ) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }

    // slot 组件+ children是object
    if(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if(typeof children === "object") {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
        }
    }
    return vnode;
}

export function createTextVNode (text:string) {
    return createVNode(Text, {}, text)
}

function getShapeFlags (type) {
     return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}