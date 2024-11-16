import { extend } from "../shared";
let activeEffect;
let shouldTrack; // 解决 ++运算符触发 get -> track，只有在 set->trigger时触发 track

export class ReactiveEffect {
    private _fn:any;
    deps = [];
    active = true; //判断是否stop
    onStop?: () => void;
    public scheduler: Function | undefined;
    constructor(fn,scheduler?: Function) {
        this._fn = fn;
        this.scheduler = scheduler
    }
    run() {
         // 调用stop后，防止往下走继续对 activeEffect 赋值，防止继续收集依赖
        if(!this.active){
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;

        const result = this._fn()
        //reset
        shouldTrack = false;
        return result;
    }

    stop() {
        if(this.active){
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false; // 关闭依赖收集开关
        }
    }
}

//清除收集到的依赖
function cleanupEffect (effect) {
    // 通过反向收集到的 deps 集合，遍历获取当前的 activeEffect，一一删除
    effect.deps.forEach((dep: any) => {
        dep.delete(effect);
    });
    // 当前的 activeEffect 不存在任何依赖关系
    effect.deps.length = 0;
}

// 判断是否达到可以收集的条件
export function isTracking() {
    return shouldTrack && activeEffect != undefined;
}

const targetMap = new Map()
export function track(target, key) {//依赖收集&追踪
    // 如果当前不是 set->trigger->effect.run->fn()触发的 或者不存在 activeEffect，就不做依赖收集
    if(!isTracking()) return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if(!depsMap){
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if(!dep){
        dep = new Set();
        depsMap.set(key, dep)
    }
    // 将依赖添加到dep中，反向收集到deps中
    trackEffects(dep)
}
// 
export function trackEffects(dep){
    //看看 dep 之前有没有添加过，添加过的话就不添加了
    if(dep.has(activeEffect)) return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep)
}

export function trigger (target, key){
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    //更新所有依赖
    triggerEffects(dep);
}

export function triggerEffects(dep) {
    for (const effect of dep) {
        if(effect.scheduler) {
            effect.scheduler();
        } else {
            effect.run();
        }
    }
}

export function effect(fn, options:any = {}) {
    // 创建一个实例存储fn
    const _effect = new ReactiveEffect(fn, options?.scheduler);
    //extend携带的options（如scheduler、onStop等）
    extend(_effect,options)
    _effect.run();

    const runner: any = _effect.run.bind(_effect);
    runner.effect = _effect;

    return runner;
}

export function stop (runner) {
    runner.effect.stop()
}