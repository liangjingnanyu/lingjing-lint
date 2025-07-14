#!/usr/bin/env node
// Node 12 兼容版：使用 CommonJS 语法
const fs = require("fs-extra");
const path = require("path");
const child_process = require("child_process");

// 检查 Node 版本
function getNodeMajorVersion() {
  const version = process.version;
  const match = version.match(/v(\d+)/);
  return match ? parseInt(match[1], 10) : 14;
}

const nodeMajor = getNodeMajorVersion();
let inquirerVersion = "inquirer@9";
if (nodeMajor < 14) {
  inquirerVersion = "inquirer@8";
}

// 先询问包管理器，再切换 registry，再安装 inquirer
(async () => {
  // 1. 询问包管理器
  let packageManager = "npm";
  try {
    // 这里用最基础的 stdin/stdout 兼容 Node 12，无需 inquirer
    process.stdout.write("请选择包管理器（npm/yarn，默认npm）：");
    process.stdin.setEncoding("utf8");
    const input = await new Promise((resolve) => {
      process.stdin.once("data", (data) => resolve(data.trim()));
    });
    if (input && input.toLowerCase().startsWith("y")) packageManager = "yarn";
  } catch (e) {}

  // 2. 切换 registry
  try {
    if (packageManager === "yarn") {
      child_process.execSync(
        "yarn config set registry https://registry.npmjs.org/",
        { stdio: "inherit" }
      );
    } else {
      child_process.execSync(
        "npm config set registry https://registry.npmjs.org/",
        { stdio: "inherit" }
      );
    }
    console.log("✅ 已设置 registry 为 https://registry.npmjs.org/");
  } catch (e) {
    console.warn("⚠️ 设置 registry 失败，如遇网络问题请手动切换。");
  }

  // 3. 清理 lock 文件
  const lockFile =
    packageManager === "yarn"
      ? path.join(process.cwd(), "yarn.lock")
      : path.join(process.cwd(), "package-lock.json");
  if (fs.existsSync(lockFile)) {
    fs.removeSync(lockFile);
    console.log("✅ 已移除 lock 文件，确保全新安装依赖。");
  }

  // 3.5. 临时移走 package.json 和 lock 文件，确保只装 inquirer
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, "package.json");
  const pkgBak = path.join(cwd, "package.json.liangjingbak");
  const lockBak =
    packageManager === "yarn"
      ? path.join(cwd, "yarn.lock.liangjingbak")
      : path.join(cwd, "package-lock.json.liangjingbak");
  let pkgMoved = false,
    lockMoved = false;
  if (fs.existsSync(pkgPath)) {
    fs.moveSync(pkgPath, pkgBak, { overwrite: true });
    pkgMoved = true;
  }
  const lockFile2 =
    packageManager === "yarn"
      ? path.join(cwd, "yarn.lock")
      : path.join(cwd, "package-lock.json");
  if (fs.existsSync(lockFile2)) {
    fs.moveSync(lockFile2, lockBak, { overwrite: true });
    lockMoved = true;
  }

  // 4. 安装 inquirer（只装 inquirer，不写入 package.json，不理会 peer/engines）
  console.log(`\n📦 正在安装兼容的 inquirer 版本: ${inquirerVersion} ...`);
  try {
    if (packageManager === "yarn") {
      child_process.execSync(
        `yarn add inquirer@${inquirerVersion.replace(
          "inquirer@",
          ""
        )} --dev --ignore-scripts --ignore-engines --no-lockfile --silent`,
        { stdio: "inherit" }
      );
    } else {
      child_process.execSync(
        `npm install inquirer@${inquirerVersion.replace(
          "inquirer@",
          ""
        )} --no-save --ignore-scripts --legacy-peer-deps --silent`,
        { stdio: "inherit" }
      );
    }
    console.log("✅ inquirer 安装成功!");
  } catch (e) {
    console.error("❌ inquirer 安装失败，请手动安装:", inquirerVersion);
    // 恢复文件
    if (pkgMoved) fs.moveSync(pkgBak, pkgPath, { overwrite: true });
    if (lockMoved) fs.moveSync(lockBak, lockFile, { overwrite: true });
    process.exit(1);
  }
  // 安装后恢复 package.json 和 lock 文件
  if (pkgMoved) fs.moveSync(pkgBak, pkgPath, { overwrite: true });
  if (lockMoved) fs.moveSync(lockBak, lockFile, { overwrite: true });

  // 5. require inquirer 并继续后续流程
  const inquirer = require("inquirer");
  const templateDir = path.join(__dirname, "templates");

  // 清理 node_modules 但保留 inquirer
  const fsExtra = require("fs-extra");
  const nodeModulesPath = path.join(process.cwd(), "node_modules");
  if (fsExtra.existsSync(nodeModulesPath)) {
    try {
      console.log("\n🧹 正在清理 node_modules（保留 inquirer）...");
      const inquirerPath = path.join(nodeModulesPath, "inquirer");
      const inquirerExists = fsExtra.existsSync(inquirerPath);
      let tempInquirer = null;
      if (inquirerExists) {
        tempInquirer = path.join(process.cwd(), "__temp_inquirer");
        fsExtra.moveSync(inquirerPath, tempInquirer, { overwrite: true });
      }
      fsExtra.removeSync(nodeModulesPath);
      fsExtra.ensureDirSync(nodeModulesPath);
      if (inquirerExists) {
        fsExtra.moveSync(tempInquirer, inquirerPath, { overwrite: true });
      }
      console.log("✅ 已清理 node_modules（已保留 inquirer）!");
    } catch (e) {
      console.warn("⚠️ 清理 node_modules 失败，如有需要请手动删除。");
    }
  }
  // 删除用户原有相关依赖
  const removeDeps = [
    "eslint",
    "prettier",
    "eslint-config-prettier",
    "eslint-plugin-prettier",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks",
    "@typescript-eslint/parser",
    "@typescript-eslint/eslint-plugin",
  ];
  try {
    console.log("\n🧹 正在移除旧的 lint 相关依赖...");
    require("child_process").execSync(
      `${packageManager} remove ` + removeDeps.join(" "),
      { stdio: "inherit" }
    );
    console.log("✅ 旧依赖已移除!");
  } catch (e) {
    console.warn("⚠️ 某些依赖移除失败，如未安装可忽略。");
  }

  // 询问是否是 TypeScript 项目
  const { isTsProject } = await inquirer.prompt([
    {
      type: "list",
      name: "isTsProject",
      message: "请选择项目模版（Choose your project template）:",
      choices: ["TypeScript", "javaScript"],
      default: "TypeScript",
    },
  ]);

  // 生成 ESLint 配置
  const eslintSource =
    isTsProject === "TypeScript"
      ? path.join(templateDir, "ts-eslint.js")
      : path.join(templateDir, "eslint.js");
  const eslintDest = path.join(process.cwd(), ".eslintrc.js");
  fs.copySync(eslintSource, eslintDest);
  console.log(`✅ 已生成 .eslintrc.js 配置文件: ${eslintDest}`);

  // 生成 Prettier 配置
  const prettierSource = path.join(templateDir, "prettier.js");
  const prettierDest = path.join(process.cwd(), ".prettierrc.js");
  fs.copySync(prettierSource, prettierDest);
  console.log(`✅ 已生成 .prettierrc.js 配置文件: ${prettierDest}`);

  // 检查本地 eslint 版本
  let eslintVersion = null;
  try {
    const eslintPkgPath = require.resolve("eslint/package.json", {
      paths: [process.cwd()],
    });
    eslintVersion = require(eslintPkgPath).version;
  } catch (e) {
    // eslint 未安装
  }

  // 根据 eslint 版本和 node 版本选择依赖
  // prettier 及相关依赖版本选择逻辑
  let prettierVer,
    prettierConfigVer,
    prettierPluginVer,
    reactPluginVer,
    reactHooksPluginVer,
    tsParserVer,
    tsPluginVer;

  if (nodeMajor < 14) {
    prettierVer = "prettier@2";
    prettierConfigVer = "eslint-config-prettier@6";
    prettierPluginVer = "eslint-plugin-prettier@3";
    reactPluginVer = "eslint-plugin-react@7";
    reactHooksPluginVer = "eslint-plugin-react-hooks@2";
    tsParserVer = "@typescript-eslint/parser@2";
    tsPluginVer = "@typescript-eslint/eslint-plugin@2";
  } else if (eslintVersion && /^6\./.test(eslintVersion)) {
    prettierVer = "prettier@2";
    prettierConfigVer = "eslint-config-prettier@6";
    prettierPluginVer = "eslint-plugin-prettier@3";
    reactPluginVer = "eslint-plugin-react@7";
    reactHooksPluginVer = "eslint-plugin-react-hooks@2";
    tsParserVer = "@typescript-eslint/parser@2";
    tsPluginVer = "@typescript-eslint/eslint-plugin@2";
  } else if (eslintVersion && /^7\./.test(eslintVersion)) {
    prettierVer = "prettier@2";
    prettierConfigVer = "eslint-config-prettier@8";
    prettierPluginVer = "eslint-plugin-prettier@4";
    reactPluginVer = "eslint-plugin-react@7";
    reactHooksPluginVer = "eslint-plugin-react-hooks@4";
    tsParserVer = "@typescript-eslint/parser@4";
    tsPluginVer = "@typescript-eslint/eslint-plugin@4";
  } else {
    // 默认最新
    prettierVer = "prettier";
    prettierConfigVer = "eslint-config-prettier";
    prettierPluginVer = "eslint-plugin-prettier";
    reactPluginVer = "eslint-plugin-react";
    reactHooksPluginVer = "eslint-plugin-react-hooks";
    tsParserVer = "@typescript-eslint/parser";
    tsPluginVer = "@typescript-eslint/eslint-plugin";
  }

  const baseDeps = [
    nodeMajor < 14 ? "eslint@6" : "eslint",
    prettierVer,
    prettierConfigVer,
    prettierPluginVer,
  ];
  const reactDeps = [reactPluginVer, reactHooksPluginVer];
  const tsDeps = [tsParserVer, tsPluginVer];
  const deps = baseDeps.concat(reactDeps, isTsProject ? tsDeps : []);
  console.log("\n📦 开始安装依赖...");

  try {
    let installCmd = "";
    if (packageManager === "yarn") {
      installCmd = `yarn add -D ${deps.join(" ")} --ignore-engines`;
    } else {
      installCmd = `npm install -D ${deps.join(" ")} --legacy-peer-deps`;
    }
    require("child_process").execSync(installCmd, { stdio: "inherit" });
    console.log("✅ 依赖安装完成!");
  } catch (e) {
    console.error("❌ 依赖安装失败，请手动安装以下依赖:", deps.join(" "));
  }

  // 修改 package.json，添加 lint/format 脚本
  const pkgPath2 = path.join(process.cwd(), "package.json");
  if (fs.existsSync(pkgPath2)) {
    const pkg = fs.readJsonSync(pkgPath2);
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.lint = isTsProject
      ? "eslint --ext .js,.jsx,.ts,.tsx src"
      : "eslint --ext .js,.jsx src";
    pkg.scripts.format = isTsProject
      ? 'prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"'
      : 'prettier --write "src/**/*.{js,jsx,json,css,md}"';
    fs.writeJsonSync(pkgPath2, pkg, { spaces: 2 });
    console.log("✅ 已为 package.json 添加 lint/format 脚本");
  } else {
    console.warn("⚠️ 未找到 package.json，请手动添加 lint/format 脚本。");
  }

  // 自动执行格式化前，统一询问用户是否需要自动运行 format 脚本（不再判断 Node 版本）
  const { confirmFormat } = await inquirer.prompt([
    {
      type: "list",
      name: "confirmFormat",
      message: "是否现在自动运行 format 脚本格式化代码？",
      choices: ["是的，为我格式化全部代码", "不需要，我稍后手动运行"],
      default: "是的，为我格式化全部代码",
    },
  ]);

  if (confirmFormat === "是的，为我格式化全部代码") {
    try {
      const runFormatCmd =
        packageManager === "yarn" ? "yarn format" : "npm run format";
      console.log("\n✨ 正在自动格式化代码...");
      require("child_process").execSync(runFormatCmd, { stdio: "inherit" });
      console.log("✅ 代码已自动格式化!");
    } catch (e) {
      console.warn("⚠️ 自动格式化失败，请手动运行 format 脚本。");
    }
  } else {
    console.warn("⚠️ 已跳过自动格式化，你可以稍后手动运行 format 脚本。");
  }

  // 自动生成统一的 VS Code TypeScript 团队配置
  const vscodeDir = path.join(process.cwd(), ".vscode");
  const vscodeSettingsPath = path.join(vscodeDir, "settings.json");
  fs.ensureDirSync(vscodeDir);
  fs.writeJsonSync(
    vscodeSettingsPath,
    {
      "typescript.tsdk": "node_modules/typescript/lib",
      "typescript.enablePromptUseWorkspaceTsdk": true,
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll": "always",
        "source.organizeImports": "always",
      },
      "editor.suggestSelection": "first",
      "editor.quickSuggestions": {
        other: true,
        comments: false,
        strings: false,
      },
      "eslint.enable": true,
      "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
      ],
    },
    { spaces: 2 }
  );
  console.log(
    "✅ 已生成 .vscode/settings.json，统一团队 TypeScript 类型提示和格式化规则"
  );

  console.log("\n🎉 项目配置成功!");
})();
