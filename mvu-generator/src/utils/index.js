export const formatNotImplemented = (...args) => {
  console.warn('工具函数尚未实现', ...args)
  return args.join(' ')
}

export default {
  formatNotImplemented,
}
