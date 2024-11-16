import { hasOwn } from "../shared";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el
}

export const PublicInstanceProxyHandlers = {
  //_别名更换为instance
  get({ _: instance}, key){
    //setupState
    const { setupState, props } = instance
    if(hasOwn(setupState,key)) {
      return setupState[key];
    }else if(hasOwn(props,key)) {
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key]
    if(publicGetter) {
      return publicGetter(instance)
    }
}
}