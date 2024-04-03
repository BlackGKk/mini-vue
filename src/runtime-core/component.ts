export function createComponentInstance (vnode) {
    const component = {
        vnode
    }
    return component
}

export function setupComponent (instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance)
}

function setupStatefulComponent (instance) {
    const Component = instance.vnode.type
    const { setup } = Component
    if(setup) {
        const setupResult = setup()
    }
}