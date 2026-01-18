'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingCart,
  Shield,
  Clock,
  Crown,
  Sparkles,
  QrCode
} from 'lucide-react';
import { paymentConfig, getAvailablePaymentMethods } from '@/lib/payment-config';

type CardKeyType = 'trial' | 'month' | 'year' | 'lifetime';

interface CardKey {
  code: string;
  type: CardKeyType;
  duration: number;
  featureLevel: 'basic' | 'pro' | 'enterprise';
  price: number;
  status: 'available' | 'sold' | 'reserved';
  createdAt: number;
}

const cardConfigs = [
  {
    type: 'trial' as CardKeyType,
    name: '试用卡',
    duration: 7,
    durationText: '7天',
    price: 9.9,
    description: '体验完整功能',
    features: ['基础写作功能', 'AI辅助生成', '实时问题检查'],
    color: 'from-gray-500 to-gray-600',
    icon: <Clock className="h-6 w-6" />
  },
  {
    type: 'month' as CardKeyType,
    name: '月卡',
    duration: 30,
    durationText: '30天',
    price: 29.9,
    description: '短期使用优选',
    features: ['所有试用功能', '优先AI生成', '批量章节生成', '高级问题检查'],
    color: 'from-blue-500 to-blue-600',
    icon: <Sparkles className="h-6 w-6" />
  },
  {
    type: 'year' as CardKeyType,
    name: '年卡',
    duration: 365,
    durationText: '1年',
    price: 199.9,
    description: '长期写作利器',
    features: ['所有月卡功能', '无限AI生成', '专业起名系统', '专属客服支持'],
    color: 'from-purple-500 to-purple-600',
    icon: <Crown className="h-6 w-6" />
  },
  {
    type: 'lifetime' as CardKeyType,
    name: '永久卡',
    duration: 9999,
    durationText: '永久',
    price: 599.9,
    description: '终身使用授权',
    features: ['所有年卡功能', '终身免费更新', 'VIP专属功能', '优先新功能体验'],
    color: 'from-amber-500 to-amber-600',
    icon: <Shield className="h-6 w-6" />
  }
];

export default function ShopPage() {
  const [selectedType, setSelectedType] = useState<CardKeyType>('month');
  const [quantity, setQuantity] = useState(1);
  const [purchasedKeys, setPurchasedKeys] = useState<CardKey[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    keys: CardKey[];
    totalPrice: number;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const paymentMethods = getAvailablePaymentMethods();

  // 加载已购买的卡密
  useEffect(() => {
    loadPurchasedKeys();
  }, []);

  const loadPurchasedKeys = async () => {
    try {
      const response = await fetch('/api/shop/keys');
      const data = await response.json();
      if (data.success) {
        setPurchasedKeys(data.keys || []);
      }
    } catch (error) {
      console.error('加载卡密失败:', error);
    }
  };

  // 生成卡密
  const generateKeyCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) code += '-';
    }
    return code;
  };

  // 购买卡密
  const handlePurchase = async () => {
    const config = cardConfigs.find(c => c.type === selectedType);
    if (!config) return;

    setPurchasing(true);

    try {
      // 预先生成卡密（暂不保存）
      const newKeys: CardKey[] = [];
      for (let i = 0; i < quantity; i++) {
        newKeys.push({
          code: generateKeyCode(),
          type: selectedType,
          duration: config.duration,
          featureLevel: selectedType === 'lifetime' ? 'enterprise' : selectedType === 'year' ? 'pro' : 'basic',
          price: config.price,
          status: 'available',
          createdAt: Date.now()
        });
      }

      // 保存待购买信息
      setPendingPurchase({
        keys: newKeys,
        totalPrice: config.price * quantity
      });

      // 显示支付二维码弹窗
      setShowQRCodeModal(true);
    } catch (error) {
      console.error('准备购买失败:', error);
      alert('准备购买失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setPurchasing(false);
    }
  };

  // 确认支付并生成卡密
  const handleConfirmPayment = async () => {
    if (!pendingPurchase) return;

    setPurchasing(true);

    try {
      // 保存卡密到对象存储
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: pendingPurchase.keys,
          totalPrice: pendingPurchase.totalPrice
        })
      });

      const data = await response.json();

      if (data.success) {
        // 同时保存到 IndexedDB，以便激活系统能够找到
        try {
          const { activationStore } = await import('@/lib/activation-store');

          // 映射类型名称
          const typeMapping: Record<CardKeyType, 'trial' | 'month' | 'year' | 'lifetime'> = {
            trial: 'trial',
            month: 'month',
            year: 'year',
            lifetime: 'lifetime'
          };

          // 保存到 IndexedDB（使用相同的卡密代码）
          for (const key of pendingPurchase.keys) {
            await activationStore.addKey(
              key.code,
              typeMapping[key.type],
              key.duration,
              key.featureLevel
            );
          }

          console.log('[Shop] 卡密已同步到 IndexedDB');
        } catch (error) {
          console.error('[Shop] 同步卡密到 IndexedDB 失败:', error);
          // 不阻塞购买流程，只记录错误
        }

        alert(`购买成功！\n\n已生成 ${pendingPurchase.keys.length} 个卡密\n\n请查看下方卡密列表，复制卡密后在小说写作应用中激活`);
        setShowQRCodeModal(false);
        setPendingPurchase(null);
        setShowPaymentModal(false);
        loadPurchasedKeys();
      } else {
        throw new Error(data.error || '购买失败');
      }
    } catch (error) {
      console.error('购买失败:', error);
      alert('购买失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setPurchasing(false);
    }
  };

  // 复制卡密
  const copyKey = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('已复制卡密: ' + code);
    });
  };

  const selectedConfig = cardConfigs.find(c => c.type === selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingCart className="h-12 w-12 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              卡密商店
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            购买激活码，解锁小说写作助手的全部功能
          </p>
        </div>

        {/* 卡密套餐 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cardConfigs.map((config) => (
            <Card
              key={config.type}
              className={`p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
                selectedType === config.type
                  ? 'ring-4 ring-purple-500 shadow-2xl'
                  : 'ring-2 ring-transparent hover:ring-purple-300'
              }`}
              onClick={() => setSelectedType(config.type)}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} text-white`}>
                  {config.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{config.name}</h3>
                  <div className="text-sm text-muted-foreground">{config.durationText}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-purple-600">
                  ¥{config.price}
                </div>
                <div className="text-sm text-muted-foreground">{config.description}</div>
              </div>

              <ul className="space-y-2 text-sm mb-6">
                {config.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedType(config.type);
                  setShowPaymentModal(true);
                }}
              >
                立即购买
              </Button>
            </Card>
          ))}
        </div>

        {/* 购买弹窗 */}
        {showPaymentModal && selectedConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">确认购买</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedConfig.color} text-white`}>
                        {selectedConfig.icon}
                      </div>
                      <span className="font-bold text-lg">{selectedConfig.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{selectedConfig.description}</div>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">购买数量</Label>
                    <Select value={quantity.toString()} onValueChange={(v) => setQuantity(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} 个</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">单价</span>
                      <span className="font-medium">¥{selectedConfig.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-muted-foreground">数量</span>
                      <span className="font-medium">× {quantity}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-bold text-lg">总计</span>
                      <span className="font-bold text-2xl text-purple-600">
                        ¥{(selectedConfig.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        准备中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        去支付
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 支付二维码弹窗 */}
        {showQRCodeModal && pendingPurchase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-purple-600" />
                    扫码支付
                  </h3>
                  <button
                    onClick={() => {
                      setShowQRCodeModal(false);
                      setPendingPurchase(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 订单信息 */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">订单金额</span>
                      <span className="font-bold text-2xl text-purple-600">
                        ¥{pendingPurchase.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">卡密数量</span>
                      <span className="font-medium">{pendingPurchase.keys.length} 个</span>
                    </div>
                  </div>

                  {/* 收款方式选择 */}
                  {paymentMethods.length > 1 && (
                    <div>
                      <Label className="text-sm mb-2 block">选择支付方式</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map(method => (
                          <button
                            key={method.type}
                            onClick={() => setSelectedPaymentMethod(method.type)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedPaymentMethod === method.type
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-1">{method.icon}</div>
                            <div className="text-sm font-medium">{method.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 收款码显示 */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg flex flex-col items-center">
                    <div className="text-sm text-muted-foreground mb-3">
                      {selectedPaymentMethod === 'wechat' ? '💚 微信支付' : '💙 支付宝'}
                    </div>

                    {/* 收款码图片 */}
                    {paymentMethods.length > 0 && (
                      <div className="relative">
                        <img
                          src={paymentMethods.find(m => m.type === selectedPaymentMethod)?.qrCode}
                          alt={selectedPaymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                          className="w-64 h-64 object-contain border-2 border-gray-200 rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                          <div className="text-center p-4">
                            <p className="text-sm text-gray-600 mb-2">收款码未配置</p>
                            <p className="text-xs text-gray-500">请联系管理员</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethods.length === 0 && (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="text-center p-4">
                          <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">收款码未配置</p>
                          <p className="text-xs text-gray-500">请配置收款码图片</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 支付说明 */}
                  <div className="text-sm text-muted-foreground space-y-2">
                    {paymentConfig.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        <span>{instruction}</span>
                      </div>
                    ))}
                  </div>

                  {/* 确认支付按钮 */}
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={purchasing}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        我已支付
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 已购买的卡密 */}
        {purchasedKeys.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Key className="h-6 w-6 text-purple-600" />
              我的卡密
            </h2>

            <div className="space-y-3">
              {purchasedKeys.map((key) => {
                const config = cardConfigs.find(c => c.type === key.type);
                return (
                  <Card key={key.code} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${config?.color || 'from-gray-500 to-gray-600'} text-white`}>
                          {config?.icon || <Key className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-lg">{key.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {config?.name} · {config?.durationText}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyKey(key.code)}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <Card className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            使用说明
          </h3>
          <ol className="space-y-2 text-sm">
            <li>1. 选择合适的卡密套餐，点击购买</li>
            <li>2. 完成支付后，系统会自动生成卡密</li>
            <li>3. 复制生成的卡密</li>
            <li>4. 返回小说写作应用（/），点击"激活卡密"按钮</li>
            <li>5. 粘贴卡密，完成激活</li>
            <li>6. 激活成功后即可使用所有功能</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ 重要提示
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              卡密激活后无法重复使用，请妥善保管。如遇问题请联系客服。
            </div>
          </div>
        </Card>

        {/* 返回主页按钮 */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            返回小说写作应用
          </Button>
        </div>
      </div>
    </div>
  );
}
