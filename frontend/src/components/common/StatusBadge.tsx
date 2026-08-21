import React from 'react';
import { EmailStatus } from '../../types';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: EmailStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const configs: Record<
    string,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string; dot: string }
  > = {
    SENT: {
      label: 'SENT',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    PENDING: {
      label: 'PENDING',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
    },
    PROCESSING: {
      label: 'PROCESSING',
      icon: <Loader2 className={cn('animate-spin', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />,
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      dot: 'bg-indigo-400 animate-pulse',
    },
    FAILED: {
      label: 'FAILED',
      icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-400',
    },
  };

  const config = configs[status] || {
    label: status,
    icon: null,
    bg: 'bg-white/5',
    text: 'text-slate-400',
    border: 'border-white/10',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded-md border transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      <span>{config.label}</span>
    </span>
  );
};
