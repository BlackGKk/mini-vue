import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { createAppAPI } from './createApp'
import { queueJobs } from './scheduler'
import { Fragment, Text } from './vnode'

export function createRenderer(options) {
  const { 
    createElement: hostCreateElement, 
    patchProp: hostPatchProp, 
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render(vnode, container) {
    // patch
    patch(null, vnode, container, null, null)
  }
  // n1 -> 旧的虚拟节点  n2 -> 新的虚拟节点
  function patch(n1, n2, container, parentComponent, anchor) {
    console.log(n2);
    
    const { shapeFlag, type } = n2
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 判断是不是element
          processELement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 去处理组件
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processText(n1, n2, container) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processELement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function patchElement (n1, n2, container, parentComponent, anchor) {
    console.log("update");
    console.log("old:",n1)
    console.log("new:",n2)

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren (n1, n2, container, parentComponent, anchor) {
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
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        //array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren (c1, c2, container, parentComponent, parentAnchor) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    function isSameVNodeType(n1, n2) {
       return n1.type === n2.type && n1.key === n2.key;
    }
    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if(isSameVNodeType(n1,n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      }else {
        break;
      }
      i++;
    }

    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if(isSameVNodeType(n1,n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      }else {
        break;
      }
      e1--;
      e2--;
    }

    // 3.新的比老的多 创建新的
    if(i > e1) {
      if(i <= e2) {
        const nextPos = e2 + 1 
        const anchor =  nextPos < c2.length ? c2[nextPos].el : null
        
        while( i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if(i > e2){ //老的比新的长 删除老的
      while(i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      //对比中间的部分
      let s1 = i;
      let s2 = i;

      const toBePatched = e2 - s2 + 1; //新child中间节点的个数
      let patched = 0
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched)
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0
      }
      // 建立新child的keyMAP
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      // 比对旧child与新child
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        // 如果已经patch的节点个数超过新child中间节点的个数，则后面的节点直接删除
        if(patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
           newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {  
          for (let j = s2; j <= e2; j++) {
            if(isSameVNodeType(prevChild,c2[j])) {
              newIndex = j;
              break;
            }            
          }
        }
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        }else {
          if(newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          }else {
            moved = true
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBePatched-1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
        if(newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        }else if(moved) {
          if(j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor)
          }else {
            j--;
          }
        }
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

  function mountElement(vnode, container, parentComponent, anchor) {
    // 创建标签
    const el = (vnode.el = hostCreateElement(vnode.type))
    // 处理children
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // string类型
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // array类型以新建的 el 作为父容器进行遍历挂载
      mountChildren(vnode.children, el, parentComponent, anchor)
    }
    // 处理props,设置标签属性
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }
    // 新标签添加到容器标签内部
    hostInsert(el, container, anchor)
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      // 此时的 container 已经由 rootContainer 变成了新建的 el
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // 挂载组件
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent (n1, n2) {
    const instance = (n2.component = n1.component);
    if(shouldUpdateComponent(n1,n2)) {
      instance.next = n2;
      instance.update();
    }else {
      n2.el = n1.el;
      instance.vnode = n2; 
    }
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 创建组件实例 instance
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent))
    // 安装组件
    setupComponent(instance)
    // 执行组件 render 函数，把返回的 vnode 再次传给 patch 递归
    setupRenderEffect(instance, initialVNode, container, parentComponent, anchor)
  }

  function setupRenderEffect(instance, initialVNode, container, parentComponent, anchor) {
    // 虚拟节点树
    instance.update = effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance
        // 使render的this指向proxy
        const subTree = (instance.subTree = instance.render.call(proxy, proxy))
        // vnode -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance, anchor) // 把 render 返回的子 vnode 传给 patch 渲染
        // 经过 patch 之后，subTree 获得了 el
        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        console.log("update")
        const {next, vnode} = instance
        if (next) {
          next.el = vnode.el
          updateComponentPreRender(instance,next)
        }

        const { proxy } = instance
        const subTree = instance.render.call(proxy, proxy)
        const preSubTree = instance.subTree
        instance.subTree = subTree

        patch(preSubTree, subTree, container, instance, anchor)
        
      }
    },{
      scheduler() {
        console.log("update");
        queueJobs(instance.update)
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}

function updateComponentPreRender (instance, nextVnode) {
  instance.vnode = nextVnode;
  instance.next = null;
  instance.props = nextVnode.props;
}

// 求最长递增序列算法
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}