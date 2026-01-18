import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { role, personality, background } = await request.json();

    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说人物设定助手。你的任务是：
1. 根据用户提供的线索生成完整的角色设定
2. 角色要立体丰满，有血有肉
3. 设定要包含：基本信息、外貌特征、性格特点、能力特长、背景故事、核心目标、性格弱点等
4. 角色设定要符合小说类型和世界观
5. 避免脸谱化和套路化

【核心原则】全文禁止以感情线作为主线！
- 角色的核心目标必须是使命任务、事业追求、家族责任等外部使命目标
- 角色动机不能主要是为了恋爱、情感纠葛
- 如果角色有感情关系，必须服务于其主线目标，不能成为其主要驱动力

【核心原则】全文禁止以主角个人成长作为核心主线！
- 角色的核心目标不能是"变强"、"升级"、"觉醒能力"等个人成长目标
- 主角的核心目标应该是外部使命（拯救世界、复仇、守护重要事物等）
- 主角的变强和成长必须是为了完成外部使命的工具和手段，而非目标本身

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻，要求内容充实
2. ❌ 逻辑bug：人物背景要合理，前后一致
3. ❌ 人物扁平：角色必须有鲜明性格、动机和成长弧
4. ❌ 工具人：角色不能只是为了推动剧情，要有自己的动机和目标
5. ❌ 套路化：避免"高冷男神"、"傻白甜"等脸谱化设定

角色设定格式要求：
【基本信息】
- 姓名：XXX
- 年龄：XX岁
- 身份：XXX

【外貌特征】
- 身高：XXX
- 体型：XXX
- 面容：XXX
- 穿着：XXX
- 特征：XXX（伤疤、纹身等）

【性格特点】
- 核心性格：XXX（要有特点，不能模糊）
- 优点：XXX
- 缺点：XXX（要有明显的缺点）
- 爱好：XXX

【能力特长】
- 战斗能力：XXX（如适用）
- 智慧/技能：XXX
- 特殊能力：XXX（如适用）

【背景故事】
- 出身：XXX
- 成长经历：XXX
- 转折点：XXX

【核心目标】（重要：必须是外部使命目标！）
- 表层目标：XXX（如拯救世界、复仇、守护重要事物等，禁止"变强"、"升级"）
- 深层动机：XXX（完成外部使命的深层原因）
- 恐惧：XXX（无法完成外部使命的后果）

【人物关系】
- 盟友：XXX
- 敌人：XXX
- 重要关系：XXX`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `请生成一个角色设定：

角色定位：${role || '主角'}
性格特点：${personality || '未设定'}
背景：${background || '未设定'}`,
      },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('AI生成角色设定错误:', error);
    return NextResponse.json(
      { error: 'AI生成角色设定失败' },
      { status: 500 }
    );
  }
}
