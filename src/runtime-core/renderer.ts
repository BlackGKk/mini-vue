import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vnode"

export function render (vnode, container) {
    // patch
    // 
    patch(vnode, container)
}

function patch (vnode, container) {
    const {shapeFlag, type} = vnode
    switch (type) {
        case Fragment:
            processFragment(vnode,container)
          break;
        case Text:
            processText(vnode,container)
          break;  
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                // 判断是不是element
                processELement(vnode, container)
            }else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT){
                // 去处理组件
                processComponent(vnode, container)
            }
          break;        
    }
}

function processFragment (vnode, container) {
    mountChildren(vnode,container)
}

function processText (vnode, container) {
    const {children} = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}

function processELement (vnode, container) {
    mountElement(vnode, container)
}

function mountElement (vnode, container){
    const el = (vnode.el =  document.createElement(vnode.type))
    // 处理children
    const { children,shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN){
        // string类型
        el.textContent = children;
    }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // array类型进行遍历挂载
        mountChildren(vnode, el)
    }
    // 处理props
    const {props} = vnode;
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key) // 满足on+大写字母开头 即为注册事件
        if(isOn(key)) {
            //注册事件
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event,val);
        }else {
            el.setAttribute(key, val);
        }
    }
    container.append(el)
}

function mountChildren (vnode, container) {
    vnode.children.forEach(v => {
        patch(v,container)
    })
}

function processComponent (initialVNode, container) {
    mountComponent(initialVNode,container)
}

function mountComponent (initialVNode, container) {
    const instance = createComponentInstance(initialVNode)
    setupComponent(instance)
    setupRenderEffect(instance, initialVNode ,container)
}

function setupRenderEffect (instance, initialVNode ,container) {
    // 虚拟节点树
    const { proxy } = instance;
    // 使render的this指向proxy
    const subTree = instance.render.call(proxy)
     // vnode -> patch
     // vnode -> element -> mountElement
     patch(subTree, container)
     initialVNode.el = subTree.el
}




