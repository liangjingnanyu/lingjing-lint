#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

// 获取 Node 版本
function getNodeMajorVersion() {
  const version = process.version;
  const match = version.match(/v(\d+)/);
  return match ? parseInt(match[1], 10) : 12;
}

// 检查并安装 inquirer
let inquirer;
(async () => {
  const nodeMajor = getNodeMajorVersion();
  let inquirerVersion = nodeMajor < 14 ? "8" : "9";
  try {
    inquirer = require("inquirer");
  } catch (e) {
    // 只装 inquirer，不写入 package.json，不理会 peer/engines
    console.log(
      `\n📦 正在安装兼容的 inquirer 版本: inquirer@${inquirerVersion} ...`
    );
    try {
      if (fs.existsSync("yarn.lock")) {
        child_process.execSync(
          `yarn add inquirer@${inquirerVersion} --dev --ignore-scripts --ignore-engines --no-lockfile --silent`,
          { stdio: "inherit" }
        );
      } else {
        child_process.execSync(
          `npm install inquirer@${inquirerVersion} --no-save --ignore-scripts --legacy-peer-deps --silent`,
          { stdio: "inherit" }
        );
      }
      inquirer = require("inquirer");
      console.log("✅ inquirer 安装成功!");
    } catch (err) {
      console.error(
        "❌ inquirer 安装失败，请手动安装: inquirer@" + inquirerVersion
      );
      process.exit(1);
    }
  }
})();

// 用户输入函数（使用 inquirer）
function getUserInput(prompt, defaultValue) {
  defaultValue = defaultValue || "";
  if (!inquirer) inquirer = require("inquirer");
  return inquirer
    .prompt([
      {
        type: "input",
        name: "result",
        message: prompt,
        default: defaultValue,
      },
    ])
    .then(function (res) {
      return res.result;
    });
}

// 显示版本对比信息
function showVersionComparison() {
  console.log("\n📊 版本功能对比：");
  console.log("┌─────────────────────┬─────────────┬─────────────┐");
  console.log("│ 功能特性            │   增强版    │    原版     │");
  console.log("├─────────────────────┼─────────────┼─────────────┤");
  console.log("│ 智能项目检测        │     ✅      │     ❌      │");
  console.log("│ 多配置预设          │     ✅      │     ❌      │");
  console.log("│ 进度可视化          │     ✅      │     ❌      │");
  console.log("│ VSCode 自动配置     │     ✅      │     ❌      │");
  console.log("│ 多框架支持          │     ✅      │     ❌      │");
  console.log("│ TSLint 支持         │     ✅      │     ❌      │");
  console.log("│ 脚本自动添加        │     ✅      │     ❌      │");
  console.log("│ 错误恢复建议        │     ✅      │     ❌      │");
  console.log("│ Node 12 兼容        │     ✅      │     ✅      │");
  console.log("│ 稳定性              │    良好     │    极佳     │");
  console.log("└─────────────────────┴─────────────┴─────────────┘");
  console.log("\n💡 建议：");
  console.log("   • 新项目或追求最佳体验 → 选择增强版");
  console.log("   • 生产环境或追求稳定性 → 选择原版");
}

// 获取合适的增强版入口文件
function getEnhancedEntryFile() {
  const nodeVersion = getNodeMajorVersion();

  if (nodeVersion >= 16) {
    return "enhanced-cli.js";
  } else {
    return "enhanced-cli-node12.js";
  }
}

// 显示 Node 版本信息
function showNodeVersionInfo() {
  const nodeVersion = getNodeMajorVersion();
  console.log("\n🔍 系统信息：");
  console.log("   Node.js 版本: " + process.version);

  if (nodeVersion >= 16) {
    console.log("   ✅ 支持所有功能，将使用现代语法版本");
  } else if (nodeVersion >= 12) {
    console.log("   ✅ 兼容模式，将使用 Node 12 兼容版本");
  } else {
    console.log("   ⚠️  版本较低，建议升级到 Node 12+ 以获得最佳体验");
  }
}

// 执行选择的版本
async function executeVersion(choice) {
  let scriptPath;
  let versionName;

  if (choice === "enhanced") {
    scriptPath = path.join(__dirname, getEnhancedEntryFile());
    versionName = "增强版";
  } else {
    scriptPath = path.join(__dirname, "index.js");
    versionName = "原版";
  }

  console.log("\n🚀 启动 " + versionName + " 配置工具...");
  console.log("─".repeat(50));

  // 检查文件是否存在
  if (!fs.existsSync(scriptPath)) {
    console.error("❌ 错误：找不到 " + versionName + " 入口文件");
    console.error("   文件路径：" + scriptPath);
    process.exit(1);
  }

  try {
    // 使用 spawn 而不是 exec 来保持交互性
    const child = child_process.spawn("node", [scriptPath], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    child.on("exit", function (code) {
      if (code !== 0) {
        console.error("\n❌ " + versionName + " 执行失败，退出码：" + code);
        process.exit(code);
      }
    });

    child.on("error", function (error) {
      console.error("\n❌ 启动 " + versionName + " 时出错：" + error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("\n❌ 执行 " + versionName + " 时出错：" + error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    // 检查是否有命令行参数直接指定版本
    const args = process.argv.slice(2);

    if (args.includes("--enhanced") || args.includes("-e")) {
      showNodeVersionInfo();
      await executeVersion("enhanced");
      return;
    }

    if (args.includes("--legacy") || args.includes("-l")) {
      await executeVersion("legacy");
      return;
    }

    if (args.includes("--help") || args.includes("-h")) {
      console.log("\n🚀 liangjing-lint-start 使用说明");
      console.log("\n命令行选项：");
      console.log("  --enhanced, -e    直接使用增强版");
      console.log("  --legacy, -l      直接使用原版");
      console.log("  --help, -h        显示帮助信息");
      console.log("\n交互式使用：");
      console.log("  npx liangjing-lint-start");
      return;
    }

    // 交互式选择
    while (true) {
      console.log("\n🚀 欢迎使用 liangjing-lint-start 配置工具！");
      showNodeVersionInfo();

      if (!inquirer) inquirer = require("inquirer");
      const versionChoice = await inquirer.prompt([
        {
          type: "list",
          name: "version",
          message: "请选择要使用的版本：",
          choices: [
            {
              name: "🔥 增强版 - 智能检测、多预设、VSCode集成（推荐）",
              value: "enhanced",
            },
            { name: "📦 原版 - 经典版本，稳定可靠", value: "legacy" },
            { name: "❓ 查看版本对比", value: "compare" },
          ],
          default: "enhanced",
        },
      ]);

      if (versionChoice.version === "compare") {
        showVersionComparison();
        await getUserInput("\n按回车键继续选择...", "");
        continue;
      } else {
        await executeVersion(versionChoice.version);
        return;
      }
    }
  } catch (error) {
    console.error("\n❌ 程序执行出错：" + error.message);
    process.exit(1);
  }
}

// 处理进程信号
process.on("SIGINT", function () {
  console.log("\n\n👋 用户取消操作，退出程序");
  process.exit(0);
});

process.on("SIGTERM", function () {
  console.log("\n\n👋 程序被终止，退出");
  process.exit(0);
});

// 启动程序
if (require.main === module) {
  main().catch(function (error) {
    console.error("❌ 未捕获的错误：" + error.message);
    process.exit(1);
  });
}

module.exports = { main: main, getNodeMajorVersion: getNodeMajorVersion };
