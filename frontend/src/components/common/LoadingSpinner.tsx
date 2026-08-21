import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading system state...',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-12 space-y-4 text-center', className)}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border border-indigo-500/20 animate-ping absolute inset-0" />
        <div className="p-3 rounded-xl bg-surface border border-border">
          <Loader2 className={cn('text-indigo-400 animate-spin', sizeClasses[size])} />
        </div>
      </div>
      <p className="text-xs font-mono tracking-wider text-muted-foreground uppercase">{message}</p>
    </div>
  );
};
