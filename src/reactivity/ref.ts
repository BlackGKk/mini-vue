import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _value: any;
    public dep;
    private _rawValue: any;
    public __v_isRef = true;
    constructor(value) {
        // 存储原始值，方便后续与新值对比
        this._rawValue = value;
        // value -> reactive
        //判断value是不是对象
        this._value = convert(value)
        this.dep = new Set();
    }
    get value() {
        // 收集依赖
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        if(hasChanged(this._rawValue, newVal)){
            this._rawValue = newVal;
            this._value = convert(newVal)
            triggerEffects(this.dep);
        }
    }
}

// 判断value是不是对象，进行转换
function convert(value) {
    return isObject(value)? reactive(value): value;
}

// 收集依赖
function trackRefValue(ref) {
    if( isTracking() ) {
        trackEffects(ref.dep);
    }
}

export function ref(value) {
    return new RefImpl(value);
}

export function isRef(ref) {
    return !!ref.__v_isRef
}

export function unRef(ref) {
    // 看看是不是 ref -> ref.value
    // ref
    return isRef(ref)? ref.value : ref;
}