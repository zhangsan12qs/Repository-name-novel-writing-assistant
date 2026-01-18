import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取已购买的卡密列表 API
 * GET /api/shop/keys
 */

export async function GET(request: NextRequest) {
  try {
    // 导入对象存储
    const { s3Storage } = await import('@/lib/s3-storage');

    // 读取卡密列表
    let keys: any[] = [];
    try {
      const data = await s3Storage.getObject('card-keys-list.json');
      if (data) {
        keys = JSON.parse(data);
        // 按创建时间倒序
        keys.sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (error) {
      console.log('[Shop] 未找到卡密列表');
    }

    return NextResponse.json({
      success: true,
      keys
    });

  } catch (error) {
    console.error('[API] 获取卡密列表失败:', error);
    return NextResponse.json(
      { error: '获取卡密列表失败' },
      { status: 500 }
    );
  }
}
