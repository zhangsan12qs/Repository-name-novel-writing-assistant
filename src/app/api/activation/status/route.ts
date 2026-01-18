import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取用户激活状态 API
 *
 * GET /api/activation/status?userId=xxx
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 导入激活存储
    const { activationStore } = await import('@/lib/activation-store');

    // 检查激活状态
    const activationStatus = await activationStore.checkActivation(userId);

    return NextResponse.json({
      success: true,
      activation: activationStatus,
    });

  } catch (error) {
    console.error('[API] 获取激活状态失败:', error);
    return NextResponse.json(
      { error: '获取激活状态失败，请重试' },
      { status: 500 }
    );
  }
}
