import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'
export const App = {
  name: 'App',
  render() {
    const app = h('div', {}, 'App')
    const foo = h(
      Foo,
      {},
      {
        header: ({age}) => [h('p', {}, 'header' + age), createTextVNode("text节点")],
        footer: () => h('p', {}, 'footer'),
        default: () => h('p', {}, 'default1'),
      }
    )
    return h('div', {}, [app, foo])
  },
  setup() {
    return {}
  },
}
