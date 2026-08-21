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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Search & New Campaign action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <span className="w-8 h-px bg-indigo-500/50" />
            Outreach Catalog
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
            Campaign Management
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Manage scheduled outreach pipelines, staggered delays, and delivery progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 w-48 sm:w-64 transition-colors"
            />
          </div>

          <button
            onClick={() => fetchCampaigns(false)}
            disabled={isRefreshing}
            className="p-2 bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-white rounded-xl border border-border transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('create-campaign')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying campaign registry..." size="md" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchCampaigns(true)} />
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center text-muted-foreground space-y-3 shadow-sm">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-700 mb-2" />
          <h3 className="text-base font-bold text-white tracking-tight">No campaigns found</h3>
          <p className="text-xs font-mono text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No campaigns matched "${searchQuery}". Try searching with another keyword.`
              : 'Create your first scheduled email campaign to start automated delivery.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => onNavigate('create-campaign')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/50 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Sender</th>
                  <th className="py-3.5 px-6">Start Time</th>
                  <th className="py-3.5 px-6">Delay / Limit</th>
                  <th className="py-3.5 px-6">Total Leads</th>
                  <th className="py-3.5 px-6">Status Breakdown</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300 font-sans">
                {filteredCampaigns.map((c) => {
                  const percent = c.totalEmails > 0 ? Math.round((c.sentEmails / c.totalEmails) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6 font-semibold text-white max-w-[220px] truncate">
                        {c.subject}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] max-w-[180px] truncate">
                        {c.sender}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {new Date(c.startTime).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {c.delaySeconds}s delay • {c.hourlyLimit}/hr
                      </td>
                      <td className="py-4 px-6 font-bold text-white font-mono">
                        {c.totalEmails}
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1.5 max-w-[160px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="text-emerald-400 font-medium">{c.sentEmails} sent</span>
                            <span className="text-amber-400 font-medium">{c.pendingEmails} pend</span>
                            {c.failedEmails > 0 && (
                              <span className="text-rose-400 font-medium">{c.failedEmails} fail</span>
                            )}
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
                          onClick={() => setActiveModalId(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-border hover:border-indigo-500/30 text-xs font-mono uppercase tracking-wider transition-colors"
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
            fetchCampaigns(false);
          }}
          token={token}
        />
      )}
    </div>
  );
};
