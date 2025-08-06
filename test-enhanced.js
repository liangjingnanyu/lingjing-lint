#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

// 测试工具类
class TestRunner {
  constructor() {
    this.testDir = path.join(__dirname, "test-project");
    this.passed = 0;
    this.failed = 0;
  }

  async runTests() {
    console.log("🧪 开始测试增强版 liangjing-lint-start 工具\n");

    try {
      await this.setupTestProject();
      await this.testProjectDetection();
      await this.testConfigGeneration();
      await this.testDependencyInstallation();
      await this.testScriptGeneration();
      await this.cleanup();

      console.log(`\n📊 测试结果: ${this.passed} 通过, ${this.failed} 失败`);

      if (this.failed === 0) {
        console.log("🎉 所有测试通过！工具已准备就绪。");
      } else {
        console.log("❌ 部分测试失败，请检查问题。");
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ 测试过程中出现错误:", error.message);
      process.exit(1);
    }
  }

  async setupTestProject() {
    console.log("🏗️  设置测试项目...");

    // 清理并创建测试目录
    if (fs.existsSync(this.testDir)) {
      fs.removeSync(this.testDir);
    }
    fs.ensureDirSync(this.testDir);

    // 创建模拟的 TypeScript React 项目
    const packageJson = {
      name: "test-project",
      version: "1.0.0",
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
      },
      devDependencies: {
        typescript: "^4.9.0",
        "@types/react": "^18.0.0",
      },
    };

    fs.writeJsonSync(path.join(this.testDir, "package.json"), packageJson, {
      spaces: 2,
    });

    // 创建 tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "node",
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
      },
      include: ["src"],
    };

    fs.writeJsonSync(path.join(this.testDir, "tsconfig.json"), tsConfig, {
      spaces: 2,
    });

    // 创建源文件目录和示例文件
    fs.ensureDirSync(path.join(this.testDir, "src"));
    fs.writeFileSync(
      path.join(this.testDir, "src", "App.tsx"),
      `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello World</h1>
    </div>
  );
}

export default App;`
    );

    this.assert(fs.existsSync(this.testDir), "测试项目目录创建");
    console.log("✅ 测试项目设置完成");
  }

  async testProjectDetection() {
    console.log("\n🔍 测试项目检测功能...");

    // 导入工具类
    const originalCwd = process.cwd();
    process.chdir(this.testDir);

    try {
      const { Utils } = require("./enhanced-cli");
      const detected = Utils.detectProjectType();

      this.assert(detected.language === "typescript", "TypeScript 项目检测");
      this.assert(detected.framework === "react", "React 框架检测");

      console.log(`✅ 检测结果: ${detected.language} + ${detected.framework}`);
    } finally {
      process.chdir(originalCwd);
    }
  }

  async testConfigGeneration() {
    console.log("\n📝 测试配置文件生成...");

    const originalCwd = process.cwd();
    process.chdir(this.testDir);

    try {
      const { ConfigGenerator } = require("./enhanced-cli");
      const templateDir = path.join(__dirname, "templates");
      const generator = new ConfigGenerator(templateDir);

      const configs = await generator.generateConfigs({
        projectType: "typescript",
        preset: "standard",
        framework: "react",
      });

      this.assert(configs.length > 0, "配置文件生成数量");
      this.assert(
        fs.existsSync(path.join(this.testDir, ".eslintrc.js")),
        "ESLint 配置文件存在"
      );
      this.assert(
        fs.existsSync(path.join(this.testDir, ".prettierrc.js")),
        "Prettier 配置文件存在"
      );
      this.assert(
        fs.existsSync(path.join(this.testDir, ".vscode/settings.json")),
        "VSCode 配置文件存在"
      );

      console.log(`✅ 生成了 ${configs.length} 个配置文件`);
    } finally {
      process.chdir(originalCwd);
    }
  }

  async testDependencyInstallation() {
    console.log("\n📦 测试依赖管理功能...");

    const originalCwd = process.cwd();
    process.chdir(this.testDir);

    try {
      const { PackageManager } = require("./enhanced-cli");
      const packageManager = new PackageManager();

      this.assert(packageManager.manager === "npm", "包管理器检测");

      // 测试脚本添加
      await packageManager.addScripts();

      const packageJson = fs.readJsonSync(
        path.join(this.testDir, "package.json")
      );
      this.assert(packageJson.scripts.lint !== undefined, "lint 脚本添加");
      this.assert(packageJson.scripts.format !== undefined, "format 脚本添加");

      console.log("✅ 依赖管理功能正常");
    } finally {
      process.chdir(originalCwd);
    }
  }

  async testScriptGeneration() {
    console.log("\n⚙️  测试脚本生成功能...");

    const packageJsonPath = path.join(this.testDir, "package.json");
    const packageJson = fs.readJsonSync(packageJsonPath);

    const expectedScripts = ["lint", "lint:fix", "format", "format:check"];

    for (const script of expectedScripts) {
      this.assert(
        packageJson.scripts[script] !== undefined,
        `${script} 脚本存在`
      );
    }

    console.log("✅ 所有必要脚本已生成");
  }

  async cleanup() {
    console.log("\n🧹 清理测试环境...");

    if (fs.existsSync(this.testDir)) {
      fs.removeSync(this.testDir);
    }

    console.log("✅ 清理完成");
  }

  assert(condition, message) {
    if (condition) {
      this.passed++;
      console.log(`  ✅ ${message}`);
    } else {
      this.failed++;
      console.log(`  ❌ ${message}`);
    }
  }
}

// 运行测试
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTests().catch(console.error);
}

module.exports = TestRunner;
