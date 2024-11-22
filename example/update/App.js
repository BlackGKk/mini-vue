import { h, ref } from '../../lib/guide-mini-vue.esm.js'
export const App = {
  name: 'APP',
  setup() {
    const count = ref(0)
    const onClick = () => {
      console.log(count.value);
      count.value++
    }
    const props = ref({
      foo: "foo",
      bar: "bar"
    })
    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    }
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    }
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: "foo"
      };
    }
    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
        ...this.props
      },
      [
        h('div', {}, 'count: ' + this.count), // 依赖收集
        h('button', { onClick: this.onClick }, 'click'),
        h('button', { onClick: this.onChangePropsDemo1 }, 'ChangeProp - 值改变了 - 修改'),
        h('button', { onClick: this.onChangePropsDemo2 }, 'ChangeProp - 值变成了undefined - 删除'),
        h('button', { onClick: this.onChangePropsDemo3 }, 'ChangeProp - key 在新的里面没有了 - 删除'),
      ]
    )
  },
}