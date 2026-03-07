import * as React from 'react';
import { cn } from '@/lib/utils';

interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: Array<{ label: string; value?: string | null }>;
  columns?: 1 | 2;
}

export function DescriptionList({
  items,
  columns = 1,
  className,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      className={cn(
        'grid gap-x-4 gap-y-3',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        className
      )}
      {...props}
    >
      {items
        .filter((item) => item.value != null && item.value !== '')
        .map((item) => (
          <div key={item.label} className="flex gap-3">
            <dt className="min-w-[120px] text-sm text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-sm font-medium text-foreground">{item.value}</dd>
          </div>
        ))}
    </dl>
  );
}
