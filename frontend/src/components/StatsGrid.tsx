import * as React from 'react';
import { cn } from '@/lib/utils';

type StatColor = 'primary' | 'blue' | 'red' | 'amber';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: StatColor;
  className?: string;
}

const colorClasses: Record<StatColor, { border: string; icon: string }> = {
  primary: { border: 'border-l-primary', icon: 'bg-primary/10 text-primary' },
  blue: { border: 'border-l-blue-500', icon: 'bg-blue-500/10 text-blue-600' },
  red: { border: 'border-l-red-500', icon: 'bg-red-500/10 text-red-600' },
  amber: { border: 'border-l-amber-500', icon: 'bg-amber-500/10 text-amber-600' },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'primary',
  className,
}: StatCardProps) {
  const c = colorClasses[color];
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 text-card-foreground shadow',
        'flex items-center gap-4 border-l-4',
        c.border,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
            c.icon
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}
