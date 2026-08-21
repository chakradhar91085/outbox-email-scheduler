import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

type DevTab = 'install' | 'schedule' | 'worker';

export const LandingDevelopers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DevTab>('install');
  const [copied, setCopied] = useState(false);

  const snippets: Record<DevTab, string> = {
    install: `# 1. Start Docker Infrastructure (PostgreSQL & Redis)
docker compose up -d

# 2. Start Backend API Server
cd backend && npm run dev

# 3. Start Dedicated Email Worker
cd backend && npm run worker`,
    schedule: `// POST /api/campaigns
const response = await fetch('http://localhost:5000/api/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${clerkJwtToken}\`
  },
  body: JSON.stringify({
    recipients: ['lead1@corp.com', 'lead2@startup.io'],
    subject: 'Accelerating cold outreach pipelines',
    body: 'Hi {{name}}, let us streamline your workflows.',
    sender: 'ReachInbox Outreach <outreach@reachinbox.ai>',
    startTime: new Date(Date.now() + 60000).toISOString(),
    delaySeconds: 5,
    hourlyLimit: 100
  })
});`,
    worker: `// backend/src/workers/email.worker.ts
import { Worker } from 'bullmq';
import { rateLimiter } from '../services/rate-limiter.service';
import { emailService } from '../services/email.service';

export const emailWorker = new Worker('email-sending', async (job) => {
  const { emailId, sender } = job.data;
  
  // Enforce atomic per-sender rate limiting
  const allowed = await rateLimiter.checkAndIncrement(sender, job.data.hourlyLimit);
  if (!allowed) return rescheduleToNextWindow(job);
  
  await emailService.sendMail(job.data);
}, {
  concurrency: 5, // Process 5 jobs in parallel
  connection: redisClient
});`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="py-24 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Description */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400">
              <span className="w-8 h-px bg-indigo-500/60" />
              Developer First
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans">
              Built by devs.
              <br />
              <span className="text-muted-foreground font-light">For high-scale outreach.</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans max-w-xl">
              Clean TypeScript architecture with explicit contracts, Zod schema validations,
              BullMQ delayed queue idempotency, and modular Express routers.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-xs font-mono">
              <div className="p-4 bg-surface border border-border rounded-xl">
                <span className="text-indigo-400 font-bold block mb-1">TypeScript Native</span>
                <span className="text-muted-foreground">Full type-safety from DB to UI</span>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <span className="text-emerald-400 font-bold block mb-1">Zero-Cron Logic</span>
                <span className="text-muted-foreground">100% BullMQ delayed queues</span>
              </div>
            </div>
          </div>

          {/* Right Code Snippet Box */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Tab Header */}
            <div className="px-5 py-3.5 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('install')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors',
                    activeTab === 'install'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-white'
                  )}
                >
                  Quickstart
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors',
                    activeTab === 'schedule'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-white'
                  )}
                >
                  Schedule API
                </button>
                <button
                  onClick={() => setActiveTab('worker')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors',
                    activeTab === 'worker'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-white'
                  )}
                >
                  Worker Logic
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Code Body */}
            <div className="p-6 font-mono text-xs overflow-x-auto min-h-[260px] bg-[#090a0d] text-slate-300 leading-relaxed">
              <pre>{snippets[activeTab]}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
