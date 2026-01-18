/**
 * 支付配置
 *
 * 使用说明：
 * 1. 将你的收款码图片保存到 /public 目录下
 * 2. 修改下面的图片路径和收款说明
 */

export const paymentConfig = {
  // 收款码图片路径（支持相对路径）
  // 注意：请将你的实际收款码图片放到 /public 目录下
  wechatQRCode: '/payment-wechat.png',    // 微信收款码
  alipayQRCode: '/payment-alipay.png',    // 支付宝收款码

  // 收款说明
  instructions: [
    '请使用微信或支付宝扫描上方二维码',
    '支付完成后，点击"我已支付"按钮',
    '系统将自动生成并显示卡密',
    '请妥善保管卡密，可用于激活使用'
  ],

  // 开发者联系方式（用户支付后可联系）
  contact: {
    wechat: '',  // 你的微信号
    phone: '',   // 你的手机号
    email: '',   // 你的邮箱
  },

  // 支付提示
  paymentTips: [
    '支付成功后，卡密将立即生成',
    '如遇问题，请联系客服',
    '支持7天无理由退款'
  ]
};

/**
 * 获取可用的收款方式
 */
export function getAvailablePaymentMethods() {
  const methods = [];

  // 如果配置了微信收款码
  if (paymentConfig.wechatQRCode) {
    methods.push({
      type: 'wechat' as const,
      name: '微信支付',
      icon: '💚',
      qrCode: paymentConfig.wechatQRCode
    });
  }

  // 如果配置了支付宝收款码
  if (paymentConfig.alipayQRCode) {
    methods.push({
      type: 'alipay' as const,
      name: '支付宝',
      icon: '💙',
      qrCode: paymentConfig.alipayQRCode
    });
  }

  return methods;
}
