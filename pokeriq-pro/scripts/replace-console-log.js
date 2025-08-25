#!/usr/bin/env node

/**
 * 脚本：批量替换 console.log 为统一的日志系统
 * 使用方法: node scripts/replace-console-log.js
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 要处理的文件模式
const filePatterns = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'contexts/**/*.{ts,tsx}',
];

// 排除的目录
const excludeDirs = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
];

// 替换规则
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    importNeeded: true,
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    importNeeded: true,
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    importNeeded: true,
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    importNeeded: true,
  },
];

// 导入语句
const importStatement = "import logger from '@/lib/logger';\n";

async function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let needsImport = false;

    // 应用替换规则
    replacements.forEach(({ pattern, replacement, importNeeded }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
        if (importNeeded) {
          needsImport = true;
        }
      }
    });

    if (modified) {
      // 检查是否已有导入
      const hasLoggerImport = content.includes("from '@/lib/logger'") || 
                              content.includes('from "@/lib/logger"');

      // 添加导入语句（如果需要）
      if (needsImport && !hasLoggerImport) {
        // 查找第一个导入语句的位置
        const importMatch = content.match(/^import\s+.*$/m);
        if (importMatch) {
          const importIndex = content.indexOf(importMatch[0]);
          content = content.slice(0, importIndex) + 
                   importStatement + 
                   content.slice(importIndex);
        } else {
          // 如果没有导入语句，添加到文件开头
          // 检查是否有 'use client' 或 'use server'
          const useDirectiveMatch = content.match(/^['"]use\s+(client|server)['"];?\s*$/m);
          if (useDirectiveMatch) {
            const directiveEnd = content.indexOf(useDirectiveMatch[0]) + useDirectiveMatch[0].length;
            content = content.slice(0, directiveEnd) + '\n\n' + 
                     importStatement + 
                     content.slice(directiveEnd);
          } else {
            content = importStatement + '\n' + content;
          }
        }
      }

      // 写回文件
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🔍 Searching for files to process...\n');
  
  let totalFiles = 0;
  let processedFiles = 0;

  for (const pattern of filePatterns) {
    const files = await glob(pattern, {
      ignore: excludeDirs.map(dir => `**/${dir}/**`),
      cwd: process.cwd(),
    });

    for (const file of files) {
      totalFiles++;
      const result = await processFile(file);
      processedFiles += result;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files modified: ${processedFiles}`);
  console.log('\n✨ Console.log replacement complete!');
  console.log('⚠️  Please review the changes and test your application.');
}

// 运行脚本
main().catch(console.error);