import { NextRequest, NextResponse } from 'next/server';

/**
 * 验证卡密 API
 * GET /api/shop/verify?code=XXX
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: '缺少卡密' },
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
      console.log('[Shop] 未找到卡密列表');
    }

    // 查找卡密
    const key = keys.find((k: any) => k.code === code);

    if (!key) {
      return NextResponse.json({
        success: false,
        error: '卡密不存在'
      });
    }

    if (key.status === 'sold' || key.status === 'reserved') {
      return NextResponse.json({
        success: false,
        error: '卡密已被使用'
      });
    }

    // 返回卡密信息（用于激活）
    return NextResponse.json({
      success: true,
      key: {
        code: key.code,
        type: key.type,
        duration: key.duration,
        featureLevel: key.featureLevel
      }
    });

  } catch (error) {
    console.error('[API] 验证卡密失败:', error);
    return NextResponse.json(
      { error: '验证失败，请重试' },
      { status: 500 }
    );
  }
}
