import { existsSync, promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { CLI_TEMP_DIR, writeFileSafe } from './utils'

export interface Storage {
  lastRunCommand?: string
}

let storage: Storage | undefined

const storagePath = resolve(CLI_TEMP_DIR, '_storage.json')

// 导出一个异步函数，用于加载存储
export async function load(fn?: (storage: Storage) => Promise<boolean> | boolean) {
  // 如果storage不存在，则从存储路径中读取存储
  if (!storage) {
    storage = existsSync(storagePath)
      ? (JSON.parse(await fs.readFile(storagePath, 'utf-8') || '{}') || {})
      : {}
  }

  // 如果fn存在，则执行fn函数，并dump
  if (fn) {
    if (await fn(storage!))
      await dump()
  }

  // 返回storage
  return storage!
}

// 导出一个异步函数，用于dump
export async function dump() {
  // 如果storage存在，则以安全的方式写入存储路径
  if (storage)
    await writeFileSafe(storagePath, JSON.stringify(storage))
}
