import { NextRequest, NextResponse } from 'next/server';

/**
 * 标记卡密为已使用 API
 * POST /api/shop/activate
 * Body: { code, userId }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 导入对象存储
    const { s3Storage } = await import('@/lib/s3-storage');

    // 读取卡密列表
    let keys: any[] = [];
    try {
      const data = await s3Storage.getObject('card-keys-list.json');
      if (data) {
        keys = JSON.parse(data);
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: '未找到卡密列表'
      });
    }

    // 查找并更新卡密
    const keyIndex = keys.findIndex((k: any) => k.code === code);

    if (keyIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '卡密不存在'
      });
    }

    if (keys[keyIndex].status === 'sold' || keys[keyIndex].status === 'reserved') {
      return NextResponse.json({
        success: false,
        error: '卡密已被使用'
      });
    }

    // 更新卡密状态
    keys[keyIndex].status = 'sold';
    keys[keyIndex].soldAt = Date.now();
    keys[keyIndex].soldTo = userId;

    // 保存到对象存储
    await s3Storage.putObject('card-keys-list.json', JSON.stringify(keys, null, 2), 'application/json');

    console.log(`[Shop] 卡密 ${code} 已激活，用户: ${userId}`);

    return NextResponse.json({
      success: true,
      message: '卡密激活成功'
    });

  } catch (error) {
    console.error('[API] 激活卡密失败:', error);
    return NextResponse.json(
      { error: '激活失败，请重试' },
      { status: 500 }
    );
  }
}
