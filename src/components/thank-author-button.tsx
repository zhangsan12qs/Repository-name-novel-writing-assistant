'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Copy, Check } from 'lucide-react';
import Image from 'next/image';

export default function ThankAuthorButton() {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="w-full mb-2 border-pink-600 text-pink-600 hover:bg-pink-50"
        >
          <Heart className="h-4 w-4 mr-2" />
          感谢作者
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-600" />
            感谢支持
          </DialogTitle>
          <DialogDescription>
            如果这个工具对你有帮助，欢迎请我喝杯咖啡 ☕️
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 收款码图片 */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative w-64 h-64 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-4 shadow-lg">
              <Image
                src="/thank-author.jpg"
                alt="感谢作者收款码"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              扫描二维码或复制收款码
            </p>
          </div>

          {/* 收款信息 */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">微信支付</div>
              <div className="flex items-center justify-between bg-white rounded p-2">
                <span className="text-sm font-mono">your-wechat-id</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleCopy('your-wechat-id')}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">支付宝</div>
              <div className="flex items-center justify-between bg-white rounded p-2">
                <span className="text-sm font-mono">your-alipay-id</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleCopy('your-alipay-id')}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
            </div>
          </div>

          {/* 感谢语 */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              感谢你的支持！你的支持是我继续开发的动力 🙏
            </p>
            <p className="text-xs text-muted-foreground">
              本工具完全免费，打赏完全自愿
            </p>
          </div>

          {/* 关闭按钮 */}
          <Button
            onClick={() => setOpen(false)}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            知道了
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
