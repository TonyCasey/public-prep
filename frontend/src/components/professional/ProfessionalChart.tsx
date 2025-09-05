import React from 'react';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ProfessionalBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  className?: string;
  showValues?: boolean;
}

export function ProfessionalBarChart({ 
  data, 
  title, 
  className,
  showValues = false 
}: ProfessionalBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={cn("bg-card border border-border rounded-lg p-6", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-card-foreground mb-6">{title}</h3>
      )}
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-card-foreground">
                  {item.label}
                </span>
                {showValues && (
                  <span className="text-sm text-muted-foreground">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color || 'hsl(var(--primary))'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ProfessionalLineChartProps {
  data: { month: string; value: number }[];
  title?: string;
  className?: string;
}

export function ProfessionalLineChart({ 
  data, 
  title, 
  className 
}: ProfessionalLineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className={cn("bg-card border border-border rounded-lg p-6", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-card-foreground mb-6">{title}</h3>
      )}
      
      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid Lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={0}
              y1={i * 40}
              x2={400}
              y2={i * 40}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
            />
          ))}
          
          {/* Chart Line */}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 180 - ((point.value - minValue) / range) * 160;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data Points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = 180 - ((point.value - minValue) / range) * 160;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2">
          {data.map((point, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              {point.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}