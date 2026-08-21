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
  Server,
  Zap,
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
      setError(err.message || 'Failed to connect to BullMQ queue');
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
    return <LoadingSpinner message="Connecting to BullMQ Redis Queue..." size="lg" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Polling Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <span className="w-8 h-px bg-indigo-500/50" />
            Infrastructure Telemetry
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
              Live Queue Telemetry
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Redis Online
            </span>
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Real-time BullMQ job distribution, worker thread concurrency, and rate-limit delay queues.
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
            <span>{autoRefresh ? 'Live Polling (3s)' : 'Polling Paused'}</span>
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

      {/* Main Queue Status Cards from V0 Metrics/Infrastructure Pattern */}
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
                <div className="text-[10px] font-mono text-muted-foreground">Future schedules</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                  <span>Active</span>
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.active}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Dispatching now</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <span>Waiting</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.waiting}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Ready for pickup</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                  <span>Completed</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.completed}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Sent & recorded</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-rose-400">
                  <span>Failed</span>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.counts.failed}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Exhausted retries</div>
              </div>

              <div className="p-6 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                  <span>Concurrency</span>
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {queueStatus.workerConcurrency}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Parallel threads</div>
              </div>
            </div>
          </div>

          {/* Infrastructure Specs & Policy Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <Server className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Queue Architecture</h3>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">BullMQ Queue Name:</span>
                  <code className="text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                    {queueStatus.queueName}
                  </code>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Worker Process:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Dedicated (Separate Process)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Job Idempotency:</span>
                  <span className="text-slate-200">jobId = Email.id</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Retry Policy:</span>
                  <span className="text-slate-200">4 attempts • Exponential backoff (5s)</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Rate-Limit & Window Policy</h3>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Rate Limit Scope:</span>
                  <span className="text-indigo-300 font-semibold">Per-Sender (Shared across campaigns)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Window Duration:</span>
                  <span className="text-slate-200 font-semibold">{queueStatus.rateLimitWindowDescription}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Throttling Mechanism:</span>
                  <span className="text-slate-200">Atomic Redis Lua script + Rescheduling</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Last Telemetry Sync:</span>
                  <span className="text-slate-400">{lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
