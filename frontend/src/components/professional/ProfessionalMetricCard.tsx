import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionalMetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

export default function ProfessionalMetricCard({
  title,
  value,
  change,
  icon: Icon,
  className,
  children
}: ProfessionalMetricCardProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-6",
      "professional-card-hover",
      className
    )}>
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {Icon && (
            <div className="w-5 h-5 text-muted-foreground">
              <Icon size={20} />
            </div>
          )}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
      </div>

      {/* Main Value */}
      <div className="space-y-2">
        <div className="text-2xl font-semibold text-card-foreground">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Change Indicator */}
        {change && (
          <div className="flex items-center space-x-2">
            <span className={cn(
              "text-sm font-medium",
              change.trend === 'up' && "text-green-600",
              change.trend === 'down' && "text-red-600",
              change.trend === 'neutral' && "text-muted-foreground"
            )}>
              {change.trend === 'up' && '+'}
              {change.value}
              {change.trend === 'up' && ' ↗'}
              {change.trend === 'down' && ' ↘'}
            </span>
            {change.label && (
              <span className="text-sm text-muted-foreground">
                {change.label}
              </span>
            )}
          </div>
        )}

        {/* Additional Content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}