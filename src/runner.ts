/* eslint-disable no-console */
import { resolve } from 'node:path'
import process from 'node:process'
import prompts from '@posva/prompts'
import type { Options as ExecaOptions } from 'execa'
import { execaCommand } from 'execa'
import c from 'kleur'
import { version } from '../package.json'
import type { Agent } from './agents'
import { agents } from './agents'
import { getDefaultAgent, getGlobalAgent } from './config'
import type { DetectOptions } from './detect'
import { detect } from './detect'
import { getVoltaPrefix, remove } from './utils'
import { UnsupportedCommand, getCommand } from './parse'

const DEBUG_SIGN = '?' // 调试标志

// 导出接口RunnerContext，用于存储运行器上下文信息
export interface RunnerContext {
  programmatic?: boolean // 是否以编程方式运行
  hasLock?: boolean // 是否存在锁文件
  cwd?: string // 当前工作目录
}

// 导出类型Runner，用于存储运行器函数
export type Runner = (agent: Agent, args: string[], ctx?: RunnerContext) => Promise<string | undefined> | string | undefined

// 导出异步函数runCli，用于运行命令行
export async function runCli(fn: Runner, options: DetectOptions & { args?: string[] } = {}) {
  // 从options中获取参数args，默认为process.argv.slice(2)
  const {
    args = process.argv.slice(2).filter(Boolean),
  } = options
  try {
    // 运行fn函数，参数args和options
    await run(fn, args, options)
  }
  catch (error) {
    // 如果抛出UnsupportedCommand错误，并且options.programmatic为false，则输出错误信息
    if (error instanceof UnsupportedCommand && !options.programmatic)
      console.log(c.red(`\u2717 ${error.message}`))

    // 如果options.programmatic为false，则退出进程
    if (!options.programmatic)
      process.exit(1)

    // 抛出错误
    throw error
  }
}

// 导出一个异步函数，用于获取命令行命令
export async function getCliCommand(
  // fn：运行器
  fn: Runner,
  // args：字符串数组
  args: string[],
  // options：检测选项，默认为空对象
  options: DetectOptions = {},
  // cwd：当前工作目录，默认为options.cwd，如果options.cwd不存在，则默认为当前进程工作目录
  cwd: string = options.cwd ?? process.cwd(),
) {
  // 判断args数组中是否包含-g
  const isGlobal = args.includes('-g')
  // 如果包含，则返回fn函数，参数为await getGlobalAgent()和args
  if (isGlobal)
    return await fn(await getGlobalAgent(), args)

  // 声明agent变量，初始值为(await detect({ ...options, cwd }))或者(await getDefaultAgent(options.programmatic))
  let agent = (await detect({ ...options, cwd })) || (await getDefaultAgent(options.programmatic))
  // 如果agent等于prompt，则使用prompts函数，返回agent变量
  if (agent === 'prompt') {
    agent = (
      await prompts({
        name: 'agent',
        type: 'select',
        message: 'Choose the agent', // 选择代理
        choices: agents.filter(i => !i.includes('@')).map(value => ({ title: value, value })),
      })
    ).agent
    // 如果agent不存在，则返回
    if (!agent)
      return
  }

  // 返回fn函数，参数为agent变量和args，以及programmatic、hasLock和cwd
  return await fn(agent as Agent, args, {
    programmatic: options.programmatic,
    hasLock: Boolean(agent),
    cwd,
  })
}

// 导出一个异步函数run，用于运行函数fn，参数args，选项options，其中options为可选参数，默认为空对象
export async function run(fn: Runner, args: string[], options: DetectOptions = {}) {
  // 判断args数组中是否包含DEBUG_SIGN，如果包含则从args数组中移除DEBUG_SIGN
  const debug = args.includes(DEBUG_SIGN)
  if (debug)
    remove(args, DEBUG_SIGN)

  // 获取options中的cwd参数，如果没有则使用当前工作目录
  let cwd = options.cwd ?? process.cwd()
  // 如果args数组中包含-C，则将cwd设置为args数组中第二个参数，并将args数组中的第一个参数移除
  if (args[0] === '-C') {
    cwd = resolve(cwd, args[1])
    args.splice(0, 2)
  }

  // 如果args数组中只有一个参数，且参数为-v或--version，则获取全局代理和全局代理版本，获取agent版本，获取node版本，并打印出结果
  // 检查参数是否为-v或--version，如果是则打印版本号
  if (args.length === 1 && (args[0]?.toLowerCase() === '-v' || args[0] === '--version')) {
    // 获取命令
    const getCmd = (a: Agent) => agents.includes(a) ? getCommand(a, 'agent', ['-v']) : `${a} -v`
    // 获取版本号
    const getV = (a: string, o?: ExecaOptions) => execaCommand(getCmd(a as Agent), o).then(e => e.stdout).then(e => e.startsWith('v') ? e : `v${e}`)
    // 获取全局代理
    const globalAgentPromise = getGlobalAgent()
    const globalAgentVersionPromise = globalAgentPromise.then(getV)
    // 检测代理
    const agentPromise = detect({ ...options, cwd }).then(a => a || '')
    const agentVersionPromise = agentPromise.then(a => a && getV(a, { cwd }))
    // 获取node版本号
    const nodeVersionPromise = getV('node', { cwd })

    console.log(`@antfu/ni  ${c.cyan(`v${version}`)}`)
    console.log(`node       ${c.green(await nodeVersionPromise)}`)
    const [agent, agentVersion] = await Promise.all([agentPromise, agentVersionPromise])
    if (agent)
      console.log(`${agent.padEnd(10)} ${c.blue(agentVersion)}`)
    else
      console.log('agent      no lock file')
    const [globalAgent, globalAgentVersion] = await Promise.all([globalAgentPromise, globalAgentVersionPromise])
    console.log(`${(`${globalAgent} -g`).padEnd(10)} ${c.blue(globalAgentVersion)}`)
    return
  }

  // 如果参数只有一个且为--version或-v，则打印版本号并返回
  if (args.length === 1 && (args[0] === '--version' || args[0] === '-v')) {
    console.log(`@antfu/ni v${version}`)
    return
  }

  // 如果参数只有一个且为-h或--help，则打印帮助信息并返回
  if (args.length === 1 && ['-h', '--help'].includes(args[0])) {
    const dash = c.dim('-')
    console.log(c.green(c.bold('@antfu/ni')) + c.dim(` use the right package manager v${version}\n`))
    console.log(`ni    ${dash}  install`)
    console.log(`nr    ${dash}  run`)
    console.log(`nlx   ${dash}  execute`)
    console.log(`nu    ${dash}  upgrade`)
    console.log(`nun   ${dash}  uninstall`)
    console.log(`nci   ${dash}  clean install`)
    console.log(`na    ${dash}  agent alias`)
    console.log(`ni -v ${dash}  show used agent`)
    console.log(c.yellow('\ncheck https://github.com/antfu/ni for more documentation.'))
    return
  }

  // 获取命令
  let command = await getCliCommand(fn, args, options, cwd)

  // 如果命令不存在，则返回
  if (!command)
    return

  // 如果volta前缀存在，则将命令拼接上volta前缀
  const voltaPrefix = getVoltaPrefix()
  if (voltaPrefix)
    command = voltaPrefix.concat(' ').concat(command)

  // 如果debug为true，则打印命令，并返回
  if (debug) {
    console.log(command)
    return
  }

  // 执行命令
  await execaCommand(command, { stdio: 'inherit', cwd })
}
