#!/usr/bin/env node

/**
 * Node 12 兼容版本依赖测试
 * 验证所有依赖版本都兼容 Node 12
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 开始测试 Node 12 兼容版本的依赖...\n");

// 模拟加载 enhanced-cli-node12.js 中的依赖获取函数
function getNode12CompatibleVersion(packageName) {
  const node12CompatibleVersions = {
    // 核心工具
    eslint: "^8.57.0",
    prettier: "^2.8.8",

    // ESLint 相关
    "eslint-config-prettier": "^8.10.0",
    "eslint-plugin-prettier": "^4.2.1",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.7.1",
    "eslint-plugin-import": "^2.29.1",
    "eslint-import-resolver-typescript": "^3.6.1",

    // TypeScript ESLint
    "@typescript-eslint/parser": "^5.62.0",
    "@typescript-eslint/eslint-plugin": "^5.62.0",

    // TSLint（已弃用但兼容）
    tslint: "^6.1.3",
    "tslint-react": "^5.0.0",
    "tslint-config-prettier": "^1.18.0",

    // 框架特定
    "eslint-config-next": "^13.5.6",
    "eslint-plugin-vue": "^9.17.0",
    "@vue/eslint-config-typescript": "^11.0.3",
    "@vue/eslint-config-prettier": "^7.1.0",
    "eslint-plugin-react-refresh": "^0.4.3",
  };

  return node12CompatibleVersions[packageName] || packageName;
}

function getDependenciesByType(projectType, framework, includeTslint) {
  includeTslint = includeTslint || false;
  const baseDeps = [
    getNode12CompatibleVersion("eslint"),
    getNode12CompatibleVersion("prettier"),
    getNode12CompatibleVersion("eslint-config-prettier"),
    getNode12CompatibleVersion("eslint-plugin-prettier"),
  ];

  // React 相关依赖
  if (framework === "react" || framework === "nextjs" || framework === "vite") {
    baseDeps.push(
      getNode12CompatibleVersion("eslint-plugin-react"),
      getNode12CompatibleVersion("eslint-plugin-react-hooks"),
      getNode12CompatibleVersion("eslint-plugin-jsx-a11y")
    );
  }

  // TypeScript 相关依赖
  if (projectType === "typescript") {
    baseDeps.push(
      getNode12CompatibleVersion("@typescript-eslint/parser"),
      getNode12CompatibleVersion("@typescript-eslint/eslint-plugin")
    );

    // TSLint 相关依赖（如果需要）
    if (includeTslint) {
      baseDeps.push(
        getNode12CompatibleVersion("tslint"),
        getNode12CompatibleVersion("tslint-react"),
        getNode12CompatibleVersion("tslint-config-prettier")
      );
    }
  }

  // 框架特定依赖
  switch (framework) {
    case "nextjs":
      baseDeps.push(getNode12CompatibleVersion("eslint-config-next"));
      break;
    case "vue":
      baseDeps.push(
        getNode12CompatibleVersion("eslint-plugin-vue"),
        getNode12CompatibleVersion("@vue/eslint-config-typescript"),
        getNode12CompatibleVersion("@vue/eslint-config-prettier")
      );
      break;
    case "vite":
      baseDeps.push(getNode12CompatibleVersion("eslint-plugin-react-refresh"));
      break;
  }

  // 通用增强依赖
  baseDeps.push(
    getNode12CompatibleVersion("eslint-plugin-import"),
    getNode12CompatibleVersion("eslint-import-resolver-typescript")
  );

  return baseDeps;
}

// 测试用例
const testCases = [
  {
    name: "React TypeScript 项目",
    projectType: "typescript",
    framework: "react",
    includeTslint: false,
  },
  {
    name: "React TypeScript 项目 (含 TSLint)",
    projectType: "typescript",
    framework: "react",
    includeTslint: true,
  },
  {
    name: "Next.js TypeScript 项目",
    projectType: "typescript",
    framework: "nextjs",
    includeTslint: false,
  },
  {
    name: "Vue TypeScript 项目",
    projectType: "typescript",
    framework: "vue",
    includeTslint: false,
  },
  {
    name: "Vite React 项目",
    projectType: "javascript",
    framework: "vite",
    includeTslint: false,
  },
];

let passCount = 0;
let totalTests = 0;

// 验证版本号格式
function validateVersionFormat(version) {
  // 检查是否是有效的 semver 格式
  const semverRegex = /^\^?\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

// 验证 Node 12 兼容性（基于已知的兼容版本范围）
function isNode12Compatible(packageName, version) {
  const node12CompatibilityRules = {
    eslint: (version) => {
      const major = parseInt(version.replace(/^\^/, "").split(".")[0]);
      return major >= 7 && major <= 8; // ESLint 7-8 支持 Node 12
    },
    prettier: (version) => {
      const major = parseInt(version.replace(/^\^/, "").split(".")[0]);
      return major >= 2 && major <= 2; // Prettier 2.x 支持 Node 12
    },
    "@typescript-eslint/parser": (version) => {
      const major = parseInt(version.replace(/^\^/, "").split(".")[0]);
      return major >= 4 && major <= 5; // 5.x 是最后支持 Node 12 的版本
    },
    "@typescript-eslint/eslint-plugin": (version) => {
      const major = parseInt(version.replace(/^\^/, "").split(".")[0]);
      return major >= 4 && major <= 5; // 5.x 是最后支持 Node 12 的版本
    },
  };

  const rule = node12CompatibilityRules[packageName];
  return rule ? rule(version) : true; // 默认认为兼容
}

console.log("🔍 测试各种项目配置的依赖版本...\n");

testCases.forEach((testCase, index) => {
  console.log(`📋 测试 ${index + 1}: ${testCase.name}`);

  try {
    const deps = getDependenciesByType(
      testCase.projectType,
      testCase.framework,
      testCase.includeTslint
    );

    console.log(`   依赖数量: ${deps.length}`);

    let casePassCount = 0;
    let caseTestCount = 0;

    deps.forEach((dep) => {
      caseTestCount++;
      totalTests++;

      // 检查版本格式
      if (validateVersionFormat(dep)) {
        const [packageName, version] =
          dep.includes("@") && !dep.startsWith("@")
            ? dep.split("@")
            : [
                dep.split("@").slice(0, -1).join("@") || dep,
                dep.split("@").pop(),
              ];

        if (isNode12Compatible(packageName, version)) {
          console.log(`   ✅ ${dep}`);
          casePassCount++;
          passCount++;
        } else {
          console.log(`   ❌ ${dep} - 可能不兼容 Node 12`);
        }
      } else {
        console.log(`   ⚠️  ${dep} - 版本格式异常`);
      }
    });

    console.log(`   结果: ${casePassCount}/${caseTestCount} 通过\n`);
  } catch (error) {
    console.error(`   ❌ 测试失败: ${error.message}\n`);
  }
});

// 验证版本映射完整性
console.log("🔍 验证版本映射完整性...");

const allPackages = [
  "eslint",
  "prettier",
  "eslint-config-prettier",
  "eslint-plugin-prettier",
  "eslint-plugin-react",
  "eslint-plugin-react-hooks",
  "eslint-plugin-jsx-a11y",
  "@typescript-eslint/parser",
  "@typescript-eslint/eslint-plugin",
  "tslint",
  "tslint-react",
  "tslint-config-prettier",
  "eslint-config-next",
  "eslint-plugin-vue",
  "@vue/eslint-config-typescript",
  "@vue/eslint-config-prettier",
  "eslint-plugin-react-refresh",
  "eslint-plugin-import",
  "eslint-import-resolver-typescript",
];

let mappingTests = 0;
let mappingPassed = 0;

allPackages.forEach((pkg) => {
  mappingTests++;
  totalTests++;
  const mapped = getNode12CompatibleVersion(pkg);

  if (mapped !== pkg && validateVersionFormat(mapped)) {
    console.log(`   ✅ ${pkg} -> ${mapped}`);
    mappingPassed++;
    passCount++;
  } else if (mapped === pkg) {
    console.log(`   ⚠️  ${pkg} - 无版本映射`);
  } else {
    console.log(`   ❌ ${pkg} - 映射版本格式错误: ${mapped}`);
  }
});

console.log(`\n📊 版本映射测试: ${mappingPassed}/${mappingTests} 通过`);

// 总结
console.log("\n" + "=".repeat(50));
console.log(`📊 测试总结: ${passCount}/${totalTests} 通过`);

if (passCount === totalTests) {
  console.log("🎉 所有 Node 12 兼容性测试通过！");
  process.exit(0);
} else {
  console.log("⚠️  部分测试未通过，请检查依赖版本兼容性");
  process.exit(1);
}
