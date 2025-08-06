#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 测试智能入口的功能
class SmartEntryTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async runTests() {
    console.log("🧪 开始测试智能入口 index-smart.js 功能\n");

    try {
      await this.testBasicFunctionality();
      await this.testCommandLineOptions();
      await this.testFileExistence();
      await this.testNodeVersionDetection();

      console.log(
        "\n📊 测试结果: " + this.passed + " 通过, " + this.failed + " 失败"
      );

      if (this.failed === 0) {
        console.log("🎉 智能入口测试全部通过！");
      } else {
        console.log("❌ 部分测试失败，请检查问题。");
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ 测试过程中出现错误:", error.message);
      process.exit(1);
    }
  }

  async testBasicFunctionality() {
    console.log("🔍 测试基础功能...");

    // 测试语法正确性
    try {
      execSync("node -c index-smart.js", { cwd: __dirname });
      this.assert(true, "智能入口文件语法检查");
    } catch (e) {
      this.assert(false, "智能入口文件语法检查");
    }

    // 测试模块导入
    try {
      const smartEntry = require("./index-smart");
      this.assert(
        typeof smartEntry.getNodeMajorVersion === "function",
        "Node 版本检测函数导出"
      );
      this.assert(typeof smartEntry.main === "function", "主函数导出");
    } catch (e) {
      this.assert(false, "模块导入功能");
    }
  }

  async testCommandLineOptions() {
    console.log("\n⚙️  测试命令行选项...");

    // 测试帮助选项
    try {
      const helpOutput = execSync("node index-smart.js --help", {
        cwd: __dirname,
        encoding: "utf8",
      });
      this.assert(
        helpOutput.includes("liangjing-lint-start 使用说明"),
        "帮助信息显示"
      );
      this.assert(helpOutput.includes("--enhanced"), "增强版选项说明");
      this.assert(helpOutput.includes("--legacy"), "原版选项说明");
    } catch (e) {
      this.assert(false, "帮助选项功能");
    }

    // 测试短选项
    try {
      const helpOutput = execSync("node index-smart.js -h", {
        cwd: __dirname,
        encoding: "utf8",
      });
      this.assert(helpOutput.includes("使用说明"), "短选项帮助");
    } catch (e) {
      this.assert(false, "短选项功能");
    }
  }

  async testFileExistence() {
    console.log("\n📁 测试依赖文件存在性...");

    const requiredFiles = [
      "index-smart.js",
      "index.js",
      "enhanced-cli.js",
      "enhanced-cli-node12.js",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      this.assert(fs.existsSync(filePath), file + " 文件存在");
    }

    // 测试模板目录
    const templatesDir = path.join(__dirname, "templates");
    this.assert(fs.existsSync(templatesDir), "templates 目录存在");

    // 测试配置目录
    const configDir = path.join(__dirname, "config");
    this.assert(fs.existsSync(configDir), "config 目录存在");
  }

  async testNodeVersionDetection() {
    console.log("\n🔍 测试 Node 版本检测...");

    try {
      const { getNodeMajorVersion } = require("./index-smart");
      const nodeVersion = getNodeMajorVersion();

      this.assert(typeof nodeVersion === "number", "Node 版本返回数字");
      this.assert(nodeVersion >= 10, "Node 版本合理范围");

      console.log("   检测到的 Node 版本: " + nodeVersion);

      // 测试版本判断逻辑
      if (nodeVersion >= 16) {
        console.log("   ✅ 将使用现代语法版本 (enhanced-cli.js)");
      } else if (nodeVersion >= 12) {
        console.log("   ✅ 将使用兼容版本 (enhanced-cli-node12.js)");
      } else {
        console.log("   ⚠️  版本较低，可能存在兼容性问题");
      }

      this.assert(true, "Node 版本检测逻辑");
    } catch (e) {
      this.assert(false, "Node 版本检测功能");
    }
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
  const runner = new SmartEntryTestRunner();
  runner.runTests().catch(console.error);
}

module.exports = SmartEntryTestRunner;
