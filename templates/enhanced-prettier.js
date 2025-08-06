module.exports = {
  // 基础格式化选项
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JSX 特定选项
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // 尾随逗号
  trailingComma: 'es5',
  
  // 括号间距
  bracketSpacing: true,
  bracketSameLine: false,
  
  // 箭头函数参数括号
  arrowParens: 'avoid',
  
  // 换行符
  endOfLine: 'lf',
  
  // 嵌入式语言格式化
  embeddedLanguageFormatting: 'auto',
  
  // HTML 空格敏感性
  htmlWhitespaceSensitivity: 'css',
  
  // Vue 文件中的脚本和样式标签缩进
  vueIndentScriptAndStyle: false,
  
  // 覆盖特定文件类型的配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.{yaml,yml}',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
