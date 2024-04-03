import { createComponentInstance, setupComponent } from "./component"

export function render (vnode, container) {
    // patch
    // 
    patch(vnode, container)
}

function patch (vnode, container) {
    // 去处理组件

    // 判断是不是element
    processComponent(vnode, container)
}

function processComponent (vnode, container) {
    mountComponent(vnode,container)
}

function mountComponent (vnode, container) {
    const instance = createComponentInstance(vnode)
    setupComponent(instance)
    setupRenderEffect(instance, container)
}

function setupRenderEffect (instance, container) {
    // 虚拟节点树
    const subTree = instance.render()
     // vnode -> patch
     // vnode -> element -> mountElement
     patch(subTree, container)
}




