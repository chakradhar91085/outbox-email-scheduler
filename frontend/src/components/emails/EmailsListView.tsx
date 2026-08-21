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

  const fetchEmails = async (isInitial = false) => {
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
      setEmails(res.emails);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (isInitial) {
        setError(err.message || 'Failed to fetch emails');
      } else {
        console.warn('[EmailsListView] Background polling error:', err.message);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch when filters/pagination change
  useEffect(() => {
    fetchEmails(true);
  }, [statusFilter, page, limit, token]);

  // Periodic Background Polling (every 4 seconds) if there are active emails or pending state
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentList = emailsRef.current;
      const hasActive =
        currentList.length > 0 &&
        currentList.some(
          (e) => e.status === 'PENDING' || e.status === 'PROCESSING'
        );

      // Also refresh if filter is PENDING or PROCESSING or ALL
      if (hasActive || statusFilter === 'PENDING' || statusFilter === 'PROCESSING' || statusFilter === 'ALL') {
        fetchEmails(false);
      }
    }, 4000);

    return () => {
      clearInterval(intervalId);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Email Delivery Logs</h2>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                <Activity className="w-3 h-3 animate-spin" /> Live Syncing...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of all individual scheduled, sent, and throttled email dispatches.
          </p>
        </div>

        <button
          onClick={() => fetchEmails(false)}
          disabled={isRefreshing}
          className="self-start sm:self-auto p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors disabled:opacity-50"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient, subject, sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Querying email logs..." size="md" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchEmails(true)} />
      ) : emails.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Mail className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No emails found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No emails match your active search or status filter.'
              : 'Emails will appear here once campaigns are scheduled.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Campaign Subject</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {emails.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white max-w-[200px] truncate">
                      {e.recipientEmail}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
                      {e.campaign?.subject || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[160px] truncate">
                      {e.campaign?.sender || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(e.scheduledAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {e.sentAt ? new Date(e.sentAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={e.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-center sm:text-left">
                      {e.attempts}
                    </td>
                    <td
                      title={e.errorMessage || undefined}
                      className="py-3 px-4 text-rose-400 font-mono text-[11px] max-w-[180px] truncate cursor-help"
                    >
                      {e.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-white">{emails.length}</span> of{' '}
              <span className="font-semibold text-white">{totalItems}</span> total emails
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors"
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
