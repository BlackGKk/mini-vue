import { h, provide, inject } from '../../lib/guide-mini-vue.esm.js'

const Provider = {
  name: "Provider",
  setup() {
    provide("foo","fooVal")
    provide("bar","barVal")
  },
  render() {
    return h("div",{},[h("p",{},"Provider"),h(ProviderTwo)])
  }
}

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo","fooTwo")
    const foo = inject("foo")
    return {
      foo
    }
  },
  render() {
    return h("div",{},[h("p",{},"ProviderTwo:  "+ this.foo),h(ProviderThree)])
  }
}

const ProviderThree = {
  name: "ProviderThree",
  setup() {
    const test = inject("test",()=> {return "111"})
    return {
      test
    }
  },
  render() {
    return h("div",{},[h("p",{},"ProviderThree:  "+this.test),h(Consumer)])
  }
}

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo")
    const bar = inject("bar")
    return {
      foo,
      bar
    }
  },
  render() {
    return h("div",{},`Consumer:- ${this.foo} - ${this.bar}`)
  }
}

export const App = {
  name: 'App',
  setup() {},
  render() {
    return h('div', {}, [h("p",{},"apiInject"),h(Provider)])
  }
}