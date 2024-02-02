import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ini from 'ini'
import type { Agent } from './agents'
import { detect } from './detect'

const customRcPath = process.env.NI_CONFIG_FILE

const home = process.platform === 'win32'
  ? process.env.USERPROFILE
  : process.env.HOME

const defaultRcPath = path.join(home || '~/', '.nirc')

const rcPath = customRcPath || defaultRcPath

interface Config {
  defaultAgent: Agent | 'prompt'
  globalAgent: Agent
}

// 默认配置
const defaultConfig: Config = {
  defaultAgent: 'prompt',
  globalAgent: 'npm',
}

// 配置
let config: Config | undefined

// 导出一个异步函数，用于获取配置
export async function getConfig(): Promise<Config> {
  // 如果配置不存在
  if (!config) {
    // 使用默认配置和rcPath文件中的配置进行合并
    config = Object.assign(
      {},
      defaultConfig,
      fs.existsSync(rcPath)
        ? ini.parse(fs.readFileSync(rcPath, 'utf-8'))
        : null,
    )
    // 检测代理
    const agent = await detect({ programmatic: true })
    // 如果检测到代理，则将默认代理设置为检测到的代理
    if (agent)
      config.defaultAgent = agent
  }

  // 返回配置
  return config
}

// 导出一个异步函数，用于获取默认代理
export async function getDefaultAgent(programmatic?: boolean) {
  // 获取配置信息
  const { defaultAgent } = await getConfig()
  // 如果默认代理为prompt，且programmatic为true或者CI环境变量为true，则返回npm
  if (defaultAgent === 'prompt' && (programmatic || process.env.CI))
    return 'npm'
  // 否则返回默认代理
  return defaultAgent
}

// 导出一个异步函数，用于获取全局代理
export async function getGlobalAgent() {
  // 获取配置信息
  const { globalAgent } = await getConfig()
  // 返回全局代理
  return globalAgent
}
