import React, { useEffect, useState, useRef } from 'react';
import { Email } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import {
  Mail,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Loader2,
  XCircle,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmailsListViewProps {
  token?: string | null;
}

export const EmailsListView: React.FC<EmailsListViewProps> = ({ token }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const emailsRef = useRef<Email[]>([]);
  emailsRef.current = emails;

  const isFetchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchEmails = async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const res = await api.getEmails(
        {
          status: statusFilter,
          search: searchQuery.trim() || undefined,
          page,
          limit,
        },
        token
      );
      if (mountedRef.current) {
        setEmails(res.emails);
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        if (isInitial) {
          setError(err.message || 'Failed to fetch emails');
        } else {
          console.warn('[EmailsListView] Background polling error:', err.message);
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

  // Fetch when filters/pagination change
  useEffect(() => {
    fetchEmails(true);
  }, [statusFilter, page, limit, token]);

  // Periodic Background Polling (every 2 seconds) if there are active emails
  useEffect(() => {
    mountedRef.current = true;

    timerRef.current = setInterval(() => {
      const currentList = emailsRef.current;
      const hasActive =
        currentList.length === 0 ||
        currentList.some(
          (e) => e.status === 'PENDING' || e.status === 'PROCESSING'
        );

      if (hasActive || statusFilter === 'PENDING' || statusFilter === 'PROCESSING' || statusFilter === 'ALL') {
        fetchEmails(false);
      }
    }, 2000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [statusFilter, page, limit, searchQuery, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmails(true);
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Emails' },
    { id: 'PENDING', label: 'Pending / Delayed', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'PROCESSING', label: 'Processing', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
    { id: 'SENT', label: 'Sent (Delivered)', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'FAILED', label: 'Failed', icon: <XCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <span className="w-8 h-px bg-indigo-500/50" />
            Audit Trail
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
              Email Delivery Logs
            </h2>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400">
                <Activity className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Real-time audit log of all individual scheduled, sent, and throttled email dispatches.
          </p>
        </div>

        <button
          onClick={() => fetchEmails(false)}
          disabled={isRefreshing}
          className="self-start sm:self-auto p-2.5 bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-white rounded-xl border border-border transition-colors disabled:opacity-50"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border',
                    active
                      ? 'bg-indigo-600/15 text-white border-indigo-500/30 font-semibold shadow-sm'
                      : 'border-transparent text-muted-foreground hover:text-white hover:bg-white/[0.03]'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient, subject, sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-surface-elevated hover:bg-surface-highlight text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl border border-border transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Querying email dispatch logs..." size="md" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchEmails(true)} />
      ) : emails.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center text-muted-foreground space-y-3 shadow-sm">
          <Mail className="w-12 h-12 mx-auto text-slate-700 mb-2" />
          <h3 className="text-base font-bold text-white tracking-tight">No emails found</h3>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No emails match your active search or status filter.'
              : 'Emails will appear here once campaigns are scheduled.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/50 text-muted-foreground font-mono text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">Recipient</th>
                  <th className="py-3.5 px-6">Campaign Subject</th>
                  <th className="py-3.5 px-6">Sender</th>
                  <th className="py-3.5 px-6">Scheduled For</th>
                  <th className="py-3.5 px-6">Sent At</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Attempts</th>
                  <th className="py-3.5 px-6">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300 font-sans">
                {emails.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-white max-w-[200px] truncate text-xs">
                      {e.recipientEmail}
                    </td>
                    <td className="py-4 px-6 text-slate-300 max-w-[200px] truncate">
                      {e.campaign?.subject || '—'}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] max-w-[160px] truncate">
                      {e.campaign?.sender || '—'}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                      {new Date(e.scheduledAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                      {e.sentAt ? new Date(e.sentAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <StatusBadge status={e.status} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-[11px]">
                      {e.attempts}
                    </td>
                    <td
                      title={e.errorMessage || undefined}
                      className="py-4 px-6 text-rose-400 font-mono text-[11px] max-w-[180px] truncate cursor-help"
                    >
                      {e.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-background/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
            <div>
              Showing <span className="font-bold text-white">{emails.length}</span> of{' '}
              <span className="font-bold text-white">{totalItems}</span> total emails
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-semibold text-white">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
