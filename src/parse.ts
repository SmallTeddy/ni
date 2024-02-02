import type { Agent, Command } from './agents'
import { AGENTS } from './agents'
import { exclude } from './utils'
import type { Runner } from './runner'

// 导出一个UnsupportedCommand类，继承自Error类
export class UnsupportedCommand extends Error {
  // 构造函数，接收一个agent和command参数
  constructor({ agent, command }: { agent: Agent, command: Command }) {
    // 调用父类Error的构造函数，传入一个字符串，表示agent和command
    super(`Command "${command}" is not support by agent "${agent}"`)
  }
}

// 获取命令
// 导出一个函数，用于获取命令
export function getCommand(
  // agent：Agent类型
  agent: Agent,
  // command：Command类型
  command: Command,
  // args：字符串数组，默认值为空数组
  args: string[] = [],
) {
  // 如果agent不在AGENTS中，抛出错误
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  // 从AGENTS中获取agent对应的命令
  const c = AGENTS[agent][command]

  // 如果命令是函数，则返回函数执行结果
  if (typeof c === 'function')
    return c(args)

  // 如果命令不存在，则抛出错误
  if (!c)
    throw new UnsupportedCommand({ agent, command })

  // 定义一个函数，用于判断参数是否需要引号
  const quote = (arg: string) => (!arg.startsWith('--') && arg.includes(' '))
    ? JSON.stringify(arg)
    : arg

  // 返回替换参数后的命令，并去除两端空格
  return c.replace('{0}', args.map(quote).join(' ')).trim()
}

// 解析 ni 命令
// 导出一个函数，用于解析Ni
export const parseNi = <Runner>((agent, args, ctx) => {
  // bun 使用 `-d` 替代 `-D`，#90
  if (agent === 'bun')
    args = args.map(i => i === '-D' ? '-d' : i)

  // 全局命令
  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  // 如果存在 --frozen-if-present，则忽略它
  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return getCommand(agent, ctx?.hasLock ? 'frozen' : 'install', args)
  }

  // 如果存在 --frozen，则忽略它
  if (args.includes('--frozen'))
    return getCommand(agent, 'frozen', exclude(args, '--frozen'))

  // 如果没有参数或者参数以 - 开头，则安装
  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return getCommand(agent, 'install', args)

  // 否则添加
  return getCommand(agent, 'add', args)
})

// 解析 nr 命令
// 导出一个函数，用于解析参数
export const parseNr = <Runner>((agent, args) => {
  // 如果参数列表为空，则添加参数'start'
  if (args.length === 0)
    args.push('start')

  // 如果参数列表中包含'--if-present'，则从参数列表中删除'--if-present'，并将第一个参数添加到'--if-present'后面
  if (args.includes('--if-present')) {
    args = exclude(args, '--if-present')
    args[0] = `--if-present ${args[0]}`
  }

  // 返回执行agent的run命令
  return getCommand(agent, 'run', args)
})

// 解析 nu 命令
export const parseNu = <Runner>((agent, args) => {
  // 如果参数中包含 -i，则返回升级交互式命令
  if (args.includes('-i'))
    return getCommand(agent, 'upgrade-interactive', exclude(args, '-i'))

  // 否则返回升级命令
  return getCommand(agent, 'upgrade', args)
})

// 解析 nun 命令
export const parseNun = <Runner>((agent, args) => {
  // 如果参数中包含 -g，则返回全局卸载命令
  if (args.includes('-g'))
    return getCommand(agent, 'global_uninstall', exclude(args, '-g'))
  // 否则返回卸载命令
  return getCommand(agent, 'uninstall', args)
})

// 解析 nlx 命令
export const parseNlx = <Runner>((agent, args) => {
  // 返回执行命令
  return getCommand(agent, 'execute', args)
})

// 解析 na 命令
export const parseNa = <Runner>((agent, args) => {
  // 返回代理命令
  return getCommand(agent, 'agent', args)
})
