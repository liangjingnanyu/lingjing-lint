# liangjing-lint-start 增强版

🚀 一个智能的 React/TypeScript 项目代码规范配置工具，支持多框架、多预设、自动检测。

## ✨ 新增特性

### 🎯 智能检测
- **自动识别项目类型**：TypeScript/JavaScript
- **框架智能检测**：React、Next.js、Vue、Vite
- **包管理器检测**：npm、yarn、pnpm

### 🎨 配置预设
- **严格模式**：最高代码质量要求，适合新项目
- **标准模式**：平衡质量与效率，推荐使用
- **宽松模式**：适合快速开发或遗留项目  
- **团队模式**：适合多人协作项目

### 🔧 增强功能
- **进度可视化**：实时进度条和状态提示
- **VSCode 集成**：自动生成编辑器配置
- **脚本自动添加**：lint、format 等命令
- **配置验证**：确保生成的配置文件正确
- **错误恢复**：友好的错误处理和建议

## 🚀 快速开始

### 使用 npx（推荐）
```bash
npx liangjing-lint-start
```

### 全局安装
```bash
npm install -g liangjing-lint-start
liangjing-lint-start
```

## 📋 支持的项目类型

| 框架 | JavaScript | TypeScript | 特殊配置 |
|------|------------|------------|----------|
| React | ✅ | ✅ | React Hooks 规则 |
| Next.js | ✅ | ✅ | Next.js 专用规则 |
| Vue 3 | ✅ | ✅ | Vue 组合式 API |
| Vite | ✅ | ✅ | HMR 优化规则 |

## 🎛️ 配置预设对比

| 特性 | 严格模式 | 标准模式 | 宽松模式 | 团队模式 |
|------|----------|----------|----------|----------|
| 类型检查 | 强制 | 推荐 | 可选 | 推荐 |
| 代码复杂度 | 限制 | 警告 | 忽略 | 警告 |
| Console 语句 | 禁止 | 警告 | 允许 | 警告 |
| 导入排序 | 强制 | 推荐 | 可选 | 强制 |
| 适用场景 | 新项目 | 通用 | 遗留项目 | 团队协作 |

## 📁 生成的文件结构

```
your-project/
├── .eslintrc.js          # ESLint 配置
├── .prettierrc.js        # Prettier 配置  
├── .eslintignore         # ESLint 忽略文件
├── .prettierignore       # Prettier 忽略文件
├── .vscode/
│   └── settings.json     # VSCode 配置
└── package.json          # 更新的脚本命令
```

## ⚙️ 自动添加的脚本命令

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix", 
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,md}\""
  }
}
```

## 🔄 使用流程

1. **项目检测** - 自动分析项目类型和框架
2. **选择预设** - 根据需求选择配置严格程度
3. **确认配置** - 确认检测结果或手动调整
4. **依赖管理** - 自动清理旧依赖，安装新依赖
5. **生成配置** - 创建所有必要的配置文件
6. **验证配置** - 确保配置文件语法正确
7. **完成设置** - 可选择立即格式化代码

## 🎨 VSCode 集成

工具会自动生成 `.vscode/settings.json` 配置：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact", 
    "typescript",
    "typescriptreact"
  ]
}
```

## 🔧 高级配置

### 自定义规则
生成配置后，您可以在 `.eslintrc.js` 中自定义规则：

```javascript
module.exports = {
  // ... 生成的配置
  rules: {
    // 添加您的自定义规则
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### 框架特定优化

#### Next.js 项目
- 自动添加 `eslint-config-next`
- 优化图片和链接检查规则
- 支持 App Router 和 Pages Router

#### Vue 项目  
- 支持 Vue 3 组合式 API
- TypeScript 集成优化
- 单文件组件规则

#### Vite 项目
- HMR 友好的规则配置
- 快速重新加载优化
- 开发环境性能优化

## 🐛 故障排除

### 常见问题

**Q: 安装依赖失败？**
A: 检查网络连接，尝试切换到官方 npm 源：
```bash
npm config set registry https://registry.npmjs.org/
```

**Q: ESLint 规则冲突？**
A: 工具会自动清理旧的 lint 依赖，如仍有冲突请手动删除 `node_modules` 后重新运行。

**Q: VSCode 不生效？**
A: 确保安装了 ESLint 和 Prettier 插件，并重启 VSCode。

### 手动恢复
如果配置过程中断，可以手动清理：
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🆚 版本对比

| 功能 | v1.x (原版) | v2.x (增强版) |
|------|-------------|---------------|
| 项目检测 | 手动选择 | 智能检测 |
| 配置选项 | 基础 | 多预设 |
| 框架支持 | React 基础 | 多框架深度集成 |
| 用户体验 | 基础交互 | 进度可视化 |
| 错误处理 | 简单提示 | 智能恢复建议 |
| IDE 集成 | 无 | VSCode 自动配置 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**💡 提示**：建议在团队中统一使用相同的配置预设，以保持代码风格一致性。
