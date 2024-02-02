import { basename } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import fg from 'fast-glob'

export default defineBuildConfig({
  // entries：这是一个数组，用于指定构建的入口文件。
  // 这里使用了 fg.sync('src/commands/*.ts') 来同步获取 src/commands/ 目录下所有的 .ts 文件
  // 然后使用 map 函数将每个文件路径转换为一个对象
  // 这个对象包含 input 和 name 两个属性。
  // input 是文件的路径（去掉了 .ts 后缀）
  // name 是文件的基本名称（也去掉了 .ts 后缀）
  entries: [
    ...fg.sync('src/commands/*.ts').map(i => ({
      input: i.slice(0, -3),
      name: basename(i).slice(0, -3),
    })),
  ],
  // clean：这是一个布尔值，如果为 true，则在每次构建前清理输出目录。
  clean: true,
  // declaration：这是一个布尔值，如果为 true，则在构建过程中生成 TypeScript 声明文件（.d.ts 文件）。
  declaration: true,
  // rollup：这是一个对象，用于配置 Rollup 的行为。
  // emitCJS 如果为 true，则输出 CommonJS 格式的模块。
  // inlineDependencies 如果为 true，则将所有的依赖项内联到输出的文件中。

  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
