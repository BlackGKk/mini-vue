export const extend = Object.assign

export const EMPTY_OBJ = {}

// 判断传入的值是否是object
export const isObject = (val) => {
  return val != null && typeof val === 'object'
}

// 判断旧值和新值是否发生改变
export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal)
}

// 判断val中是否有key值
export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

// 转换为驼峰命名法
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : ''
  })
}

// 首字母大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 为单词首部拼接on
export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : ''
}
