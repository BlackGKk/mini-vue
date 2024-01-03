import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive"
//常量化 避免每次都要创建get或set
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

//创建get
function createGetter(isReadonly = false) {
    return function get(target, key) {
        if(key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        }else if(key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const res = Reflect.get(target, key);
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}

//创建set
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);

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