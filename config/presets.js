// 配置预设 - 支持不同严格程度的配置
module.exports = {
  // 严格模式 - 适合新项目或对代码质量要求极高的项目
  strict: {
    eslint: {
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        '@typescript-eslint/recommended-requiring-type-checking',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        'react/prop-types': 'error',
        'no-console': 'error',
        'no-debugger': 'error',
        'complexity': ['error', 10],
        'max-depth': ['error', 4],
        'max-lines-per-function': ['error', 50],
      }
    },
    prettier: {
      printWidth: 80,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      arrowParens: 'always',
    }
  },

  // 标准模式 - 平衡代码质量和开发效率
  standard: {
    eslint: {
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'react/prop-types': 'off',
        'no-console': 'warn',
        'no-debugger': 'error',
      }
    },
    prettier: {
      printWidth: 80,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      arrowParens: 'avoid',
    }
  },

  // 宽松模式 - 适合遗留项目或快速原型开发
  relaxed: {
    eslint: {
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'react/prop-types': 'off',
        'no-console': 'off',
        'no-debugger': 'warn',
        '@typescript-eslint/ban-ts-comment': 'off',
      }
    },
    prettier: {
      printWidth: 120,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      trailingComma: 'none',
      arrowParens: 'avoid',
    }
  },

  // 团队模式 - 适合多人协作的团队项目
  team: {
    eslint: {
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        'react/prop-types': 'off',
        'no-console': 'warn',
        'no-debugger': 'error',
        'import/order': ['error', {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }],
        'prefer-const': 'error',
        'no-var': 'error',
      }
    },
    prettier: {
      printWidth: 100,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      arrowParens: 'avoid',
      bracketSpacing: true,
    }
  }
};

// 框架特定配置
module.exports.frameworks = {
  // Next.js 配置
  nextjs: {
    extends: ['next/core-web-vitals'],
    rules: {
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
    }
  },

  // Vite 配置
  vite: {
    env: {
      browser: true,
      es2020: true,
    },
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['react-refresh'],
    rules: {
      'react-refresh/only-export-components': 'warn',
    }
  },

  // Vue 配置
  vue: {
    extends: [
      'plugin:vue/vue3-essential',
      '@vue/eslint-config-typescript',
      '@vue/eslint-config-prettier',
    ],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
    }
  }
};
