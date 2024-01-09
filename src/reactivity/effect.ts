import { extend } from "../shared";
let activeEffect;
let shouldTrack;

class ReactiveEffect {
    private _fn:any;
    deps = [];
    active = true; //判断是否stop
    onStop?: () => void;
    constructor(fn) {
        this._fn = fn;
    }
    run() {
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
            this.active = false;
        }
    }
}

//清除收集到的依赖
function cleanupEffect (effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}

const targetMap = new Map()
export function track(target, key) {//依赖收集&追踪
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

// 判断是否达到可以收集的条件
export function isTracking() {
    return shouldTrack && activeEffect != undefined;
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
    const _effect = new ReactiveEffect(fn);
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