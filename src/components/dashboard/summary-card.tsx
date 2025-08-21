import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string; // Tailwind background color class e.g., 'bg-blue-100'
  iconColor?: string; // Tailwind text color class e.g., 'text-blue-600'
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-accent', // Default to accent color from theme
  iconColor = 'text-accent-foreground', // Default foreground for accent
}: SummaryCardProps) {
  return (
    <Card className="bg-accent shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium text-accent-foreground">{title}</p>
          <p className="text-2xl font-bold text-accent-foreground">{value}</p>
        </div>
        <div className={cn("rounded-full p-3", iconBgColor)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </CardContent>
    </Card>
  );
}
