import { resolve } from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import type { RunnerContext } from './runner'

// 导出一个函数，用于获取package.json文件
export function getPackageJSON(ctx?: RunnerContext): any {
  // 获取当前工作目录
  const cwd = ctx?.cwd ?? process.cwd()
  // 获取package.json文件的路径
  const path = resolve(cwd, 'package.json')

  // 如果package.json文件存在，则读取文件内容并解析
  if (fs.existsSync(path)) {
    try {
      // 读取文件内容
      const raw = fs.readFileSync(path, 'utf-8')
      // 解析文件内容
      const data = JSON.parse(raw)
      return data
    }
    catch (e) {
      // 如果解析失败，则抛出异常
      if (!ctx?.programmatic) {
        console.warn('Failed to parse package.json')
        process.exit(1)
      }

      throw e
    }
  }
}
