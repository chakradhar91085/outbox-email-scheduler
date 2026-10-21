import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface Step {
  number: string;
  title: string;
  description: string;
  code: string;
  filename: string;
}

const steps: Step[] = [
  {
    number: 'I',
    title: 'Add your recipients',
    description:
      'Upload a CSV or paste addresses. The email column is detected automatically, and invalid or duplicate addresses are removed before anything is scheduled.',
    filename: 'recipients.ts',
    code: `// 1. Parsed from your CSV in the browser
const recipients = [
  'alice@company.com',
  'bob@startup.io',
  'carol@agency.co',
];
// invalid and duplicate rows are skipped`,
  },
  {
    number: 'II',
    title: 'Write the email',
    description:
      'Set the sender, subject and body. Campaigns from the same sender share one hourly limit, so splitting a send into several campaigns never overshoots it.',
    filename: 'email.ts',
    code: `// 2. Campaign content
const email = {
  sender: 'ReachInbox Outreach <outreach@reachinbox.ai>',
  subject: 'Quick question',
  body: 'Hi, wanted to connect about...',
};`,
  },
  {
    number: 'III',
    title: 'Set the timing',
    description:
      'Pick a start time, a delay between emails (e.g. 5s) and an hourly limit per sender (e.g. 100/hr). The form previews exactly when the last email will go out.',
    filename: 'schedule.ts',
    code: `// 3. Timing and limits
const schedule = {
  startTime: '2026-10-21T09:00:00.000Z',
  delaySeconds: 5,   // gap between emails
  hourlyLimit: 100,  // per sender
};
// 3 recipients -> last email at 09:00:10`,
  },
  {
    number: 'IV',
    title: 'Workers send on time',
    description:
      'Each email is a delayed BullMQ job. When it is due, a worker checks the sender limit, sends it and records the result, retrying if the send fails.',
    filename: 'email.worker.ts',
    code: `// 4. BullMQ worker (simplified)
new Worker('email-sending', async (job) => {
  const { allowed } = await rateLimiter
    .checkAndConsume(sender, hourlyLimit);
  if (!allowed) return moveToNextWindow(job);

  await provider.sendEmail(email);
  await prisma.email.update({ status: 'SENT' });
}, { concurrency: 5 });`,
  },
];

export const LandingHowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-[#0d0f14] text-white border-t border-border overflow-hidden"
    >
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4">
            <span className="w-8 h-px bg-indigo-500/60" />
            How It Works
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-bold tracking-tight text-white transition-all duration-700 font-sans ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Four steps.
            <br />
            <span className="text-muted-foreground font-light">From CSV to inbox.</span>
          </h2>
        </div>

        {/* Grid Layout: Left Steps, Right Terminal Code */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    'w-full text-left p-6 rounded-2xl border transition-all duration-300 group',
                    isActive
                      ? 'bg-surface border-indigo-500/40 shadow-lg shadow-indigo-600/5'
                      : 'bg-transparent border-transparent opacity-50 hover:opacity-80 hover:bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-start gap-5">
                    <span className="font-mono text-xl font-bold text-indigo-400 pt-0.5">
                      {step.number}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                        {step.description}
                      </p>

                      {/* Progress line */}
                      {isActive && (
                        <div className="pt-3">
                          <div className="w-full bg-background rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full animate-[progress_6s_linear_infinite]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Code Display */}
          <div className="lg:sticky lg:top-28 self-start">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
              {/* Window Header */}
              <div className="px-5 py-3.5 border-b border-border bg-surface-elevated flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {steps[activeStep].filename}
                </span>
              </div>

              {/* Code Body */}
              <div className="p-6 font-mono text-xs overflow-x-auto min-h-[300px] bg-[#090a0d] leading-relaxed">
                <pre className="text-slate-300">
                  {steps[activeStep].code.split('\n').map((line, lineIndex) => (
                    <div key={`${activeStep}-${lineIndex}`} className="flex gap-4">
                      <span className="text-slate-600 select-none w-5 text-right flex-shrink-0">
                        {lineIndex + 1}
                      </span>
                      <span className="text-indigo-200">{line}</span>
                    </div>
                  ))}
                </pre>
              </div>

              {/* Window Footer Status */}
              <div className="px-5 py-3 border-t border-border bg-surface-elevated/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  BullMQ · email-sending
                </span>
                <span>TypeScript 5.x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
