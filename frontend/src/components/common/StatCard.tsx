import React from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  className,
}) => {
  return (
    <div
      className={cn(
        'group bg-surface border border-border rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-surface-elevated hover-lift shadow-sm',
        className
      )}
    >
      {/* Top Accent Line */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span className="w-4 h-px bg-white/30" />
          {title}
        </span>
        <div className="p-2 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.06] group-hover:text-indigo-400 transition-colors">
          {icon}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="space-y-1">
        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Subtitle & Trend */}
        <div className="flex items-center justify-between pt-1 text-xs">
          {subtitle && <span className="text-muted-foreground font-mono text-[11px]">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-mono text-[11px] font-medium px-1.5 py-0.5 rounded border',
                trendPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
