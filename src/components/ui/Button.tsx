import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'hero';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild = false, children, disabled, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95',
      secondary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-md active:scale-95',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95',
      ghost: 'text-gray-600 hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md active:scale-95',
      hero: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-accent/20 active:scale-95 text-lg uppercase tracking-wide',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
      xl: 'px-10 py-4 text-xl',
      icon: 'p-2',
    };

    return (
      <Component
        ref={ref}
        {...(!asChild && { disabled: disabled || isLoading })}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {children}
          </>
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export { Button };
