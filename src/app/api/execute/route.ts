import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: '无效的指令' },
        { status: 400 }
      );
    }

    // 解析指令类型
    const commandLower = command.toLowerCase().trim();
    let result = '';

    // 文件操作 - 读取文件
    if (commandLower.startsWith('读取文件') || commandLower.startsWith('查看文件') || commandLower.startsWith('cat ')) {
      const match = command.match(/(?:读取文件|查看文件|cat)\s+(.+)/i);
      if (match) {
        const filePath = match[1].trim();
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          result = `✓ 文件内容: ${filePath}\n\n${content}`;
        } catch (error) {
          result = `✗ 读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`;
        }
      } else {
        result = '请指定要读取的文件路径，例如: 读取文件 README.md';
      }
    }
    // 列出文件
    else if (commandLower === 'ls' || commandLower === '列出文件' || commandLower === 'dir') {
      try {
        const files = await fs.readdir(process.cwd());
        result = `✓ 当前目录文件:\n\n${files.map(f => `  • ${f}`).join('\n')}`;
      } catch (error) {
        result = `✗ 列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`;
      }
    }
    // 执行 Shell 命令
    else if (commandLower.startsWith('执行') || commandLower.startsWith('运行') || commandLower.startsWith('!')) {
      const shellCommand = command.replace(/^(执行|运行|!)\s*/i, '').trim();
      try {
        const output = execSync(shellCommand, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
        result = `✓ 命令执行成功: ${shellCommand}\n\n输出:\n${output}`;
      } catch (error) {
        result = `✗ 命令执行失败: ${shellCommand}\n\n${error instanceof Error ? error.message : '未知错误'}`;
      }
    }
    // 显示当前目录
    else if (commandLower === 'pwd' || commandLower === '当前目录' || commandLower === '工作目录') {
      result = `✓ 当前工作目录:\n${process.cwd()}`;
    }
    // 创建文件
    else if (commandLower.startsWith('创建文件') || commandLower.startsWith('新建文件')) {
      const match = command.match(/(?:创建文件|新建文件)\s+(.+)/i);
      if (match) {
        const filePath = match[1].trim();
        try {
          await fs.writeFile(filePath, `创建于 ${new Date().toLocaleString()}\n`, 'utf-8');
          result = `✓ 文件已创建: ${filePath}`;
        } catch (error) {
          result = `✗ 创建文件失败: ${error instanceof Error ? error.message : '未知错误'}`;
        }
      } else {
        result = '请指定要创建的文件路径，例如: 创建文件 test.txt';
      }
    }
    // 代码生成
    else if (commandLower.includes('生成') || commandLower.includes('写代码') || commandLower.includes('实现')) {
      if (commandLower.includes('hello') || commandLower.includes('hello world')) {
        result = `✓ 生成 Hello World 代码:\n\nPython:\n\`\`\`python\nprint("Hello, World!")\n\`\`\`\n\nJavaScript:\n\`\`\`javascript\nconsole.log("Hello, World!");\n\`\`\`\n\nHTML:\n\`\`\`html\n<h1>Hello, World!</h1>\n\`\`\``;
      } else {
        result = `✓ 代码生成指令已接收\n\n你的指令: ${command}\n\n我可以帮你生成以下类型的代码:\n\n• Hello World 程序\n• Next.js 组件\n• Python 脚本\n• API 路由\n• 数据库操作\n\n请告诉我具体需要什么，我会为你生成完整的代码。`;
      }
    }
    // 系统信息
    else if (commandLower === '系统信息' || commandLower === 'info' || commandLower === '系统') {
      result = `✓ 系统信息:\n\n• Node.js 版本: ${process.version}\n• 平台: ${process.platform}\n• 架构: ${process.arch}\n• 内存使用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB\n• 运行时间: ${Math.round(process.uptime())}秒`;
    }
    // 帮助
    else if (commandLower === '帮助' || commandLower === 'help' || commandLower === '?') {
      result = `✓ 可用指令:\n\n文件操作:\n  • 读取文件 <路径> - 查看文件内容\n  • 创建文件 <路径> - 创建新文件\n  • ls - 列出当前目录文件\n\n系统操作:\n  • pwd - 显示当前目录\n  • 系统信息 - 显示系统状态\n  • 执行 <命令> - 执行 Shell 命令\n\n代码生成:\n  • 生成 Hello World - 生成示例代码\n  • 生成 <功能> - 生成指定功能代码\n\n其他:\n  • 帮助 - 显示此帮助信息`;
    }
    // 默认回复
    else {
      result = `✓ 指令已接收\n\n你的指令: ${command}\n\n我不太理解这个指令。\n\n输入 "帮助" 查看所有可用指令。\n\n或者你可以试试:\n• 读取文件 README.md\n• ls - 列出文件\n• 系统信息\n• 生成 Hello World`;
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('执行出错:', error);
    return NextResponse.json(
      { error: `执行出错: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
