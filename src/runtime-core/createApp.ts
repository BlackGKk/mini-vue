import { createVNode } from "./vnode"
export function createApp (rootComponent) {
    return {
        mount(rootContainer) {
            // 先转换为 vnode
            // component -> vnode
            // 所有的逻辑操作 都会基于vnode处理
            const vnode = createVNode(rootComponent)

        }
    }
}