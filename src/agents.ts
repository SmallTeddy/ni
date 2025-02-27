// 函数npmRun接收一个参数agent，返回一个函数
function npmRun(agent: string) {
  // 返回的函数接收一个参数args，返回一个字符串
  return (args: string[]) => {
    // 如果args的长度大于1，返回一个字符串
    if (args.length > 1)
      return `${agent} run ${args[0]} -- ${args.slice(1).join(' ')}`
    // 否则返回一个字符串
    else return `${agent} run ${args[0]}`
  }
}

const yarn = {
  // 安装yarn代理
  'agent': 'yarn {0}',
  // 运行yarn命令
  'run': 'yarn run {0}',
  // 安装yarn命令
  'install': 'yarn install {0}',
  // 锁定yarn安装
  'frozen': 'yarn install --frozen-lockfile',
  // 全局安装yarn
  'global': 'yarn global add {0}',
  // 添加yarn
  'add': 'yarn add {0}',
  // 升级yarn
  'upgrade': 'yarn upgrade {0}',
  // 交互式升级yarn
  'upgrade-interactive': 'yarn upgrade-interactive {0}',
  // 执行npx命令
  'execute': 'npx {0}',
  // 卸载yarn
  'uninstall': 'yarn remove {0}',
  // 全局卸载yarn
  'global_uninstall': 'yarn global remove {0}',
}

const pnpm = {
  'agent': 'pnpm {0}',
  'run': 'pnpm run {0}',
  'install': 'pnpm i {0}',
  'frozen': 'pnpm i --frozen-lockfile',
  'global': 'pnpm add -g {0}',
  'add': 'pnpm add {0}',
  'upgrade': 'pnpm update {0}',
  'upgrade-interactive': 'pnpm update -i {0}',
  'execute': 'pnpm dlx {0}',
  'uninstall': 'pnpm remove {0}',
  'global_uninstall': 'pnpm remove --global {0}',
}
const bun = {
  'agent': 'bun {0}',
  'run': 'bun run {0}',
  'install': 'bun install {0}',
  'frozen': 'bun install --no-save',
  'global': 'bun add -g {0}',
  'add': 'bun add {0}',
  'upgrade': 'bun update {0}',
  'upgrade-interactive': 'bun update {0}',
  'execute': 'bunx {0}',
  'uninstall': 'bun remove {0}',
  'global_uninstall': 'bun remove -g {0}',
}

export const AGENTS = {
  'npm': {
    'agent': 'npm {0}',
    'run': npmRun('npm'),
    'install': 'npm i {0}',
    'frozen': 'npm ci',
    'global': 'npm i -g {0}',
    'add': 'npm i {0}',
    'upgrade': 'npm update {0}',
    'upgrade-interactive': null,
    'execute': 'npx {0}',
    'uninstall': 'npm uninstall {0}',
    'global_uninstall': 'npm uninstall -g {0}',
  },
  'yarn': yarn,
  'yarn@berry': {
    ...yarn,
    'frozen': 'yarn install --immutable',
    'upgrade': 'yarn up {0}',
    'upgrade-interactive': 'yarn up -i {0}',
    'execute': 'yarn dlx {0}',
    // Yarn 2+ removed 'global', see https://github.com/yarnpkg/berry/issues/821
    'global': 'npm i -g {0}',
    'global_uninstall': 'npm uninstall -g {0}',
  },
  'pnpm': pnpm,
  // pnpm v6.x or below
  'pnpm@6': {
    ...pnpm,
    run: npmRun('pnpm'),
  },
  'bun': bun,
}

export type Agent = keyof typeof AGENTS
export type Command = keyof typeof AGENTS.npm

export const agents = Object.keys(AGENTS) as Agent[]

// the order here matters, more specific one comes first
export const LOCKS: Record<string, Agent> = {
  'bun.lockb': 'bun',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
}

export const INSTALL_PAGE: Record<Agent, string> = {
  'bun': 'https://bun.sh',
  'pnpm': 'https://pnpm.io/installation',
  'pnpm@6': 'https://pnpm.io/6.x/installation',
  'yarn': 'https://classic.yarnpkg.com/en/docs/install',
  'yarn@berry': 'https://yarnpkg.com/getting-started/install',
  'npm': 'https://docs.npmjs.com/cli/v8/configuring-npm/install',
}
