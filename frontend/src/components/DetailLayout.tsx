import * as React from 'react';
import { cn } from '@/lib/utils';

interface DetailLayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DetailLayout({
  sidebar,
  children,
  className,
}: DetailLayoutProps) {
  if (!sidebar) {
    return <div className={cn('space-y-6', className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'grid gap-8 lg:grid-cols-[280px_1fr]',
        className
      )}
    >
      <aside className="space-y-6">{sidebar}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
