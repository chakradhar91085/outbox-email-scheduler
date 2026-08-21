import React, { useEffect, useState } from 'react';
import { Campaign, QueueStatus } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';
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

  const fetchData = async (isInitial = false) => {
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
      setCampaigns(campaignsData);
      setQueueStatus(queueData);
    } catch (err: any) {
      if (isInitial) {
        setError(err.message || 'Failed to load dashboard data');
      } else {
        console.warn('[DashboardView] Background polling error:', err.message);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchData(true);
  }, [token]);

  // Periodic Background Polling (every 4 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [token]);

  // Aggregate metrics
  const totalCampaigns = campaigns.length;
  const totalEmails = campaigns.reduce((acc, c) => acc + (c.totalEmails || 0), 0);
  const sentEmails = campaigns.reduce((acc, c) => acc + (c.sentEmails || 0), 0);
  const pendingEmails = campaigns.reduce((acc, c) => acc + (c.pendingEmails || 0), 0);
  const processingEmails = campaigns.reduce((acc, c) => acc + (c.processingEmails || 0), 0);
  const failedEmails = campaigns.reduce((acc, c) => acc + (c.failedEmails || 0), 0);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard overview..." size="lg" />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => fetchData(true)} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5" /> High-Performance Email Scheduler
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Email Outreach & Worker Dispatch Dashboard
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Persistent BullMQ queue, automated Ethereal SMTP delivery, per-sender hourly rate limiting, and staggered email scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('create-campaign')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Campaign</span>
            </button>

            <button
              onClick={() => fetchData(false)}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Campaigns"
          value={totalCampaigns}
          subtitle="All created campaigns"
          icon={<FolderKanban className="w-5 h-5" />}
          iconBgColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        />
        <StatCard
          title="Total Emails"
          value={totalEmails}
          subtitle={`${pendingEmails} scheduled / pending`}
          icon={<Mail className="w-5 h-5" />}
          iconBgColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
        />
        <StatCard
          title="Delivered (Sent)"
          value={sentEmails}
          subtitle="Confirmed via SMTP"
          icon={<Send className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          trend={`${totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0}% sent`}
          trendPositive={true}
        />
        <StatCard
          title="Failed / Throttled"
          value={failedEmails}
          subtitle={`${processingEmails} actively processing`}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
        />
      </div>

      {/* Live Queue Overview Card */}
      {queueStatus && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">BullMQ Live Queue Telemetry</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {queueStatus.queueName}
              </span>
            </div>
            <button
              onClick={() => onNavigate('queue')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>Full Queue Monitor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Delayed</span>
              <span className="text-lg font-bold text-amber-400 mt-1 block">{queueStatus.counts.delayed}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Active</span>
              <span className="text-lg font-bold text-blue-400 mt-1 block">{queueStatus.counts.active}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Waiting</span>
              <span className="text-lg font-bold text-slate-200 mt-1 block">{queueStatus.counts.waiting}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Completed</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">{queueStatus.counts.completed}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Failed</span>
              <span className="text-lg font-bold text-rose-400 mt-1 block">{queueStatus.counts.failed}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider flex items-center justify-center gap-1">
                <Cpu className="w-3 h-3" /> Workers
              </span>
              <span className="text-lg font-bold text-indigo-400 mt-1 block">{queueStatus.workerConcurrency}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Campaigns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Email Campaigns</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest outreach schedules and delivery progress</p>
          </div>
          <button
            onClick={() => onNavigate('campaigns')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Campaigns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderKanban className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-300">No campaigns created yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload a CSV and schedule your first email campaign</p>
            <button
              onClick={() => onNavigate('create-campaign')}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">Delay / Rate</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {campaigns.slice(0, 5).map((c) => {
                  const percent = c.totalEmails > 0 ? Math.round((c.sentEmails / c.totalEmails) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white max-w-[220px] truncate">
                        {c.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                        {c.sender}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(c.startTime).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {c.delaySeconds}s delay • {c.hourlyLimit}/hr
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {c.totalEmails}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400">{percent}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onViewCampaign(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 text-xs font-medium transition-colors"
                        >
                          Details
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
