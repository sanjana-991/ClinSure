import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Decision } from '../../types';

interface DecisionBadgeProps {
  decision: Decision;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
  className?: string;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  size = 'md',
  showSubtext = false,
  className = '',
}) => {
  const configs = {
    ACCEPT: {
      label: 'ACCEPT',
      subtext: 'Reliable Prediction',
      icon: CheckCircle2,
      containerClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/20',
      iconClasses: 'text-emerald-600',
      tag: 'Safe for autonomous report draft',
    },
    UNCERTAIN: {
      label: 'UNCERTAIN',
      subtext: 'Clinical Review Needed',
      icon: AlertTriangle,
      containerClasses: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
      iconClasses: 'text-amber-600',
      tag: 'Secondary radiologist review required',
    },
    ABSTAIN: {
      label: 'ABSTAIN',
      subtext: 'Prediction Withheld',
      icon: ShieldAlert,
      containerClasses: 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-500/20',
      iconClasses: 'text-rose-600',
      tag: 'Distribution shift / OOD detected',
    },
  };

  const config = configs[decision] || configs.ACCEPT;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`inline-flex items-center rounded-lg border font-medium shadow-soft-sm ring-1 ${config.containerClasses} ${sizeClasses[size]} ${className}`}>
      <Icon className={`${iconSizes[size]} ${config.iconClasses} shrink-0`} aria-hidden="true" />
      <div className="flex flex-col">
        <span className="tracking-wide uppercase font-bold">{config.label}</span>
        {showSubtext && (
          <span className="text-xs font-normal opacity-90">{config.subtext}</span>
        )}
      </div>
    </div>
  );
};
