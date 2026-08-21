import React, { useEffect, useState, useRef } from 'react';
import { Campaign } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import {
  X,
  Calendar,
  Clock,
  Layers,
  User,
  RefreshCw,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface CampaignDetailsModalProps {
  campaignId: string;
  onClose: () => void;
  token?: string | null;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaignId,
  onClose,
  token,
}) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);

  const campaignRef = useRef<Campaign | null>(null);
  campaignRef.current = campaign;

  const fetchDetails = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const data = await api.getCampaignById(campaignId, token);
      setCampaign(data);
    } catch (err: any) {
      if (isInitial) {
        setError(err.message || 'Failed to load campaign details');
      } else {
        console.warn('[CampaignDetailsModal] Background polling error:', err.message);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchDetails(true);
  }, [campaignId, token]);

  // Live Polling Effect (3-second interval)
  useEffect(() => {
    const hasActiveEmails =
      !campaign ||
      (campaign.emails &&
        campaign.emails.some(
          (e) => e.status === 'PENDING' || e.status === 'PROCESSING'
        ));

    if (!hasActiveEmails) {
      setIsPollingActive(false);
      return;
    }

    setIsPollingActive(true);

    const intervalId = setInterval(() => {
      const current = campaignRef.current;
      const stillActive =
        !current ||
        (current.emails &&
          current.emails.some(
            (e) => e.status === 'PENDING' || e.status === 'PROCESSING'
          ));

      if (stillActive) {
        fetchDetails(false);
      } else {
        setIsPollingActive(false);
        clearInterval(intervalId);
      }
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [campaign?.id, campaign?.emails?.map((e) => e.status).join(','), token]);

  const pendingCount = campaign?.emails?.filter((e) => e.status === 'PENDING').length || 0;
  const processingCount = campaign?.emails?.filter((e) => e.status === 'PROCESSING').length || 0;
  const sentCount = campaign?.emails?.filter((e) => e.status === 'SENT').length || 0;
  const failedCount = campaign?.emails?.filter((e) => e.status === 'FAILED').length || 0;
  const totalEmails = campaign?.emails?.length || 0;
  const isFullyCompleted = totalEmails > 0 && pendingCount === 0 && processingCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block">
                Campaign Audit & Timeline
              </span>

              {/* Dynamic Live Polling Badge */}
              {isPollingActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Polling (3s)
                </span>
              ) : isFullyCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400">
                  <CheckCircle2 className="w-3 h-3" />
                  All Dispatched
                </span>
              ) : null}
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight mt-1 truncate max-w-lg font-sans">
              {campaign?.subject || 'Loading Campaign...'}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchDetails(false)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-highlight text-muted-foreground hover:text-white border border-border transition-colors disabled:opacity-50"
              title="Manual refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-highlight text-muted-foreground hover:text-white border border-border transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {loading ? (
            <LoadingSpinner message="Querying campaign details & email audit trail..." />
          ) : error ? (
            <ErrorAlert message={error} onRetry={() => fetchDetails(true)} />
          ) : campaign ? (
            <>
              {/* Campaign Configuration Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-background border border-border rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sender</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-white truncate block">
                    {campaign.sender}
                  </span>
                </div>

                <div className="p-4 bg-background border border-border rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Start Time</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-white truncate block">
                    {new Date(campaign.startTime).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-background border border-border rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Interval Delay</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-white">
                    {campaign.delaySeconds}s / email
                  </span>
                </div>

                <div className="p-4 bg-background border border-border rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hourly Quota</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-white">
                    {campaign.hourlyLimit} / hr
                  </span>
                </div>
              </div>

              {/* Message Body Snippet */}
              <div className="bg-background border border-border rounded-xl p-5 space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground block">
                  Email Body Content:
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {campaign.body}
                </p>
              </div>

              {/* Individual Scheduled Emails Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Recipient Delivery Queue ({totalEmails} total)
                    </span>
                    {isRefreshing && (
                      <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-spin" /> Syncing...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400 font-medium">{sentCount} Sent</span>
                    <span className="text-amber-400 font-medium">{pendingCount} Pending</span>
                    {processingCount > 0 && (
                      <span className="text-indigo-400 font-medium">{processingCount} Processing</span>
                    )}
                    {failedCount > 0 && (
                      <span className="text-rose-400 font-medium">{failedCount} Failed</span>
                    )}
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface text-muted-foreground font-mono text-[10px] uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Recipient</th>
                        <th className="py-2.5 px-4">Scheduled At</th>
                        <th className="py-2.5 px-4">Sent At</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Attempts</th>
                        <th className="py-2.5 px-4">Error / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-slate-300 font-sans">
                      {campaign.emails?.map((email, idx) => (
                        <tr key={email.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate font-mono text-xs">
                            {email.recipientEmail}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                            {new Date(email.scheduledAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                            {email.sentAt ? new Date(email.sentAt).toLocaleTimeString() : '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={email.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {email.attempts}
                          </td>
                          <td
                            title={email.errorMessage || undefined}
                            className="py-3 px-4 text-[11px] text-rose-400 max-w-[180px] truncate font-mono cursor-help"
                          >
                            {email.errorMessage || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface/80 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground text-[11px]">
            {isFullyCompleted
              ? '✨ All emails have been delivered or processed.'
              : '⚡ Auto-refreshing every 3s as emails are processed by BullMQ.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-elevated hover:bg-surface-highlight text-slate-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors border border-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
