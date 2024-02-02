import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execaCommand } from 'execa'
import { findUp } from 'find-up'
import terminalLink from 'terminal-link'
import prompts from '@posva/prompts'
import type { Agent } from './agents'
import { AGENTS, INSTALL_PAGE, LOCKS } from './agents'
import { cmdExists } from './utils'

export interface DetectOptions {
  autoInstall?: boolean
  programmatic?: boolean
  cwd?: string
}

// 导出一个异步函数detect，用于检测环境
export async function detect({ autoInstall, programmatic, cwd }: DetectOptions = {}) {
  // 初始化agent和version
  let agent: Agent | null = null
  let version: string | null = null

  // 查找lock文件
  const lockPath = await findUp(Object.keys(LOCKS), { cwd })
  let packageJsonPath: string | undefined

  // 如果没有lock文件，则查找package.json
  if (lockPath)
    packageJsonPath = path.resolve(lockPath, '../package.json')
  else
    packageJsonPath = await findUp('package.json', { cwd })

  // read `packageManager` field in package.json
  // 读取package.json中的packageManager字段
  if (packageJsonPath && fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (typeof pkg.packageManager === 'string') {
        const [name, ver] = pkg.packageManager.replace(/^\^/, '').split('@')
        version = ver
        // 如果packageManager字段是yarn，且版本大于1，则设置agent为yarn@berry
        if (name === 'yarn' && Number.parseInt(ver) > 1) {
          agent = 'yarn@berry'
          // the version in packageManager isn't the actual yarn package version
          version = 'berry'
        }
        // 如果packageManager字段是pnpm，且版本小于7，则设置agent为pnpm@6
        else if (name === 'pnpm' && Number.parseInt(ver) < 7) {
          agent = 'pnpm@6'
        }
        // 如果packageManager字段是AGENTS中的某一项，则设置agent为该项
        else if (name in AGENTS) {
          agent = name
        }
        // 如果packageManager字段不是AGENTS中的某一项，且不是程序化调用，则报错
        else if (!programmatic) {
          console.warn('[ni] Unknown packageManager:', pkg.packageManager)
        }
      }
    }
    catch {}
  }

  // 如果agent没有定义，且lockPath有定义
  if (!agent && lockPath)
    // 将lockPath的文件名作为agent的值
    agent = LOCKS[path.basename(lockPath)]

  // 安装ni
  if (agent && !cmdExists(agent.split('@')[0]) && !programmatic) {
    // 如果检测到agent，但是它似乎没有被安装，并且不是自动安装
    if (!autoInstall) {
      // 警告用户检测到的agent但是它似乎没有被安装
      console.warn(`[ni] Detected ${agent} but it doesn't seem to be installed.\n`)

      // 如果 CI 环境，则退出
      if (process.env.CI)
        process.exit(1)

      // 创建终端链接
      const link = terminalLink(agent, INSTALL_PAGE[agent])
      // 询问用户是否全局安装agent
      const { tryInstall } = await prompts({
        name: 'tryInstall',
        type: 'confirm',
        message: `Would you like to globally install ${link}?`,
      })
      // 如果不安装，则退出
      if (!tryInstall)
        process.exit(1)
    }
    // 执行安装命令
    await execaCommand(`npm i -g ${agent.split('@')[0]}${version ? `@${version}` : ''}`, { stdio: 'inherit', cwd })
  }

  return agent
}
