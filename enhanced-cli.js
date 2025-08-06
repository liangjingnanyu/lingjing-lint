#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const child_process = require("child_process");

// inquirer 已由主入口安装，直接使用
let inquirer;
try {
  inquirer = require("inquirer");
} catch (e) {
  console.error("❌ inquirer 未找到，请确保通过主入口 (index-smart.js) 启动");
  console.error("   或手动安装: npm install inquirer");
  process.exit(1);
}

// 导入配置预设
let presets;
try {
  presets = require("./config/presets");
} catch (e) {
  // 如果配置文件不存在，使用内置预设
  presets = {
    standard: {
      eslint: {
        extends: [
          "eslint:recommended",
          "@typescript-eslint/recommended",
          "plugin:react/recommended",
          "plugin:react-hooks/recommended",
          "prettier",
        ],
        rules: {
          "@typescript-eslint/no-explicit-any": "warn",
          "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
          ],
          "react/prop-types": "off",
          "no-console": "warn",
        },
      },
      prettier: {
        printWidth: 80,
        tabWidth: 2,
        semi: true,
        singleQuote: true,
        trailingComma: "es5",
      },
    },
    strict: { eslint: {}, prettier: {} },
    relaxed: { eslint: {}, prettier: {} },
    team: { eslint: {}, prettier: {} },
    frameworks: {},
  };
}

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
    typescript: "enhanced-ts-eslint.js",
    javascript: "eslint.js",
    prettier: "enhanced-prettier.js",
    tslint: "tslint.json",
  },
};

// 工具函数类
class Utils {
  static getNodeMajorVersion() {
    const version = process.version;
    const match = version.match(/v(\d+)/);
    return match ? parseInt(match[1], 10) : 16;
  }

  static async getUserInput(prompt, defaultValue = "") {
    if (!inquirer) inquirer = require("inquirer");
    const res = await inquirer.prompt([
      {
        type: "input",
        name: "result",
        message: prompt,
        default: defaultValue,
      },
    ]);
    return res.result;
  }

  static async getChoice(prompt, choices, defaultChoice = 0) {
    if (!inquirer) inquirer = require("inquirer");
    const res = await inquirer.prompt([
      {
        type: "list",
        name: "result",
        message: prompt,
        choices: choices.map((c) => ({
          name: `${c.name} - ${c.description}`,
          value: c,
        })),
        default: defaultChoice,
      },
    ]);
    return res.result;
  }

  static detectProjectType() {
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, "package.json");

    let detectedFramework = "react";
    let detectedLanguage = "javascript";

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = fs.readJsonSync(packageJsonPath);
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // 检测框架
        if (deps["next"] || deps["@next/core"]) {
          detectedFramework = "nextjs";
        } else if (deps["vue"] || deps["@vue/core"]) {
          detectedFramework = "vue";
        } else if (deps["vite"]) {
          detectedFramework = "vite";
        }

        // 检测语言
        if (
          deps.typescript ||
          deps["@types/node"] ||
          fs.existsSync(path.join(cwd, "tsconfig.json"))
        ) {
          detectedLanguage = "typescript";
        }
      } catch (e) {
        console.warn("⚠️ 无法读取 package.json，将使用默认配置");
      }
    }

    // 检测 TypeScript 文件
    if (detectedLanguage === "javascript") {
      const srcDirs = ["src", "lib", "app", "pages"];
      for (const dir of srcDirs) {
        const dirPath = path.join(cwd, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          if (
            files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
          ) {
            detectedLanguage = "typescript";
            break;
          }
        }
      }
    }

    return { framework: detectedFramework, language: detectedLanguage };
  }

  static async execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      child_process.exec(
        command,
        { stdio: "inherit", ...options },
        (error, stdout, stderr) => {
          if (error) {
            reject({ error, stdout, stderr });
          } else {
            resolve({ stdout, stderr });
          }
        }
      );
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
    const progressBar = this.createProgressBar(progress);
    console.log(
      `\n[${this.currentStep}/${this.steps.length}] ${progressBar} ${message}`
    );
  }

  createProgressBar(progress) {
    const width = 20;
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${progress}%`;
  }

  complete() {
    console.log("\n🎉 配置完成！所有步骤已成功执行。");
  }
}

// 增强的包管理器
class PackageManager {
  constructor() {
    this.manager = this.detectPackageManager();
  }

  detectPackageManager() {
    const cwd = process.cwd();

    if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
      return "yarn";
    }

    if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
      return "pnpm";
    }

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
    const command = `${this.manager} ${this.getInstallCommand()} ${deps.join(
      " "
    )} ${devFlag}`;

    console.log(`📦 正在安装依赖: ${deps.join(", ")}`);

    try {
      await Utils.execCommand(command);
      return true;
    } catch (e) {
      console.error(`❌ 安装依赖失败: ${(e.error && e.error.message) || e}`);
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

  async addScripts() {
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = fs.readJsonSync(packageJsonPath);

        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }

        // 添加 lint 和 format 脚本
        packageJson.scripts.lint = "eslint . --ext .js,.jsx,.ts,.tsx";
        packageJson.scripts["lint:fix"] =
          "eslint . --ext .js,.jsx,.ts,.tsx --fix";
        packageJson.scripts.format =
          'prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"';
        packageJson.scripts["format:check"] =
          'prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}"';

        fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
        console.log("✅ 已添加 lint 和 format 脚本到 package.json");
      } catch (e) {
        console.warn("⚠️ 无法更新 package.json 脚本");
      }
    }
  }
}

// 增强的配置生成器
class ConfigGenerator {
  constructor(templateDir) {
    this.templateDir = templateDir;
  }

  async generateConfigs(options) {
    const { projectType, preset, framework, includeTslint = false } = options;
    const configs = [];

    // 根据预设生成配置
    const presetConfig = presets[preset] || presets.standard;

    // 生成 ESLint 配置
    await this.generateEslintConfig(projectType, presetConfig, framework);
    configs.push(".eslintrc.js");

    // 生成 TSLint 配置（如果需要）
    if (includeTslint && projectType === "typescript") {
      await this.generateTslintConfig();
      configs.push("tslint.json");
    }

    // 生成 Prettier 配置
    await this.generatePrettierConfig(presetConfig);
    configs.push(".prettierrc.js");

    // 生成忽略文件
    await this.generateIgnoreFiles();
    configs.push(".eslintignore", ".prettierignore");

    // 生成 VSCode 配置
    await this.generateVSCodeConfig();
    configs.push(".vscode/settings.json");

    return configs;
  }

  async generateEslintConfig(projectType, presetConfig, framework) {
    let config = { ...presetConfig.eslint };

    // 添加框架特定配置
    if (framework && presets.frameworks[framework]) {
      const frameworkConfig = presets.frameworks[framework];
      config.extends = [
        ...(config.extends || []),
        ...(frameworkConfig.extends || []),
      ];
      config.rules = { ...config.rules, ...frameworkConfig.rules };
      config.env = { ...config.env, ...frameworkConfig.env };
      config.plugins = [
        ...(config.plugins || []),
        ...(frameworkConfig.plugins || []),
      ];
    }

    // TypeScript 特定配置
    if (projectType === "typescript") {
      config.parser = "@typescript-eslint/parser";
      config.parserOptions = {
        ...config.parserOptions,
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      };
    }

    const configContent = `module.exports = ${JSON.stringify(
      config,
      null,
      2
    )};`;
    const dest = path.join(process.cwd(), ".eslintrc.js");

    fs.writeFileSync(dest, configContent);
    console.log("✅ 已生成 .eslintrc.js 配置文件");
  }

  async generateTslintConfig() {
    const source = path.join(this.templateDir, CONFIG.TEMPLATES.tslint);
    const dest = path.join(process.cwd(), "tslint.json");

    if (!fs.existsSync(source)) {
      console.warn("⚠️ TSLint 模板文件不存在，跳过生成");
      return;
    }

    fs.copySync(source, dest);
    console.log("✅ 已生成 tslint.json 配置文件");
    console.log(
      "⚠️ 注意：TSLint 已被官方弃用，建议使用 ESLint + @typescript-eslint"
    );
  }

  async generatePrettierConfig(presetConfig) {
    const config = presetConfig.prettier;
    const configContent = `module.exports = ${JSON.stringify(
      config,
      null,
      2
    )};`;
    const dest = path.join(process.cwd(), ".prettierrc.js");

    fs.writeFileSync(dest, configContent);
    console.log("✅ 已生成 .prettierrc.js 配置文件");
  }

  async generateIgnoreFiles() {
    // .eslintignore
    const eslintIgnoreContent = [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "*.min.js",
      "*.bundle.js",
      ".next/",
      "out/",
      "public/",
    ].join("\n");

    fs.writeFileSync(
      path.join(process.cwd(), ".eslintignore"),
      eslintIgnoreContent
    );
    console.log("✅ 已生成 .eslintignore 文件");

    // .prettierignore
    const prettierIgnoreContent = [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "*.min.js",
      "*.bundle.js",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      ".next/",
      "out/",
    ].join("\n");

    fs.writeFileSync(
      path.join(process.cwd(), ".prettierignore"),
      prettierIgnoreContent
    );
    console.log("✅ 已生成 .prettierignore 文件");
  }

  async generateVSCodeConfig() {
    const vscodeDir = path.join(process.cwd(), ".vscode");
    const settingsPath = path.join(vscodeDir, "settings.json");

    fs.ensureDirSync(vscodeDir);

    const settings = {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true,
      },
      "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
      ],
      "typescript.preferences.importModuleSpecifier": "relative",
    };

    fs.writeJsonSync(settingsPath, settings, { spaces: 2 });
    console.log("✅ 已生成 VSCode 配置文件");
  }
}

// 主程序
async function main() {
  console.log("🚀 欢迎使用 liangjing-lint-start 增强版配置工具！");
  console.log("📋 正在智能分析您的项目...\n");

  // 检查 Node 版本
  const nodeVersion = Utils.getNodeMajorVersion();
  if (nodeVersion < CONFIG.SUPPORTED_NODE_VERSION) {
    console.warn(
      `⚠️ 建议使用 Node.js ${CONFIG.SUPPORTED_NODE_VERSION}+ 版本以获得最佳体验`
    );
    console.warn(`当前版本: ${process.version}\n`);
  }

  try {
    // 检测项目配置
    const detected = Utils.detectProjectType();
    console.log(`🔍 智能检测结果:`);
    console.log(`   框架: ${detected.framework}`);
    console.log(`   语言: ${detected.language}`);

    // 选择配置预设
    const presetChoices = [
      {
        name: "standard",
        description: "标准模式 - 平衡代码质量和开发效率（推荐）",
      },
      { name: "strict", description: "严格模式 - 最高代码质量要求" },
      { name: "relaxed", description: "宽松模式 - 适合快速开发或遗留项目" },
      { name: "team", description: "团队模式 - 适合多人协作项目" },
    ];

    const selectedPreset = await Utils.getChoice(
      "请选择配置预设:",
      presetChoices,
      0
    );

    // 确认项目类型
    const languageChoices = [
      { name: "typescript", description: "TypeScript 项目" },
      { name: "javascript", description: "JavaScript 项目" },
    ];

    const defaultLanguageIndex = detected.language === "typescript" ? 0 : 1;
    const selectedLanguage = await Utils.getChoice(
      "确认项目语言:",
      languageChoices,
      defaultLanguageIndex
    );

    // 询问是否生成 TSLint 配置（仅 TypeScript 项目）
    let includeTslint = false;
    if (selectedLanguage.name === "typescript") {
      if (!inquirer) inquirer = require("inquirer");
      const tslintChoice = await inquirer.prompt([
        {
          type: "confirm",
          name: "includeTslint",
          message:
            "是否同时生成 TSLint 配置？[注意：TSLint 已被弃用，建议使用 ESLint]",
          default: false,
        },
      ]);
      includeTslint = tslintChoice.includeTslint;
    }

    // 初始化进度管理器
    const progress = new ProgressManager();
    progress.addSteps([
      "配置包管理器",
      "清理旧依赖",
      "安装新依赖",
      "生成配置文件",
      "添加脚本命令",
      "验证配置",
    ]);

    // 步骤 1: 配置包管理器
    progress.nextStep("配置包管理器和源...");
    const packageManager = new PackageManager();
    console.log(`📦 检测到包管理器: ${packageManager.manager}`);
    await packageManager.setRegistry();

    // 步骤 2: 清理旧依赖
    progress.nextStep("清理旧的 lint 相关依赖...");
    await packageManager.removeDependencies(CONFIG.DEPENDENCIES_TO_REMOVE);

    // 步骤 3: 安装新依赖
    progress.nextStep("安装新的 lint 和 prettier 依赖...");
    const dependencies = getDependenciesByType(
      selectedLanguage.name,
      detected.framework,
      includeTslint
    );
    const installSuccess = await packageManager.installDependencies(
      dependencies
    );

    if (!installSuccess) {
      throw new Error("依赖安装失败");
    }

    // 步骤 4: 生成配置文件
    progress.nextStep("生成配置文件...");
    const templateDir = path.join(__dirname, "templates");
    const configGenerator = new ConfigGenerator(templateDir);

    const generatedConfigs = await configGenerator.generateConfigs({
      projectType: selectedLanguage.name,
      preset: selectedPreset.name,
      framework: detected.framework,
      includeTslint: includeTslint,
    });

    // 步骤 5: 添加脚本命令
    progress.nextStep("添加 package.json 脚本...");
    await packageManager.addScripts();

    // 步骤 6: 验证配置
    progress.nextStep("验证配置文件...");
    await validateConfigs(generatedConfigs);

    // 完成
    progress.complete();

    // 询问是否运行格式化
    if (!inquirer) inquirer = require("inquirer");
    const formatChoice = await inquirer.prompt([
      {
        type: "confirm",
        name: "runFormat",
        message: "是否立即运行代码格式化？",
        default: false,
      },
    ]);
    if (formatChoice.runFormat) {
      console.log("\n🎨 正在格式化代码...");
      await runCodeFormat(packageManager);
    }

    console.log("\n🎯 配置完成！您现在可以：");
    console.log(`   • 运行 '${packageManager.manager} run lint' 检查代码`);
    console.log(
      `   • 运行 '${packageManager.manager} run lint:fix' 自动修复问题`
    );
    console.log(`   • 运行 '${packageManager.manager} run format' 格式化代码`);
    console.log("   • 在 VSCode 中享受自动格式化和错误提示");
    console.log("\n💡 提示: 已为您生成 VSCode 配置，重启编辑器以生效");

    // 正常完成，主动退出进程
    process.exit(0);
  } catch (error) {
    console.error("\n❌ 配置过程中出现错误:");
    console.error(error.message);
    console.log("\n🔧 建议解决方案:");
    console.log("   • 检查网络连接");
    console.log("   • 确保有写入权限");
    console.log("   • 尝试手动清理 node_modules 后重试");
    console.log("   • 检查 Node.js 版本是否符合要求");
    process.exit(1);
  }
}

// 根据项目类型和框架获取依赖
function getDependenciesByType(projectType, framework, includeTslint = false) {
  const baseDeps = [
    "eslint",
    "prettier",
    "eslint-config-prettier",
    "eslint-plugin-prettier",
  ];

  // React 相关依赖
  if (framework === "react" || framework === "nextjs" || framework === "vite") {
    baseDeps.push(
      "eslint-plugin-react",
      "eslint-plugin-react-hooks",
      "eslint-plugin-jsx-a11y"
    );
  }

  // TypeScript 相关依赖
  if (projectType === "typescript") {
    baseDeps.push(
      "@typescript-eslint/parser",
      "@typescript-eslint/eslint-plugin"
    );

    // TSLint 相关依赖（如果需要）
    if (includeTslint) {
      baseDeps.push("tslint", "tslint-react", "tslint-config-prettier");
    }
  }

  // 框架特定依赖
  switch (framework) {
    case "nextjs":
      baseDeps.push("eslint-config-next");
      break;
    case "vue":
      baseDeps.push(
        "eslint-plugin-vue",
        "@vue/eslint-config-typescript",
        "@vue/eslint-config-prettier"
      );
      break;
    case "vite":
      baseDeps.push("eslint-plugin-react-refresh");
      break;
  }

  // 通用增强依赖
  baseDeps.push("eslint-plugin-import", "eslint-import-resolver-typescript");

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
        delete require.cache[require.resolve(filePath)];
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
