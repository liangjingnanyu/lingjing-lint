#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const child_process = require("child_process");

// 配置常量
const CONFIG = {
  SUPPORTED_NODE_VERSION: 16,
  REGISTRY_URL: "https://registry.npmjs.org/",
  DEPENDENCIES_TO_REMOVE: [
    "eslint",
    "prettier", 
    "eslint-config-prettier",
    "eslint-plugin-prettier",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks",
    "@typescript-eslint/parser",
    "@typescript-eslint/eslint-plugin",
  ],
  TEMPLATES: {
    typescript: "ts-eslint.js",
    javascript: "eslint.js",
    prettier: "prettier.js"
  }
};

// 工具函数
class Utils {
  static getNodeMajorVersion() {
    const version = process.version;
    const match = version.match(/v(\d+)/);
    return match ? parseInt(match[1], 10) : 16;
  }

  static async getUserInput(prompt, defaultValue = "") {
    process.stdout.write(`${prompt}${defaultValue ? ` (默认: ${defaultValue})` : ""}: `);
    process.stdin.setEncoding("utf8");
    
    return new Promise((resolve) => {
      process.stdin.once("data", (data) => {
        const input = data.trim();
        resolve(input || defaultValue);
      });
    });
  }

  static detectProjectType() {
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, "package.json");
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = fs.readJsonSync(packageJsonPath);
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // 检测 TypeScript
        if (deps.typescript || deps["@types/node"] || fs.existsSync(path.join(cwd, "tsconfig.json"))) {
          return "typescript";
        }
        
        // 检测 React
        if (deps.react || deps["@types/react"]) {
          return "react";
        }
      } catch (e) {
        console.warn("⚠️ 无法读取 package.json，将使用默认配置");
      }
    }
    
    // 检测 TypeScript 文件
    if (fs.existsSync(path.join(cwd, "src")) || fs.existsSync(path.join(cwd, "lib"))) {
      const srcDir = fs.existsSync(path.join(cwd, "src")) ? "src" : "lib";
      const files = fs.readdirSync(path.join(cwd, srcDir));
      if (files.some(file => file.endsWith(".ts") || file.endsWith(".tsx"))) {
        return "typescript";
      }
    }
    
    return "javascript";
  }

  static async execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      child_process.exec(command, { stdio: "inherit", ...options }, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

// 进度管理器
class ProgressManager {
  constructor() {
    this.steps = [];
    this.currentStep = 0;
  }

  addSteps(steps) {
    this.steps = steps;
  }

  nextStep(message) {
    this.currentStep++;
    const progress = Math.round((this.currentStep / this.steps.length) * 100);
    console.log(`\n[${this.currentStep}/${this.steps.length}] (${progress}%) ${message}`);
  }

  complete() {
    console.log("\n🎉 配置完成！所有步骤已成功执行。");
  }
}

// 包管理器管理
class PackageManager {
  constructor() {
    this.manager = this.detectPackageManager();
  }

  detectPackageManager() {
    const cwd = process.cwd();
    
    // 检测 yarn.lock
    if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
      return "yarn";
    }
    
    // 检测 pnpm-lock.yaml
    if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    
    // 默认使用 npm
    return "npm";
  }

  async setRegistry() {
    try {
      const command = this.getRegistryCommand();
      await Utils.execCommand(command);
      console.log(`✅ 已设置 ${this.manager} registry 为官方源`);
    } catch (e) {
      console.warn("⚠️ 设置 registry 失败，如遇网络问题请手动切换");
    }
  }

  getRegistryCommand() {
    switch (this.manager) {
      case "yarn":
        return `yarn config set registry ${CONFIG.REGISTRY_URL}`;
      case "pnpm":
        return `pnpm config set registry ${CONFIG.REGISTRY_URL}`;
      default:
        return `npm config set registry ${CONFIG.REGISTRY_URL}`;
    }
  }

  async installDependencies(deps, isDev = true) {
    const devFlag = isDev ? this.getDevFlag() : "";
    const command = `${this.manager} ${this.getInstallCommand()} ${deps.join(" ")} ${devFlag}`;
    
    try {
      await Utils.execCommand(command);
      return true;
    } catch (e) {
      console.error(`❌ 安装依赖失败: ${e.error?.message || e}`);
      return false;
    }
  }

  getInstallCommand() {
    return this.manager === "npm" ? "install" : "add";
  }

  getDevFlag() {
    switch (this.manager) {
      case "yarn":
      case "pnpm":
        return "--dev";
      default:
        return "--save-dev";
    }
  }

  async removeDependencies(deps) {
    const command = `${this.manager} remove ${deps.join(" ")}`;
    
    try {
      await Utils.execCommand(command);
      console.log("✅ 旧依赖已移除");
    } catch (e) {
      console.warn("⚠️ 某些依赖移除失败，如未安装可忽略");
    }
  }
}

// 配置生成器
class ConfigGenerator {
  constructor(templateDir) {
    this.templateDir = templateDir;
  }

  async generateConfigs(projectType, options = {}) {
    const configs = [];
    
    // 生成 ESLint 配置
    const eslintTemplate = projectType === "typescript" ? 
      CONFIG.TEMPLATES.typescript : CONFIG.TEMPLATES.javascript;
    
    await this.copyTemplate(eslintTemplate, ".eslintrc.js");
    configs.push(".eslintrc.js");
    
    // 生成 Prettier 配置
    if (options.includePrettier !== false) {
      await this.copyTemplate(CONFIG.TEMPLATES.prettier, ".prettierrc.js");
      configs.push(".prettierrc.js");
    }
    
    // 生成 .eslintignore
    await this.generateEslintIgnore();
    configs.push(".eslintignore");
    
    // 生成 .prettierignore
    if (options.includePrettier !== false) {
      await this.generatePrettierIgnore();
      configs.push(".prettierignore");
    }
    
    return configs;
  }

  async copyTemplate(templateName, destName) {
    const source = path.join(this.templateDir, templateName);
    const dest = path.join(process.cwd(), destName);
    
    if (!fs.existsSync(source)) {
      throw new Error(`模板文件不存在: ${source}`);
    }
    
    fs.copySync(source, dest);
    console.log(`✅ 已生成 ${destName} 配置文件`);
  }

  async generateEslintIgnore() {
    const ignoreContent = [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "*.min.js",
      "*.bundle.js"
    ].join("\n");
    
    const dest = path.join(process.cwd(), ".eslintignore");
    fs.writeFileSync(dest, ignoreContent);
    console.log("✅ 已生成 .eslintignore 文件");
  }

  async generatePrettierIgnore() {
    const ignoreContent = [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "*.min.js",
      "*.bundle.js",
      "package-lock.json",
      "yarn.lock"
    ].join("\n");
    
    const dest = path.join(process.cwd(), ".prettierignore");
    fs.writeFileSync(dest, ignoreContent);
    console.log("✅ 已生成 .prettierignore 文件");
  }
}

// 主程序
async function main() {
  console.log("🚀 欢迎使用 liangjing-lint-start 配置工具！");
  console.log("📋 正在分析您的项目...\n");

  // 检查 Node 版本
  const nodeVersion = Utils.getNodeMajorVersion();
  if (nodeVersion < CONFIG.SUPPORTED_NODE_VERSION) {
    console.warn(`⚠️ 建议使用 Node.js ${CONFIG.SUPPORTED_NODE_VERSION}+ 版本以获得最佳体验`);
    console.warn(`当前版本: ${process.version}`);
  }

  // 初始化进度管理器
  const progress = new ProgressManager();
  progress.addSteps([
    "检测项目配置",
    "设置包管理器",
    "清理旧依赖", 
    "安装新依赖",
    "生成配置文件",
    "验证配置"
  ]);

  try {
    // 步骤 1: 检测项目配置
    progress.nextStep("检测项目类型和包管理器...");
    const projectType = Utils.detectProjectType();
    const packageManager = new PackageManager();
    
    console.log(`📦 检测到包管理器: ${packageManager.manager}`);
    console.log(`🎯 检测到项目类型: ${projectType === "typescript" ? "TypeScript" : "JavaScript"}`);

    // 询问用户确认
    const confirmType = await Utils.getUserInput(
      `确认项目类型 (typescript/javascript)`, 
      projectType
    );
    
    const finalProjectType = confirmType.toLowerCase().startsWith("t") ? "typescript" : "javascript";

    // 步骤 2: 设置包管理器
    progress.nextStep("配置包管理器和源...");
    await packageManager.setRegistry();

    // 步骤 3: 清理旧依赖
    progress.nextStep("清理旧的 lint 相关依赖...");
    await packageManager.removeDependencies(CONFIG.DEPENDENCIES_TO_REMOVE);

    // 步骤 4: 安装新依赖
    progress.nextStep("安装新的 lint 和 prettier 依赖...");
    const dependencies = getDependenciesByType(finalProjectType);
    const installSuccess = await packageManager.installDependencies(dependencies);
    
    if (!installSuccess) {
      throw new Error("依赖安装失败");
    }
    console.log("✅ 依赖安装成功");

    // 步骤 5: 生成配置文件
    progress.nextStep("生成配置文件...");
    const templateDir = path.join(__dirname, "templates");
    const configGenerator = new ConfigGenerator(templateDir);
    
    const generatedConfigs = await configGenerator.generateConfigs(finalProjectType);
    console.log(`✅ 已生成 ${generatedConfigs.length} 个配置文件`);

    // 步骤 6: 验证配置
    progress.nextStep("验证配置文件...");
    await validateConfigs(generatedConfigs);

    // 完成
    progress.complete();
    
    // 询问是否运行格式化
    const runFormat = await Utils.getUserInput("是否立即运行代码格式化？(y/N)", "n");
    if (runFormat.toLowerCase().startsWith("y")) {
      console.log("\n🎨 正在格式化代码...");
      await runCodeFormat(packageManager);
    }

    console.log("\n🎯 配置完成！您现在可以：");
    console.log("   • 运行 'npm run lint' 或 'yarn lint' 检查代码");
    console.log("   • 运行 'npm run format' 或 'yarn format' 格式化代码");
    console.log("   • 在 IDE 中安装 ESLint 和 Prettier 插件以获得实时提示");

  } catch (error) {
    console.error("\n❌ 配置过程中出现错误:");
    console.error(error.message);
    console.log("\n🔧 建议解决方案:");
    console.log("   • 检查网络连接");
    console.log("   • 确保有写入权限");
    console.log("   • 尝试手动清理 node_modules 后重试");
    process.exit(1);
  }
}

// 根据项目类型获取依赖
function getDependenciesByType(projectType) {
  const baseDeps = [
    "eslint",
    "prettier",
    "eslint-config-prettier", 
    "eslint-plugin-prettier",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks"
  ];

  if (projectType === "typescript") {
    baseDeps.push(
      "@typescript-eslint/parser",
      "@typescript-eslint/eslint-plugin"
    );
  }

  return baseDeps;
}

// 验证配置文件
async function validateConfigs(configs) {
  for (const config of configs) {
    const filePath = path.join(process.cwd(), config);
    if (!fs.existsSync(filePath)) {
      throw new Error(`配置文件生成失败: ${config}`);
    }
    
    // 验证 JavaScript 配置文件语法
    if (config.endsWith(".js")) {
      try {
        require(filePath);
        console.log(`✅ ${config} 语法验证通过`);
      } catch (e) {
        throw new Error(`${config} 语法错误: ${e.message}`);
      }
    }
  }
}

// 运行代码格式化
async function runCodeFormat(packageManager) {
  try {
    const command = `${packageManager.manager} run format`;
    await Utils.execCommand(command);
    console.log("✅ 代码格式化完成");
  } catch (e) {
    console.warn("⚠️ 代码格式化失败，请手动运行 format 脚本");
  }
}

// 启动程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, Utils, PackageManager, ConfigGenerator };
