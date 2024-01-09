import { reactive } from "../reactive";
import { effect, stop } from "../effect";
describe('effect', () => {
    it('happy path', () => {
        const user = reactive({
            age: 10,
        });

        let nextAge;
        effect(() => {
            nextAge = user.age + 1;
        });

        expect(nextAge).toBe(11);

        //update
        user.age++;
        expect(nextAge).toBe(12);
    });

    it('runner', () => {
        //effect(fn) -> function (runner) -> fn -> return
        let foo = 10;
        const runner = effect(() => {
            foo++;
            return "foo";
        })
        expect(foo).toBe(11);
        const r = runner();
        expect(foo).toBe(12);
        expect(r).toBe("foo");
    });

    it('scheduler', () => {
        let dummy;
        let run: any;
        const scheduler = jest.fn(() => {
            run = runner;
        });
        const obj = reactive({ foo: 1 });
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            { scheduler }
        );
        expect(scheduler).not.toHaveBeenCalled();
        expect(dummy).toBe(1);
        // 在第一次trigger的时候被触发
        obj.foo++;
        expect(scheduler).toHaveBeenCalledTimes(1);
        // 未执行run前
        expect(dummy).toBe(1);
        // 执行run后
        run();
        // 更新
        expect(dummy).toBe(2);
    });

    it("stop", () => {
        let dummy;
        let obj = reactive({ prop: 1 });
        const runner = effect(() => {
            dummy = obj.prop;
        });
        obj.prop = 2;
        expect(dummy).toBe(2);
        stop(runner);
        // obj.prop = 3;
        obj.prop++;
        expect(dummy).toBe(2);

        // 停止的effect仍应可手动调用
        runner();
        expect(dummy).toBe(3);
    })
    
    it('onStop', () => {
        let obj = reactive({ prop: 1 });
        const onStop = jest.fn();
        let dummy;
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            {
                onStop,
            }
        );
        stop(runner);
        expect(onStop).toHaveBeenCalledTimes(1);
    });
});