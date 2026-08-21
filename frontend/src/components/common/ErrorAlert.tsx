import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'System Warning',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-0.5 sm:mt-0 flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 mb-0.5">
            {title}
          </h4>
          <p className="text-xs text-rose-200/80 leading-relaxed font-sans">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono uppercase tracking-wider transition-colors self-start sm:self-auto flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
