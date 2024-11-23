import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options) {
  const { 
    createElement: hostCreateElement, 
    patchProp: hostPatchProp, 
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render(vnode, container, parentComponent) {
    // patch
    patch(null, vnode, container, parentComponent)
  }
  // n1 -> 旧的虚拟节点  n2 -> 新的虚拟节点
  function patch(n1, n2, container, parentComponent) {
    const { shapeFlag, type } = n2
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 判断是不是element
          processELement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 去处理组件
          processComponent(n1, n2, container, parentComponent)
        }
        break
    }
  }

  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2.children, container, parentComponent)
  }

  function processText(n1, n2, container) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processELement(n1, n2, container, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container, parentComponent)
    }
  }

  function patchElement (n1, n2, container, parentComponent) {
    console.log("update");
    console.log("old:",n1)
    console.log("new:",n2)

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren (n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag
    const {shapeFlag} = n2
    const c2 = n2.children
    const c1 = n1.children
    // Array -> Text  和 Text -> Text 情况
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //1. 把老的children清空
        unmountChildren(n1.children)
      }
      if (c1 !== c2) {
        //2. 设置text
        hostSetElementText(container, c2)
      }
    } else {
      if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "")
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unmountChildren (children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      hostRemove(el)
    }
  }

  function patchProps (el, oldProps, newProps) {
    if(oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
  
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
      if(oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  function mountElement(vnode, container, parentComponent) {
    // 创建标签
    const el = (vnode.el = hostCreateElement(vnode.type))
    // 处理children
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // string类型
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // array类型以新建的 el 作为父容器进行遍历挂载
      mountChildren(vnode.children, el, parentComponent)
    }
    // 处理props,设置标签属性
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }
    // 新标签添加到容器标签内部
    hostInsert(el, container)
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      // 此时的 container 已经由 rootContainer 变成了新建的 el
      patch(null, v, container, parentComponent)
    })
  }

  function processComponent(n1, n2, container, parentComponent) {
    // 挂载组件
    mountComponent(n2, container, parentComponent)
  }

  function mountComponent(initialVNode, container, parentComponent) {
    // 创建组件实例 instance
    const instance = createComponentInstance(initialVNode, parentComponent)
    // 安装组件
    setupComponent(instance)
    // 执行组件 render 函数，把返回的 vnode 再次传给 patch 递归
    setupRenderEffect(instance, initialVNode, container, parentComponent)
  }

  function setupRenderEffect(instance, initialVNode, container, parentComponent) {
    // 虚拟节点树
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance
        // 使render的this指向proxy
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance) // 把 render 返回的子 vnode 传给 patch 渲染
        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        const { proxy } = instance
        const subTree = instance.render.call(proxy)
        const preSubTree = instance.subTree
        instance.subTree = subTree

        patch(preSubTree, subTree, container, instance)
        
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
