import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../../services/api';
import { CreateCampaignPayload } from '../../types';
import { NavTab } from '../layout/Sidebar';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Calendar,
  Layers,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';

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
      <div className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl p-10 text-center shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 block mb-1">
            Pipeline Initialized
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
            Campaign Scheduled Successfully!
          </h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            Persisted <strong className="text-white font-mono">{createdSuccess.total} emails</strong> in PostgreSQL and enqueued delayed BullMQ jobs in Redis. First dispatch begins at{' '}
            <span className="text-indigo-400 font-mono">{createdSuccess.firstTime}</span>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onCampaignCreated(createdSuccess.id)}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
          >
            Inspect Campaign Details
          </button>
          <button
            onClick={() => onNavigate('campaigns')}
            className="w-full sm:w-auto px-6 py-2.5 bg-surface-elevated hover:bg-surface-highlight text-slate-300 text-xs font-mono uppercase tracking-wider font-medium rounded-xl border border-border transition-colors"
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
            className="w-full sm:w-auto px-6 py-2.5 text-muted-foreground hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
          >
            Schedule Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          <span className="w-8 h-px bg-indigo-500/50" />
          Campaign Dispatch Wizard
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
          Schedule Outreach Campaign
        </h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Upload lead CSVs, configure delivery spacing, and enforce sender rate limits.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Recipients / Audience */}
      <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono text-xs font-bold">
              01
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recipient Audience</h3>
              <p className="text-[11px] font-mono text-muted-foreground">Upload CSV or paste email addresses</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setRecipientInputMode('csv')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-mono text-xs transition-colors',
                recipientInputMode === 'csv'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              )}
            >
              CSV Upload
            </button>
            <button
              type="button"
              onClick={() => setRecipientInputMode('manual')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-mono text-xs transition-colors',
                recipientInputMode === 'manual'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              )}
            >
              Manual Paste
            </button>
          </div>
        </div>

        {recipientInputMode === 'csv' ? (
          <div className="space-y-4">
            <label className="block border-2 border-dashed border-border hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-background/50 hover:bg-white/[0.02] group">
              <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-indigo-400 transition-colors mb-3" />
              <span className="text-sm font-semibold text-white block">
                {fileName ? fileName : 'Click or drag & drop CSV file'}
              </span>
              <span className="text-xs font-mono text-muted-foreground mt-1 block">
                Supports auto-column detection (`email`, `recipient`, `mail`)
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {recipients.length > 0 && (
              <div className="p-4 bg-background border border-border rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{recipients.length} Valid Recipients Parsed</span>
                </div>
                {invalidCount > 0 && (
                  <span className="text-amber-400">{invalidCount} Invalid/Duplicate Skipped</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={4}
              placeholder="Paste email addresses separated by commas or line breaks&#10;alice@company.com&#10;bob@startup.io&#10;charlie@enterprise.org"
              value={manualText}
              onChange={(e) => handleManualTextChange(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-4 text-xs font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {recipients.length > 0 && (
              <span className="text-xs font-mono text-emerald-400 block">
                ✓ {recipients.length} valid unique recipients detected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Email Template Content */}
      <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono text-xs font-bold">
            02
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Email Content & Identity</h3>
            <p className="text-[11px] font-mono text-muted-foreground">Sender profile, subject line, and outreach body</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Sender Address
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Sender Name <sender@domain.com>"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              placeholder="e.g. Accelerating your data workflows with ReachInbox"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Body Content
            </label>
            <textarea
              rows={6}
              placeholder="Write your email body template here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-4 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-sans"
            />
          </div>
        </div>
      </div>

      {/* Step 3: Timing & Rate Limits + Schedule Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono text-xs font-bold">
              03
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Timing & Rate Controls</h3>
              <p className="text-[11px] font-mono text-muted-foreground">Start schedule, stagger spacing, and hourly limit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Start Time ($T_0$)
              </label>
              <input
                type="datetime-local"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Stagger Delay (seconds/email)
              </label>
              <input
                type="number"
                min={0}
                max={3600}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Hourly Rate Limit (per sender)
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <span className="text-[11px] font-mono text-muted-foreground mt-1.5 block">
              Enforced across all campaigns using this sender email via Redis Lua script.
            </span>
          </div>
        </div>

        {/* Real-time Schedule Calculator Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1">
              Live Schedule Math
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight">Timeline Estimation</h4>

            <div className="mt-4 space-y-3 text-xs font-mono">
              <div className="p-3 bg-background border border-border rounded-xl space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase block">Recipients</span>
                <span className="text-base font-bold text-white">{recipientCount} leads</span>
              </div>

              <div className="p-3 bg-background border border-border rounded-xl space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase block">Estimated Duration</span>
                <span className="text-base font-bold text-indigo-300">
                  {Math.ceil(totalDurationSeconds / 60)} min ({totalDurationSeconds}s)
                </span>
              </div>

              <div className="p-3 bg-background border border-border rounded-xl space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase block">Completion Time</span>
                <span className="text-xs text-emerald-400 font-semibold block">
                  {estimatedCompletionDate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {submitting ? (
              <span>Enqueueing BullMQ Jobs...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Schedule Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
