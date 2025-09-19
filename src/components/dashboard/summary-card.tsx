
'use client';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: SummaryCardProps) {
  const cardClasses = {
    default: 'bg-accent',
    destructive: 'bg-destructive/10 border-destructive/30',
  };

  const textClasses = {
    default: 'text-accent-foreground',
    destructive: 'text-destructive',
  };

  const iconContainerClasses = {
    default: 'bg-accent',
    destructive: 'bg-destructive/20',
  };
  
  const iconClasses = {
      default: 'text-accent-foreground',
      destructive: 'text-destructive',
  };


  return (
    <Card className={cn("shadow-sm hover:shadow-md transition-shadow", cardClasses[variant])}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className={cn("text-sm font-medium", textClasses[variant])}>{title}</p>
          <p className={cn("text-2xl font-bold", textClasses[variant])}>{value}</p>
        </div>
        <div className={cn("rounded-full p-3", iconContainerClasses[variant])}>
          <Icon className={cn("h-6 w-6", iconClasses[variant])} />
        </div>
      </CardContent>
    </Card>
  );
}
