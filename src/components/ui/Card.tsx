import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-900/5',
        hoverable && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-xl font-bold leading-none tracking-tight text-gray-900', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />;
}
