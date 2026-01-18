# 支付收款码配置说明

请将你的收款码图片放在 `/public` 目录下：

## 步骤

1. 准备你的收款码图片（微信支付和/或支付宝）
2. 将图片命名为：
   - 微信支付：`payment-wechat.jpg` 或 `payment-wechat.png`
   - 支付宝：`payment-alipay.jpg` 或 `payment-alipay.png`
3. 将图片文件放入 `/public` 目录

## 配置示例

如果你的收款码图片路径不同，请修改 `src/lib/payment-config.ts` 文件：

```typescript
export const paymentConfig = {
  wechatQRCode: '/你的微信收款码路径.jpg',
  alipayQRCode: '/你的支付宝收款码路径.jpg',
  // ...
};
```

## 注意事项

- 支持的图片格式：jpg、png、gif
- 建议图片尺寸：300x300 像素
- 确保收款码清晰可扫描
- 更新图片后记得重启开发服务器
