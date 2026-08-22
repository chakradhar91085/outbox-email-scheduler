import React, { useEffect, useState, useRef } from 'react';
import { Campaign, QueueStatus } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { NavTab } from '../layout/Sidebar';
import {
  FolderKanban,
  Mail,
  Send,
  AlertTriangle,
  Activity,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onViewCampaign: (campaignId: string) => void;
  token?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onViewCampaign,
  token,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const [campaignsData, queueData] = await Promise.all([
        api.getCampaigns(token),
        api.getQueueStatus(token),
      ]);
      if (mountedRef.current) {
        setCampaigns(campaignsData);
        setQueueStatus(queueData);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        if (isInitial) {
          setError(err.message || 'Failed to load dashboard data');
        } else {
          console.warn('[DashboardView] Background polling error:', err.message);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  };

  // Immediate fetch + 2-second live background polling lifecycle
  useEffect(() => {
    mountedRef.current = true;
    fetchData(true);

    timerRef.current = setInterval(() => {
      fetchData(false);
    }, 2000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [token]);

  // Aggregate metrics
  const totalCampaigns = campaigns.length;
  const totalEmails = campaigns.reduce((acc, c) => acc + (c.totalEmails || 0), 0);
  const sentEmails = campaigns.reduce((acc, c) => acc + (c.sentEmails || 0), 0);
  const pendingEmails = campaigns.reduce((acc, c) => acc + (c.pendingEmails || 0), 0);
  const processingEmails = campaigns.reduce((acc, c) => acc + (c.processingEmails || 0), 0);
  const failedEmails = campaigns.reduce((acc, c) => acc + (c.failedEmails || 0), 0);
  const deliveryRate = totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0;

  if (loading) {
    return <LoadingSpinner message="Querying live telemetry & metrics..." size="lg" />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => fetchData(true)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Hero / Section Header from V0 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <span className="w-8 h-px bg-indigo-500/50" />
            Outreach Orchestration Engine
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans">
            High-throughput email <br className="hidden sm:block" />
            scheduling & delivery.
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="p-2.5 bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-white rounded-xl border border-border transition-colors disabled:opacity-50"
            title="Manual sync"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('create-campaign')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Split-Border KPI Metric Grid from V0 */}
      <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {/* Metric 1 */}
          <div className="p-6 lg:p-8 space-y-3 hover:bg-white/[0.015] transition-colors">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span>Total Campaigns</span>
              <FolderKanban className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
              {totalCampaigns}
            </div>
            <div className="text-xs font-mono text-muted-foreground pt-1">
              Active scheduling pipelines
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-6 lg:p-8 space-y-3 hover:bg-white/[0.015] transition-colors">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span>Total Enqueued</span>
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
              {totalEmails.toLocaleString()}
            </div>
            <div className="text-xs font-mono text-muted-foreground pt-1 flex items-center gap-1.5">
              <span className="text-amber-400">{pendingEmails} pending</span>
              <span>•</span>
              <span className="text-indigo-400">{processingEmails} processing</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-6 lg:p-8 space-y-3 hover:bg-white/[0.015] transition-colors">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span>Delivered (Sent)</span>
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight flex items-baseline gap-2">
              <span>{sentEmails.toLocaleString()}</span>
              <span className="text-sm font-mono text-emerald-400 font-normal">
                ({deliveryRate}%)
              </span>
            </div>
            <div className="text-xs font-mono text-emerald-400/80 pt-1">
              Confirmed via SMTP transport
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-6 lg:p-8 space-y-3 hover:bg-white/[0.015] transition-colors">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span>Failures / Throttles</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
              {failedEmails}
            </div>
            <div className="text-xs font-mono text-muted-foreground pt-1">
              Exhausted retry threshold
            </div>
          </div>
        </div>
      </div>

      {/* BullMQ Infrastructure Telemetry Strip */}
      {queueStatus && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                BullMQ Distributed Queue Telemetry
              </h3>
              <span className="text-[10px] font-mono bg-white/5 text-muted-foreground px-2 py-0.5 rounded border border-border">
                {queueStatus.queueName}
              </span>
            </div>

            <button
              onClick={() => onNavigate('queue')}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Inspect Queue Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-background border border-border rounded-xl">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Delayed</span>
              <span className="text-2xl font-bold text-white mt-1 block">{queueStatus.counts.delayed}</span>
            </div>
            <div className="p-3.5 bg-background border border-border rounded-xl">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Active</span>
              <span className="text-2xl font-bold text-white mt-1 block">{queueStatus.counts.active}</span>
            </div>
            <div className="p-3.5 bg-background border border-border rounded-xl">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Waiting</span>
              <span className="text-2xl font-bold text-white mt-1 block">{queueStatus.counts.waiting}</span>
            </div>
            <div className="p-3.5 bg-background border border-border rounded-xl">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Completed</span>
              <span className="text-2xl font-bold text-white mt-1 block">{queueStatus.counts.completed}</span>
            </div>
            <div className="p-3.5 bg-background border border-border rounded-xl">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Failed</span>
              <span className="text-2xl font-bold text-white mt-1 block">{queueStatus.counts.failed}</span>
            </div>
            <div className="p-3.5 bg-background border border-border rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Workers
              </span>
              <span className="text-2xl font-bold text-white mt-1 block">{queueStatus.workerConcurrency}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Campaigns Table Section */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Email Campaigns</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Live progress and staggered recipient dispatches
            </p>
          </div>

          <button
            onClick={() => onNavigate('campaigns')}
            className="text-xs font-mono uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-3">
            <Layers className="w-10 h-10 mx-auto text-slate-700 mb-2" />
            <h4 className="text-sm font-semibold text-white">No campaigns active</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Upload a CSV of leads to initiate your first scheduled outreach campaign.
            </p>
            <button
              onClick={() => onNavigate('create-campaign')}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/50 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Sender</th>
                  <th className="py-3.5 px-6">Start Time</th>
                  <th className="py-3.5 px-6">Delay / Quota</th>
                  <th className="py-3.5 px-6">Recipients</th>
                  <th className="py-3.5 px-6">Delivery Progress</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300 font-sans">
                {campaigns.slice(0, 5).map((c) => {
                  const percent = c.totalEmails > 0 ? Math.round((c.sentEmails / c.totalEmails) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6 font-semibold text-white max-w-[220px] truncate">
                        {c.subject}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] max-w-[180px] truncate">
                        {c.sender}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(c.startTime).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {c.delaySeconds}s delay • {c.hourlyLimit}/hr
                      </td>
                      <td className="py-4 px-6 font-bold text-white font-mono">
                        {c.totalEmails}
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1.5 max-w-[160px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="text-emerald-400">{c.sentEmails} sent</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => onViewCampaign(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-border hover:border-indigo-500/30 text-xs font-mono uppercase tracking-wider transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
