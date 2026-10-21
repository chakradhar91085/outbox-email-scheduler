import React, { useEffect, useState } from 'react';
import { QueueStatus } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import {
  Activity,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface QueueMonitorViewProps {
  token?: string | null;
}

export const QueueMonitorView: React.FC<QueueMonitorViewProps> = ({ token }) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const data = await api.getQueueStatus(token);
      setQueueStatus(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not load queue status');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [token]);

  // Polling interval (3000ms) with proper cleanup
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchStatus(false);
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, token]);

  if (loading && !queueStatus) {
    return <LoadingSpinner message="Loading queue status..." size="lg" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Polling Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <span className="w-8 h-px bg-indigo-500/50" />
            Monitoring
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
              Queue Monitor
            </h2>
            {!error && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Live count of emails in each stage of the queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all',
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-white'
            )}
          >
            {autoRefresh ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{autoRefresh ? 'Live (3s)' : 'Paused'}</span>
          </button>

          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="p-2.5 bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-white rounded-xl border border-border transition-colors disabled:opacity-50"
            title="Manual refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => fetchStatus(true)} />}

      {/* Queue counts */}
      {queueStatus && (
        <>
          <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  <span>Delayed</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.delayed}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Scheduled for later</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                  <span>Active</span>
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.active}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Sending now</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <span>Waiting</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.waiting}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Due, about to send</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                  <span>Completed</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.completed}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Sent successfully</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-rose-400">
                  <span>Failed</span>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.failed}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Failed after retries</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                  <span>Concurrency</span>
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.workerConcurrency}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Emails sent in parallel</div>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-muted-foreground">
            Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        </>
      )}
    </div>
  );
};
