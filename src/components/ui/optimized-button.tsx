import React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OptimizedButtonProps extends Omit<React.ComponentProps<typeof ShadcnButton>, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'gradient' | 'glass' | 'neon' | 'default';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const OptimizedButton = React.forwardRef<
  HTMLButtonElement,
  OptimizedButtonProps
>(({ className, variant = 'default', size = 'md', loading, leftIcon, rightIcon, fullWidth, children, disabled, ...props }, ref) => {
  const sizeClasses = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-9 px-4 text-sm',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  const variantClasses = {
    default: '',
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg hover:shadow-purple-500/20',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-900 dark:text-white',
    gradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg hover:shadow-xl',
    glass: 'backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-purple-200/30 dark:border-purple-800/30 hover:bg-white/80 dark:hover:bg-gray-900/80',
    neon: 'relative overflow-hidden bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  };

  return (
    <ShadcnButton
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg',
        'hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </div>
      {variant === 'neon' && !disabled && !loading && (
        <div className="absolute inset-0 -z-10 neon-glow rounded-lg"></div>
      )}
    </ShadcnButton>
  );
});

OptimizedButton.displayName = 'OptimizedButton';
