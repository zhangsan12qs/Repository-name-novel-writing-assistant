import React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OptimizedInputProps extends Omit<React.ComponentProps<typeof ShadcnInput>, 'variant'> {
  variant?: 'default' | 'primary' | 'gradient' | 'glass';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const OptimizedInput = React.forwardRef<
  HTMLInputElement,
  OptimizedInputProps
>(({ className, variant = 'default', leftIcon, rightIcon, error, ...props }, ref) => {
  const variantClasses = {
    default: 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20',
    primary: 'border-purple-300 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30',
    gradient: 'border-transparent bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 focus:border-purple-400 dark:focus:border-purple-500',
    glass: 'border-white/20 dark:border-gray-700/30 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
  };

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <ShadcnInput
        ref={ref}
        className={cn(
          'h-11 px-4 rounded-lg transition-all duration-200',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          variantClasses[variant],
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';
