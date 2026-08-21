import React, { useEffect, useState, useRef } from 'react';
import { Campaign } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { CampaignDetailsModal } from './CampaignDetailsModal';
import { NavTab } from '../layout/Sidebar';
import {
  FolderKanban,
  PlusCircle,
  RefreshCw,
  Search,
  ChevronRight,
} from 'lucide-react';

interface CampaignsListViewProps {
  onNavigate: (tab: NavTab) => void;
  selectedCampaignId?: string | null;
  onClearSelectedCampaign?: () => void;
  token?: string | null;
}

export const CampaignsListView: React.FC<CampaignsListViewProps> = ({
  onNavigate,
  selectedCampaignId,
  onClearSelectedCampaign,
  token,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalId, setActiveModalId] = useState<string | null>(selectedCampaignId || null);

  const campaignsRef = useRef<Campaign[]>([]);
  campaignsRef.current = campaigns;

  const fetchCampaigns = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const data = await api.getCampaigns(token);
      setCampaigns(data);
    } catch (err: any) {
      if (isInitial) {
        setError(err.message || 'Failed to fetch campaigns');
      } else {
        console.warn('[CampaignsListView] Background polling error:', err.message);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchCampaigns(true);
  }, [token]);

  // Periodic Background Polling (every 4 seconds) if any campaign has active emails
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentList = campaignsRef.current;
      const hasActive =
        currentList.length > 0 &&
        currentList.some(
          (c) => (c.pendingEmails && c.pendingEmails > 0) || (c.processingEmails && c.processingEmails > 0)
        );

      if (hasActive) {
        fetchCampaigns(false);
      }
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (selectedCampaignId) {
      setActiveModalId(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const filteredCampaigns = campaigns.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.subject.toLowerCase().includes(q) ||
      c.sender.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Search & New Campaign action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Email Campaigns</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage scheduled outreach campaigns, staggered schedules, and delivery progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => fetchCampaigns(false)}
            disabled={isRefreshing}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('create-campaign')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading campaigns..." size="md" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchCampaigns(true)} />
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No campaigns found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No campaigns matched "${searchQuery}". Try a different keyword.`
              : 'Create your first scheduled email campaign to start automated delivery.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => onNavigate('create-campaign')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">Delay / Limit</th>
                  <th className="py-3 px-4">Emails</th>
                  <th className="py-3 px-4">Status Breakdown</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCampaigns.map((c) => {
                  const percent = c.totalEmails > 0 ? Math.round((c.sentEmails / c.totalEmails) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white max-w-[220px] truncate">
                        {c.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[180px] truncate">
                        {c.sender}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(c.startTime).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {c.delaySeconds}s delay • {c.hourlyLimit}/hr
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {c.totalEmails}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[160px]">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="text-emerald-400 font-medium">{c.sentEmails} sent</span>
                            <span className="text-amber-400 font-medium">{c.pendingEmails} pend</span>
                            {c.failedEmails > 0 && (
                              <span className="text-rose-400 font-medium">{c.failedEmails} fail</span>
                            )}
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveModalId(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for detailed campaign view */}
      {activeModalId && (
        <CampaignDetailsModal
          campaignId={activeModalId}
          onClose={() => {
            setActiveModalId(null);
            if (onClearSelectedCampaign) onClearSelectedCampaign();
            // Refresh campaigns list when closing modal to sync status
            fetchCampaigns(false);
          }}
          token={token}
        />
      )}
    </div>
  );
};
