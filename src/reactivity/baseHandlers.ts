import { track, trigger } from "./effect";
import { ReactiveFlags, reactive, readonly } from "./reactive"
import { extend, isObject } from "../shared";
//常量化 避免每次都要创建get或set
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true,true)

//创建get
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if(key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        }else if(key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const res = Reflect.get(target, key);
        // 如果数据是浅层只读，那么不用做依赖收集和深层监听
        if (isReadonly && shallow) {
            return res;
        }

        // 看看res是不是obejct，继续对嵌套对象进行响应式数据监听
        if(isObject(res)){
            return isReadonly ? readonly(res) : reactive(res);  
        }

        if (!isReadonly) {
            // 依赖收集
            track(target, key);
        }
        return res;
    };
}

//创建set
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    }
}

// 可变的
export const mutableHandlers = {
    get,
    set
} 

// 只读
export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败 因为 target 是readonly`,target)
        return true;
    }
}

// 浅只读
export const shallowReadonlyHandlers = extend({},readonlyHandlers,{
    get: shallowReadonlyGet
})