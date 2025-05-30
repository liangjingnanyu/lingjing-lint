#!/usr/bin/env node
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.join(__dirname, 'templates');

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

    console.log('\n🎉 Configuration files generated successfully!');
  })
  .catch((error) => {
    console.error('❌ Error during configuration:', error);
  });