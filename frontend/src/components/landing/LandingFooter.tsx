import React from 'react';
import { Radio, ArrowUp } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-12 border-t border-border bg-[#090a0d] text-muted-foreground text-xs font-mono">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand info */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-white tracking-tight">REACHINBOX EMAIL SCHEDULER</span>
          <span className="text-white/20">|</span>
          <span>Outbox Labs Assessment</span>
        </div>

        {/* Links & Back to Top */}
        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </a>
          <a href="#metrics" className="hover:text-white transition-colors">
            Telemetry
          </a>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-surface hover:bg-surface-elevated text-slate-300 hover:text-white border border-border transition-colors"
            title="Back to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
