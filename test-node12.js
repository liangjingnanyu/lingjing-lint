#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

// 测试 Node 12 兼容版本
class Node12TestRunner {
  constructor() {
    this.testDir = path.join(__dirname, "test-node12-project");
    this.passed = 0;
    this.failed = 0;
  }

  async runTests() {
    console.log("🧪 开始测试 Node 12 兼容版 liangjing-lint-start 工具\n");

    try {
      await this.setupTestProject();
      await this.testBasicFunctionality();
      await this.cleanup();

      console.log("\n📊 测试结果: " + this.passed + " 通过, " + this.failed + " 失败");
      
      if (this.failed === 0) {
        console.log("🎉 Node 12 兼容版测试通过！");
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
      name: "test-node12-project",
      version: "1.0.0",
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0"
      },
      devDependencies: {
        typescript: "^4.9.0",
        "@types/react": "^18.0.0"
      }
    };

    fs.writeJsonSync(path.join(this.testDir, "package.json"), packageJson, { spaces: 2 });
    
    this.assert(fs.existsSync(this.testDir), "测试项目目录创建");
    console.log("✅ 测试项目设置完成");
  }

  async testBasicFunctionality() {
    console.log("\n🔍 测试基础功能...");
    
    // 导入工具类
    const originalCwd = process.cwd();
    process.chdir(this.testDir);

    try {
      const { Utils } = require("./enhanced-cli-node12");
      
      // 测试 Node 版本检测
      const nodeVersion = Utils.getNodeMajorVersion();
      this.assert(typeof nodeVersion === "number", "Node 版本检测");
      
      // 测试项目类型检测
      const detected = Utils.detectProjectType();
      this.assert(detected.language === "typescript", "TypeScript 项目检测");
      this.assert(detected.framework === "react", "React 框架检测");
      
      console.log("✅ 检测结果: " + detected.language + " + " + detected.framework);
      
      // 测试包管理器检测
      const { PackageManager } = require("./enhanced-cli-node12");
      const packageManager = new PackageManager();
      this.assert(packageManager.manager === "npm", "包管理器检测");
      
      console.log("✅ 基础功能测试通过");
    } finally {
      process.chdir(originalCwd);
    }
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
      console.log("  ✅ " + message);
    } else {
      this.failed++;
      console.log("  ❌ " + message);
    }
  }
}

// 运行测试
if (require.main === module) {
  const runner = new Node12TestRunner();
  runner.runTests().catch(console.error);
}

module.exports = Node12TestRunner;
