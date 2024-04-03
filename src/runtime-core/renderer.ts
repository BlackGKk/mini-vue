import { createComponentInstance, setupComponent } from "./component"

export function render (vnode, container) {
    // patch
    // 
    patch(vnode, container)
}

function patch (vnode, container) {
    // 去处理组件
    processComponent(vnode, container)
}

function processComponent (vnode, container) {
    mountComponent(vnode)
}

function mountComponent (vnode) {
    const instance = createComponentInstance(vnode)
    setupComponent(instance);
}




