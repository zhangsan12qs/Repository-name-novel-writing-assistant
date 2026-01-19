import React from 'react';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OptimizedCardProps extends Omit<React.ComponentProps<typeof ShadcnCard>, 'variant'> {
  variant?: 'default' | 'gradient' | 'glass' | 'neon' | 'hover-lift';
  glow?: boolean;
  children: React.ReactNode;
}

export const OptimizedCard = React.forwardRef<
  HTMLDivElement,
  OptimizedCardProps
>(({ className, variant = 'default', glow, children, ...props }, ref) => {
  const variantClasses = {
    default: '',
    gradient: 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20',
    glass: 'glass-strong',
    neon: 'bg-gray-900 dark:bg-gray-100',
    'hover-lift': 'hover-lift',
  };

  return (
    <ShadcnCard
      ref={ref}
      className={cn(
        'border-2 transition-all duration-300',
        variantClasses[variant],
        glow && 'shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20',
        className
      )}
      {...props}
    >
      {children}
    </ShadcnCard>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

export const OptimizedCardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CardContent>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn('p-6', className)} {...props} />
));

OptimizedCardContent.displayName = 'OptimizedCardContent';

export const OptimizedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CardHeader>
>(({ className, ...props }, ref) => (
  <CardHeader ref={ref} className={cn('p-6 pb-4', className)} {...props} />
));

OptimizedCardHeader.displayName = 'OptimizedCardHeader';

export const OptimizedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof CardTitle>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn('text-2xl font-bold text-gradient-purple', className)}
    {...props}
  />
));

OptimizedCardTitle.displayName = 'OptimizedCardTitle';

export const OptimizedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof CardDescription>
>(({ className, ...props }, ref) => (
  <CardDescription ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props} />
));

OptimizedCardDescription.displayName = 'OptimizedCardDescription';

export const OptimizedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CardFooter>
>(({ className, ...props }, ref) => (
  <CardFooter ref={ref} className={cn('p-6 pt-4', className)} {...props} />
));

OptimizedCardFooter.displayName = 'OptimizedCardFooter';
