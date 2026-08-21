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

  // Keep a ref to the campaign to check if active emails remain without stale closures
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
      // Don't wipe existing campaign data on background polling error
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
    // Check if campaign has non-terminal emails (PENDING or PROCESSING)
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
      // Poll if any email is still pending or processing
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

    // CRITICAL: Clean up timer when modal unmounts or campaignId changes
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                Campaign Audit & Timeline
              </span>

              {/* Dynamic Live Polling Badge */}
              {isPollingActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Polling (3s)
                </span>
              ) : isFullyCompleted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  All Dispatched
                </span>
              ) : null}
            </div>

            <h3 className="text-base font-bold text-white tracking-tight mt-0.5 truncate max-w-lg">
              {campaign?.subject || 'Loading Campaign...'}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchDetails(false)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Manual refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <LoadingSpinner message="Fetching campaign emails..." />
          ) : error ? (
            <ErrorAlert message={error} onRetry={() => fetchDetails(true)} />
          ) : campaign ? (
            <>
              {/* Campaign Configuration Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sender</span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate block">
                    {campaign.sender}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Start Time</span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate block">
                    {new Date(campaign.startTime).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Interval Delay</span>
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {campaign.delaySeconds} seconds / email
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hourly Quota</span>
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {campaign.hourlyLimit} emails / hour
                  </span>
                </div>
              </div>

              {/* Message Body Snippet */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Email Body Content:
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {campaign.body}
                </p>
              </div>

              {/* Individual Scheduled Emails Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recipient Delivery Queue ({totalEmails} total)
                    </span>
                    {isRefreshing && (
                      <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-spin" /> Syncing...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-medium">{sentCount} Sent</span>
                    <span className="text-amber-400 font-medium">{pendingCount} Pending</span>
                    {processingCount > 0 && (
                      <span className="text-blue-400 font-medium">{processingCount} Processing</span>
                    )}
                    {failedCount > 0 && (
                      <span className="text-rose-400 font-medium">{failedCount} Failed</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3.5">#</th>
                        <th className="py-2.5 px-3.5">Recipient</th>
                        <th className="py-2.5 px-3.5">Scheduled At</th>
                        <th className="py-2.5 px-3.5">Sent At</th>
                        <th className="py-2.5 px-3.5">Status</th>
                        <th className="py-2.5 px-3.5">Attempts</th>
                        <th className="py-2.5 px-3.5">Error / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {campaign.emails?.map((email, idx) => (
                        <tr key={email.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3.5 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3.5 font-medium text-white max-w-[200px] truncate">
                            {email.recipientEmail}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-400 whitespace-nowrap">
                            {new Date(email.scheduledAt).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-400 whitespace-nowrap">
                            {email.sentAt ? new Date(email.sentAt).toLocaleTimeString() : '—'}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <StatusBadge status={email.status} size="sm" />
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-400 font-mono">
                            {email.attempts}
                          </td>
                          <td
                            title={email.errorMessage || undefined}
                            className="py-2.5 px-3.5 text-xs text-rose-400 max-w-[180px] truncate font-mono cursor-help"
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
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {isFullyCompleted
              ? '✨ All emails have been delivered or processed.'
              : '⚡ Auto-refreshing every 3s as emails are processed by BullMQ.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
