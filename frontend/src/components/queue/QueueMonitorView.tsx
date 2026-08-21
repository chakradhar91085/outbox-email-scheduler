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
    <div className="space-y-6">
      {/* Header & Polling Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Live Queue Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time BullMQ job distribution, worker thread concurrency, and rate-limit delay queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoRefresh ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{autoRefresh ? 'Live Polling (3s)' : 'Polling Paused'}</span>
          </button>

          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors disabled:opacity-50"
            title="Manual refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => fetchStatus(true)} />}

      {/* Main Queue Status Cards */}
      {queueStatus && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 shadow-sm hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                <span>DELAYED</span>
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">
                {queueStatus.counts.delayed}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Scheduled for future</span>
            </div>

            <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-4 shadow-sm hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
                <span>ACTIVE</span>
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">
                {queueStatus.counts.active}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Currently dispatching</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>WAITING</span>
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">
                {queueStatus.counts.waiting}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Ready in queue</span>
            </div>

            <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                <span>COMPLETED</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">
                {queueStatus.counts.completed}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Sent & acknowledged</span>
            </div>

            <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-4 shadow-sm hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
                <span>FAILED</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">
                {queueStatus.counts.failed}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Exhausted retries</span>
            </div>

            <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 shadow-sm hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold">
                <span>CONCURRENCY</span>
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">
                {queueStatus.workerConcurrency}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Parallel worker threads</span>
            </div>
          </div>

          {/* Infrastructure Specs & Policy Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Queue Architecture</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">BullMQ Queue Name:</span>
                  <code className="text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40 font-mono">
                    {queueStatus.queueName}
                  </code>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Worker Process:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Dedicated (Separate Process)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Job Idempotency:</span>
                  <span className="text-slate-200 font-mono text-[11px]">jobId = Email.id</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Retry Policy:</span>
                  <span className="text-slate-200">3 attempts • Exponential backoff (3s)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Rate-Limit & Window Policy</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Rate Limit Scope:</span>
                  <span className="text-indigo-300 font-semibold">Per-Sender (Shared across campaigns)</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Window Duration:</span>
                  <span className="text-slate-200 font-semibold">{queueStatus.rateLimitWindowDescription}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Throttling Mechanism:</span>
                  <span className="text-slate-200">Atomic Redis Lua script + Delayed Job Rescheduling</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Last Telemetry Sync:</span>
                  <span className="text-slate-400 font-mono text-[11px]">{lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
