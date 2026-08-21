import React from 'react';
import { ArrowRight, Radio } from 'lucide-react';

interface LandingCTAProps {
  onGetStarted: () => void;
  isSignedIn?: boolean;
  onOpenDashboard?: () => void;
}

export const LandingCTA: React.FC<LandingCTAProps> = ({
  onGetStarted,
  isSignedIn = false,
  onOpenDashboard,
}) => {
  return (
    <section className="relative py-28 border-t border-border overflow-hidden bg-surface">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 lg:px-12 text-center space-y-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30">
          <Radio className="w-7 h-7" />
        </div>

        <div className="space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block">
            ReachInbox Outreach Engine
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans">
            Ready to schedule reliable email outreach?
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto font-sans leading-relaxed">
            Start dispatching bulk cold campaigns with persistent BullMQ queues,
            dedicated background workers, and atomic per-sender rate limiting today.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isSignedIn ? (
            <button
              onClick={onOpenDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 bg-white hover:bg-slate-200 text-[#090a0d] text-xs font-mono uppercase tracking-wider font-bold rounded-full transition-all shadow-xl shadow-white/10 hover:scale-[1.02] group"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-bold rounded-full transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] group"
            >
              <span>Start Free with Google</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
