import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../../services/api';
import { CreateCampaignPayload } from '../../types';
import { NavTab } from '../layout/Sidebar';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CreateCampaignViewProps {
  onNavigate: (tab: NavTab) => void;
  onCampaignCreated: (campaignId: string) => void;
  token?: string | null;
}

export const CreateCampaignView: React.FC<CreateCampaignViewProps> = ({
  onNavigate,
  onCampaignCreated,
  token,
}) => {
  // Form State
  const [recipientInputMode, setRecipientInputMode] = useState<'csv' | 'manual'>('csv');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualText, setManualText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [invalidCount, setInvalidCount] = useState(0);

  const [sender, setSender] = useState('ReachInbox Outreach <outreach@reachinbox.ai>');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Default start time: current time + 1 minute formatted for datetime-local
  const getDefaultStartTime = () => {
    const d = new Date(Date.now() + 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [startTimeStr, setStartTimeStr] = useState(getDefaultStartTime());
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  // Status & Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<{
    id: string;
    total: number;
    firstTime: string;
  } | null>(null);

  // Email validation regex
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const validEmails: string[] = [];
        let invalid = 0;

        // Try to find email column
        rows.forEach((row) => {
          let foundEmail = '';
          for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase().trim();
            if (
              lowerKey === 'email' ||
              lowerKey === 'e-mail' ||
              lowerKey === 'recipient' ||
              lowerKey === 'recipientemail' ||
              lowerKey === 'mail'
            ) {
              foundEmail = String(row[key] || '').trim();
              break;
            }
          }

          // If no specific header match, check first valid email value across all row values
          if (!foundEmail) {
            for (const val of Object.values(row)) {
              const strVal = String(val || '').trim();
              if (isValidEmail(strVal)) {
                foundEmail = strVal;
                break;
              }
            }
          }

          if (foundEmail && isValidEmail(foundEmail)) {
            validEmails.push(foundEmail);
          } else {
            invalid++;
          }
        });

        // Deduplicate
        const uniqueEmails = Array.from(new Set(validEmails));
        setRecipients(uniqueEmails);
        setInvalidCount(invalid);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  // Manual Text Handler
  const handleManualTextChange = (text: string) => {
    setManualText(text);
    const rawList = text.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    const valid = rawList.filter(isValidEmail);
    const unique = Array.from(new Set(valid));
    setRecipients(unique);
    setInvalidCount(rawList.length - unique.length);
  };

  // Schedule math
  const startDate = startTimeStr ? new Date(startTimeStr) : new Date();
  const recipientCount = recipients.length;
  const totalDurationSeconds = recipientCount > 1 ? (recipientCount - 1) * delaySeconds : 0;
  const estimatedCompletionDate = new Date(startDate.getTime() + totalDurationSeconds * 1000);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (recipients.length === 0) {
      setError('Please add at least one valid recipient email address.');
      return;
    }

    if (!subject.trim()) {
      setError('Campaign subject is required.');
      return;
    }

    if (!body.trim()) {
      setError('Email body is required.');
      return;
    }

    if (!sender.trim()) {
      setError('Sender address is required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateCampaignPayload = {
        recipients,
        subject: subject.trim(),
        body: body.trim(),
        sender: sender.trim(),
        startTime: startDate.toISOString(),
        delaySeconds: Number(delaySeconds),
        hourlyLimit: Number(hourlyLimit),
      };

      const result = await api.createCampaign(payload, token);

      setCreatedSuccess({
        id: result.id,
        total: recipients.length,
        firstTime: startDate.toLocaleString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to schedule campaign');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Confirmation State
  if (createdSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Campaign Scheduled Successfully!
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Persisted <strong>{createdSuccess.total} emails</strong> in PostgreSQL and enqueued delayed BullMQ jobs in Redis. Delivery starts at{' '}
          <span className="text-indigo-400 font-medium">{createdSuccess.firstTime}</span>.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onCampaignCreated(createdSuccess.id)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
          >
            View Campaign Details
          </button>
          <button
            onClick={() => onNavigate('campaigns')}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
          >
            View All Campaigns
          </button>
          <button
            onClick={() => {
              setCreatedSuccess(null);
              setRecipients([]);
              setFileName(null);
              setSubject('');
              setBody('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Schedule Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Schedule an Email Campaign</h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload lead CSVs, configure delivery spacing, and enforce sender rate limits.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Recipient List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-semibold text-white">Target Recipients</h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setRecipientInputMode('csv')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                recipientInputMode === 'csv'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CSV Upload
            </button>
            <button
              type="button"
              onClick={() => setRecipientInputMode('manual')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                recipientInputMode === 'manual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Emails
            </button>
          </div>
        </div>

        {recipientInputMode === 'csv' ? (
          <div className="space-y-3">
            <label className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
              <span className="text-sm font-medium text-slate-200">
                Click to upload CSV file
              </span>
              <span className="text-xs text-slate-500 mt-1">
                CSV with <code className="text-indigo-300">email</code> column header or raw email lists
              </span>
            </label>

            {fileName && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">{fileName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">
                    {recipients.length} valid email(s)
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-amber-400">
                      ({invalidCount} skipped/invalid)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={4}
              placeholder="Paste email addresses separated by commas or newlines:&#10;sarah@example.com&#10;david@company.io&#10;elena@reachinbox.ai"
              value={manualText}
              onChange={(e) => handleManualTextChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-mono"
            />
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>{recipients.length} valid recipient(s) parsed</span>
              {invalidCount > 0 && <span className="text-amber-400">{invalidCount} skipped</span>}
            </div>
          </div>
        )}

        {/* Preview of first 5 parsed recipients */}
        {recipients.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
              Recipients Preview ({recipients.length} total):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {recipients.slice(0, 10).map((r, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-mono truncate max-w-[200px]"
                >
                  {r}
                </span>
              ))}
              {recipients.length > 10 && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[11px] text-indigo-300 font-medium">
                  +{recipients.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Campaign Details & Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h3 className="text-sm font-semibold text-white">Email Content & Sender</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Sender Identifier / From Address
            </label>
            <input
              type="text"
              required
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. Sales Team <sales@company.com>"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used in the SMTP <code className="text-indigo-300">From</code> header and for hourly rate limiting.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Follow up on our recent product demo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Email Body (Plain Text / HTML)
          </label>
          <textarea
            rows={5}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hi there,&#10;&#10;I wanted to share an update regarding our email scheduler platform. Let me know if you'd like to connect.&#10;&#10;Best,&#10;ReachInbox Team"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
          />
        </div>
      </div>

      {/* 3. Scheduling & Rate Limiting Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h3 className="text-sm font-semibold text-white">Delivery Timing & Rate Limits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Start Date & Time</span>
            </label>
            <input
              type="datetime-local"
              required
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">First email dispatch time.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Delay Between Sends (Seconds)</span>
            </label>
            <input
              type="number"
              required
              min={0}
              max={3600}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Minimum spacing between consecutive emails.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hourly Sending Limit</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={10000}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Max emails this sender can send per hour.</p>
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div className="mt-4 p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Scheduling Timeline Preview</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Recipients</span>
              <span className="font-semibold text-white">{recipientCount} leads</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">First Send ($T_0$)</span>
              <span className="font-semibold text-white truncate block">
                {startDate.toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Interval Spacing</span>
              <span className="font-semibold text-white">+{delaySeconds}s per email</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Est. Completion</span>
              <span className="font-semibold text-emerald-400 truncate block">
                {recipientCount > 0 ? estimatedCompletionDate.toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('campaigns')}
          className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || recipients.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scheduling Campaign...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Schedule Campaign ({recipients.length} emails)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
