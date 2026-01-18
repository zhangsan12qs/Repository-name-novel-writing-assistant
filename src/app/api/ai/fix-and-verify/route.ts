import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      issues,
      chapterId,
      content,
      characters,
      worldSettings,
      maxIterations = 3, // 最大校核次数
    } = body;

    if (!content || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    // 系统提示词 - 修复
    const fixSystemPrompt = `你是一位专业的小说编辑，擅长修复小说中的各种写作问题。

【核心原则】
1. 全文禁止以感情线作为主线！感情戏仅作为辅助情节
2. 全文禁止以主角个人成长作为核心主线！主角变强是完成外部使命的工具
3. 禁止AI写作弊端：华美的空洞（形容词>3个/句）、逻辑bug、破坏节奏、不推剧情、内容注水、人物扁平、对话平淡、流水账、套路化
4. 每个人物出现和消失都一定有原因，不能凭空出现或消失
5. 确保内容紧凑、有悬念，避免平淡无趣`;

    // 系统提示词 - 校核
    const verifySystemPrompt = `你是一位专业的小说校核员，负责检查修复后的小说内容是否还有问题。

【校核任务】
仔细检查以下内容是否存在以下问题：
1. 华美的空洞：形容词过多（>3个/句），内容空洞
2. 逻辑bug：人设矛盾、前后不一致、情节不合理
3. 破坏节奏：过度描写破坏紧张氛围
4. 不推剧情：只写环境描写，缺乏情节推进
5. 内容注水：大量无意义描写
6. 人物扁平：角色像工具人，缺乏动机
7. 对话平淡：对话像念白，无张力
8. 流水账：连接词过多（然后/接着/之后/于是）
9. 套路化：三角恋、退婚、打脸、无敌等俗套
10. 感情线作为主线
11. 主角个人成长作为核心主线

【输出格式】
如果没有发现任何问题，请直接输出："无问题"

如果发现问题，请按以下JSON格式输出：
{
  "hasIssues": true,
  "issues": [
    {
      "type": "error",
      "category": "问题类型",
      "description": "问题描述",
      "location": "位置",
      "reason": "原因",
      "suggestion": "修改建议"
    }
  ]
}`;

    let currentContent = content;
    let iteration = 0;
    let allIssues: any[] = [];
    let iterationHistory: any[] = [];

    // 开始修复-校核循环
    while (iteration < maxIterations) {
      iteration++;

      // 步骤1：执行修复
      let fixPrompt = `你是一位专业的小说编辑，需要修复以下问题：\n\n`;

      if (iteration === 1) {
        // 第一次修复：使用原始问题
        issues.forEach((issue: any, index: number) => {
          fixPrompt += `【问题 ${index + 1}】\n`;
          fixPrompt += `问题描述：${issue.description}\n`;
          if (issue.reason) fixPrompt += `问题原因：${issue.reason}\n`;
          if (issue.suggestion) fixPrompt += `修改建议：${issue.suggestion}\n`;
          fixPrompt += '\n';
        });
      } else {
        // 后续修复：使用上次校核发现的问题
        const prevIssues = iterationHistory[iteration - 2].issues;
        fixPrompt += `经过第 ${iteration - 1} 次校核，发现以下问题需要继续修复：\n\n`;
        prevIssues.forEach((issue: any, index: number) => {
          fixPrompt += `【问题 ${index + 1}】\n`;
          fixPrompt += `问题描述：${issue.description}\n`;
          if (issue.reason) fixPrompt += `问题原因：${issue.reason}\n`;
          if (issue.suggestion) fixPrompt += `修改建议：${issue.suggestion}\n`;
          fixPrompt += '\n';
        });
      }

      fixPrompt += `【当前章节内容】\n${currentContent}\n\n`;
      fixPrompt += `【修复要求】\n`;
      fixPrompt += `1. 严格按照修改建议进行修复\n`;
      fixPrompt += `2. 保持原有的故事风格和叙事节奏\n`;
      fixPrompt += `3. 确保修复后的内容逻辑连贯\n`;
      fixPrompt += `4. 禁止添加新的问题\n`;
      fixPrompt += `5. 输出修复后的完整章节内容\n`;
      fixPrompt += `6. 必须遵循核心原则\n`;
      fixPrompt += `7. 避免所有AI写作弊端\n`;
      fixPrompt += `请直接输出修复后的完整章节内容。`;

      const fixResponse = await client.invoke([
        { role: 'system' as const, content: fixSystemPrompt },
        { role: 'user' as const, content: fixPrompt },
      ], { temperature: 0.7 });

      currentContent = fixResponse.content;

      // 步骤2：执行校核
      const verifyPrompt = `请仔细校核以下修复后的内容是否还有问题：

【章节内容】
${currentContent}

请按照要求的格式输出校核结果。`;

      const verifyResponse = await client.invoke([
        { role: 'system' as const, content: verifySystemPrompt },
        { role: 'user' as const, content: verifyPrompt },
      ], { temperature: 0.3 });

      // 解析校核结果
      const verifyResult = verifyResponse.content.trim();

      if (verifyResult === '无问题' || verifyResult.includes('无问题')) {
        // 没有发现问题，校核通过
        allIssues = [];
        iterationHistory.push({
          iteration,
          issues: [],
          status: 'passed',
          content: currentContent,
        });
        break;
      } else {
        // 发现问题，提取问题列表
        try {
          const jsonMatch = verifyResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.hasIssues && Array.isArray(parsed.issues)) {
              allIssues = parsed.issues;
              iterationHistory.push({
                iteration,
                issues: parsed.issues,
                status: 'found_issues',
                content: currentContent,
              });
              // 继续下一轮修复
              continue;
            }
          }
        } catch (e) {
          // 解析失败，假设没有问题
          console.warn('解析校核结果失败:', e);
          allIssues = [];
          iterationHistory.push({
            iteration,
            issues: [],
            status: 'parse_error',
            content: currentContent,
          });
          break;
        }

        // 如果解析失败或没有找到问题，退出循环
        allIssues = [];
        iterationHistory.push({
          iteration,
          issues: [],
          status: 'no_issues_found',
          content: currentContent,
        });
        break;
      }
    }

    // 构建最终报告
    const finalStatus = allIssues.length === 0 ? 'success' : 'max_iterations_reached';
    const report = {
      success: finalStatus === 'success',
      iterationCount: iteration,
      maxIterations: maxIterations,
      finalContent: currentContent,
      remainingIssues: allIssues,
      iterationHistory: iterationHistory,
      summary: finalStatus === 'success'
        ? `经过 ${iteration} 次修复和校核，所有问题已解决，内容质量达标。`
        : `已完成 ${iteration} 次修复和校核，仍有 ${allIssues.length} 个问题需要手动处理。`,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Fix and verify error:', error);
    return NextResponse.json(
      { error: '修复和校核失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
