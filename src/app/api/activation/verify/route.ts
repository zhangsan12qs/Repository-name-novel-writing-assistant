import { NextRequest, NextResponse } from 'next/server';

/**
 * 验证并激活卡密 API
 *
 * POST /api/activation/verify
 * Body: { code, userId }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    // 验证参数
    if (!code || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 导入激活存储
    const { activationStore } = await import('@/lib/activation-store');

    // 验证并激活卡密
    const result = await activationStore.verifyKey(code, userId);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || '卡密验证失败' },
        { status: 400 }
      );
    }

    // 更新用户激活信息
    await activationStore.updateUserActivation(userId, result.key!);

    return NextResponse.json({
      success: true,
      key: result.key,
      message: '激活成功！',
    });

  } catch (error) {
    console.error('[API] 激活卡密失败:', error);
    return NextResponse.json(
      { error: '激活失败，请重试' },
      { status: 500 }
    );
  }
}
