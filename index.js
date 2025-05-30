#!/usr/bin/env node
// Node 12 兼容版：使用 CommonJS 语法
const fs = require('fs-extra');
const path = require('path');

// 检查 Node 版本并自动安装合适的 inquirer 版本
function getNodeMajorVersion() {
  const version = process.version;
  const match = version.match(/v(\d+)/);
  return match ? parseInt(match[1], 10) : 14;
}

const nodeMajor = getNodeMajorVersion();
let inquirerVersion = 'inquirer@9';
if (nodeMajor < 14) {
  inquirerVersion = 'inquirer@8';
}

// 检查 inquirer 是否已安装且版本合适
let needInstallInquirer = false;
try {
  const inquirerPkgPath = require.resolve('inquirer/package.json', { paths: [process.cwd()] });
  const inquirerPkg = require(inquirerPkgPath);
  const currentVer = inquirerPkg.version.split('.')[0];
  if ((nodeMajor < 14 && currentVer !== '8') || (nodeMajor >= 14 && currentVer === '8')) {
    needInstallInquirer = true;
  }
} catch (e) {
  needInstallInquirer = true;
}
if (needInstallInquirer) {
  console.log(`\n📦 Installing compatible inquirer version: ${inquirerVersion} ...`);
  try {
    require('child_process').execSync(`npm install -D ${inquirerVersion}`, { stdio: 'inherit' });
    console.log('✅ inquirer installed!');
  } catch (e) {
    console.error('❌ Failed to install inquirer. Please install it manually:', inquirerVersion);
    process.exit(1);
  }
}

const templateDir = path.join(__dirname, 'templates');

// 先询问用户使用 npm 还是 yarn
const inquirer = require('inquirer');
(async () => {
  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: '请选择包管理器（Choose your package manager）:',
      choices: ['npm', 'yarn'],
      default: 'npm',
    },
  ]);

  // 用户交互问题
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'isTsProject',
        message: 'Is this a TypeScript project?',
        default: false,
      },
    ])
    .then((answers) => {
      answers.packageManager = packageManager;

      // 生成 ESLint 配置
      const eslintSource = answers.isTsProject
        ? path.join(templateDir, 'ts-eslint.js')
        : path.join(templateDir, 'eslint.js');
      const eslintDest = path.join(process.cwd(), '.eslintrc.js');
      fs.copySync(eslintSource, eslintDest);
      console.log(`✅ Created .eslintrc.js at ${eslintDest}`);

      // 生成 Prettier 配置
      const prettierSource = path.join(templateDir, 'prettier.js');
      const prettierDest = path.join(process.cwd(), '.prettierrc.js');
      fs.copySync(prettierSource, prettierDest);
      console.log(`✅ Created .prettierrc.js at ${prettierDest}`);

      // 检查本地 eslint 版本
      let eslintVersion = null;
      try {
        const eslintPkgPath = require.resolve('eslint/package.json', { paths: [process.cwd()] });
        eslintVersion = require(eslintPkgPath).version;
      } catch (e) {
        // eslint 未安装
      }

      // 根据 eslint 版本和 node 版本选择依赖
      let prettierVer = 'prettier';
      let prettierConfigVer = 'eslint-config-prettier';
      let prettierPluginVer = 'eslint-plugin-prettier';
      let reactPluginVer = 'eslint-plugin-react';
      let reactHooksPluginVer = 'eslint-plugin-react-hooks';
      let tsParserVer = '@typescript-eslint/parser';
      let tsPluginVer = '@typescript-eslint/eslint-plugin';

      if (nodeMajor < 14) {
        prettierVer = 'prettier@2';
        prettierConfigVer = 'eslint-config-prettier@6';
        prettierPluginVer = 'eslint-plugin-prettier@3';
        reactPluginVer = 'eslint-plugin-react@7';
        reactHooksPluginVer = 'eslint-plugin-react-hooks@2';
        tsParserVer = '@typescript-eslint/parser@2';
        tsPluginVer = '@typescript-eslint/eslint-plugin@2';
      } else if (eslintVersion && /^6\./.test(eslintVersion)) {
        prettierConfigVer = 'eslint-config-prettier@6';
        prettierPluginVer = 'eslint-plugin-prettier@3';
        reactPluginVer = 'eslint-plugin-react@7';
        reactHooksPluginVer = 'eslint-plugin-react-hooks@2';
        tsParserVer = '@typescript-eslint/parser@2';
        tsPluginVer = '@typescript-eslint/eslint-plugin@2';
      } else if (eslintVersion && /^7\./.test(eslintVersion)) {
        // 可根据需要细化7.x的依赖版本
        reactPluginVer = 'eslint-plugin-react@7';
        reactHooksPluginVer = 'eslint-plugin-react-hooks@4';
        tsParserVer = '@typescript-eslint/parser@4';
        tsPluginVer = '@typescript-eslint/eslint-plugin@4';
      }
      // Node 12 环境下，所有依赖锁定兼容版本
      if (nodeMajor < 14) {
        prettierVer = 'prettier@2';
        prettierConfigVer = 'eslint-config-prettier@6';
        prettierPluginVer = 'eslint-plugin-prettier@3';
        reactPluginVer = 'eslint-plugin-react@7';
        reactHooksPluginVer = 'eslint-plugin-react-hooks@2';
        tsParserVer = '@typescript-eslint/parser@2';
        tsPluginVer = '@typescript-eslint/eslint-plugin@2';
      }

      const baseDeps = [
        nodeMajor < 14 ? 'eslint@6' : 'eslint',
        prettierVer,
        prettierConfigVer,
        prettierPluginVer
      ];
      const reactDeps = [
        reactPluginVer,
        reactHooksPluginVer
      ];
      const tsDeps = [
        tsParserVer,
        tsPluginVer
      ];
      const deps = baseDeps.concat(reactDeps, answers.isTsProject ? tsDeps : []);
      console.log('\n📦 Installing dependencies...');
      // 删除 node_modules 但保留 inquirer
      const fsExtra = require('fs-extra');
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      if (fsExtra.existsSync(nodeModulesPath)) {
        try {
          console.log('\n🧹 Removing node_modules except inquirer...');
          const inquirerPath = path.join(nodeModulesPath, 'inquirer');
          const inquirerExists = fsExtra.existsSync(inquirerPath);
          let tempInquirer = null;
          if (inquirerExists) {
            tempInquirer = path.join(process.cwd(), '__temp_inquirer');
            fsExtra.moveSync(inquirerPath, tempInquirer, { overwrite: true });
          }
          fsExtra.removeSync(nodeModulesPath);
          fsExtra.ensureDirSync(nodeModulesPath);
          if (inquirerExists) {
            fsExtra.moveSync(tempInquirer, inquirerPath, { overwrite: true });
          }
          console.log('✅ node_modules cleaned (inquirer preserved)!');
        } catch (e) {
          console.warn('⚠️  Failed to remove node_modules. Please remove it manually if needed.');
        }
      }
      // 删除用户原有相关依赖
      const removeDeps = [
        'eslint',
        'prettier',
        'eslint-config-prettier',
        'eslint-plugin-prettier',
        'eslint-plugin-react',
        'eslint-plugin-react-hooks',
        '@typescript-eslint/parser',
        '@typescript-eslint/eslint-plugin'
      ];
      try {
        console.log('\n🧹 Removing old lint dependencies...');
        require('child_process').execSync(`${answers.packageManager} remove ` + removeDeps.join(' '), { stdio: 'inherit' });
        console.log('✅ Old dependencies removed!');
      } catch (e) {
        console.warn('⚠️  Failed to remove some dependencies. You may ignore if not present.');
      }
      try {
        let installCmd = '';
        if (answers.packageManager === 'yarn') {
          installCmd = `yarn add -D ${deps.join(' ')} --ignore-engines`;
        } else {
          installCmd = `npm install -D ${deps.join(' ')} --legacy-peer-deps`;
        }
        require('child_process').execSync(installCmd, { stdio: 'inherit' });
        console.log('✅ Dependencies installed!');
      } catch (e) {
        console.error('❌ Failed to install dependencies. Please install them manually:', deps.join(' '));
      }

      // 修改 package.json，添加 lint/format 脚本
      const pkgPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = fs.readJsonSync(pkgPath);
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.lint = answers.isTsProject
          ? 'eslint --ext .js,.jsx,.ts,.tsx src'
          : 'eslint --ext .js,.jsx src';
        pkg.scripts.format = answers.isTsProject
          ? 'prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"'
          : 'prettier --write "src/**/*.{js,jsx,json,css,md}"';
        fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
        console.log('✅ Added lint/format scripts to package.json');
      } else {
        console.warn('⚠️  package.json not found. Please add lint/format scripts manually.');
      }

      // 自动执行格式化（仅 Node 14 及以上才尝试自动执行）
      if (nodeMajor >= 14) {
        try {
          console.log('\n✨ Running code format...');
          require('child_process').execSync('npm run format', { stdio: 'inherit' });
          console.log('✅ Code formatted!');
        } catch (e) {
          console.warn('⚠️  Failed to auto format code. Please run "npm run format" manually.');
        }
      } else {
        console.warn('⚠️  当前 Node 版本过低（<14），请手动运行 npm run format 进行格式化。');
      }

      console.log('\n🎉 Configuration files generated successfully!');
    })
    .catch((error) => {
      console.error('❌ Error during configuration:', error);
    });
})();