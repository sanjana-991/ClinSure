import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  children?: ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  trend,
  className = '',
  children,
}) => {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft-sm hover:shadow-soft-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-mono">
          {value}
        </span>

        {badgeText && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgeStyles[badgeVariant]}`}>
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={trend.isPositive ? 'text-emerald-600 font-medium' : 'text-slate-500 font-medium'}>
              {trend.value}
            </span>
          )}
        </div>
      )}

      {children && <div className="mt-4 pt-3 border-t border-slate-100">{children}</div>}
    </div>
  );
};
