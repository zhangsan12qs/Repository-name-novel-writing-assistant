import { NextRequest, NextResponse } from 'next/server';

/**
 * 购买卡密 API
 * POST /api/shop/purchase
 *
 * 支持两种模式：
 * 1. 批量购买模式（商店）：Body: { keys: Array<{code, type, duration, featureLevel, price, status}>, totalPrice }
 * 2. 单一生成模式（开发者调试）：Body: { type: string, userId: string }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 模式1：批量购买（商店）
    if (body.keys && Array.isArray(body.keys) && body.keys.length > 0) {
      const { keys, totalPrice } = body;

      // 导入对象存储
      const { s3Storage } = await import('@/lib/s3-storage');

      // 读取现有的卡密列表
      let existingKeys: any[] = [];
      try {
        const existingData = await s3Storage.getObject('card-keys-list.json');
        if (existingData) {
          existingKeys = JSON.parse(existingData);
        }
      } catch (error) {
        console.log('[Shop] 未找到现有卡密列表，将创建新的');
      }

      // 添加新卡密
      existingKeys.push(...keys);

      // 保存到对象存储
      await s3Storage.putObject('card-keys-list.json', JSON.stringify(existingKeys, null, 2), 'application/json');

      console.log(`[Shop] 成功购买 ${keys.length} 个卡密`);

      return NextResponse.json({
        success: true,
        keys,
        totalPrice
      });
    }

    // 模式2：单一生成（开发者调试）
    if (body.type && body.userId) {
      const { type, userId } = body;

      // 导入对象存储
      const { s3Storage } = await import('@/lib/s3-storage');

      // 根据类型配置
      const typeConfigs: Record<string, { duration: number; featureLevel: string; price: number }> = {
        trial: { duration: 7, featureLevel: 'basic', price: 0 },
        monthly: { duration: 30, featureLevel: 'standard', price: 99 },
        yearly: { duration: 365, featureLevel: 'premium', price: 999 },
        lifetime: { duration: 99999, featureLevel: 'premium', price: 1999 },
      };

      const config = typeConfigs[type];
      if (!config) {
        return NextResponse.json(
          { error: '无效的卡密类型' },
          { status: 400 }
        );
      }

      // 生成卡密
      const code = `${type.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const cardKey = {
        code,
        type,
        duration: config.duration,
        featureLevel: config.featureLevel,
        price: 0, // 开发者调试模式价格为0
        status: 'unused',
        createdAt: new Date().toISOString(),
        createdBy: userId,
      };

      // 读取现有的卡密列表
      let existingKeys: any[] = [];
      try {
        const existingData = await s3Storage.getObject('card-keys-list.json');
        if (existingData) {
          existingKeys = JSON.parse(existingData);
        }
      } catch (error) {
        console.log('[Shop] 未找到现有卡密列表，将创建新的');
      }

      // 添加新卡密
      existingKeys.push(cardKey);

      // 保存到对象存储
      await s3Storage.putObject('card-keys-list.json', JSON.stringify(existingKeys, null, 2), 'application/json');

      console.log(`[Shop] 开发者调试：生成卡密 ${code}`);

      return NextResponse.json({
        success: true,
        cardKey: code, // 返回卡密字符串
        cardInfo: cardKey, // 返回完整卡密信息
      });
    }

    return NextResponse.json(
      { error: '无效的请求格式' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[API] 购买卡密失败:', error);
    return NextResponse.json(
      { error: '购买失败，请重试' },
      { status: 500 }
    );
  }
}
