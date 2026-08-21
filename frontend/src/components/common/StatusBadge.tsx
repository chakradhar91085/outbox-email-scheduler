import React from 'react';
import { EmailStatus } from '../../types';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: EmailStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'SENT':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Sent',
        };
      case 'PROCESSING':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />,
          label: 'Processing',
        };
      case 'FAILED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Failed',
        };
      case 'PENDING':
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Pending / Delayed',
        };
    }
  };

  const { bg, icon, label } = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${bg} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
