import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { NavTab } from './Sidebar';
import { ChevronRight, Cpu, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  workerConcurrency?: number;
  onViewLandingPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  workerConcurrency = 5,
  onViewLandingPage,
}) => {
  const { user } = useUser();
  const [time, setTime] = useState(new Date());

  // Synchronized Live Clock from V0 design
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const tabLabels: Record<NavTab, { title: string; category: string }> = {
    dashboard: { title: 'Overview & Telemetry', category: 'Console' },
    'create-campaign': { title: 'Schedule Campaign', category: 'Outreach' },
    campaigns: { title: 'All Campaigns', category: 'Outreach' },
    emails: { title: 'Delivery Logs', category: 'Audit' },
    queue: { title: 'BullMQ Monitor', category: 'Infrastructure' },
  };

  const current = tabLabels[activeTab] || { title: 'Dashboard', category: 'Console' };

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground font-mono uppercase tracking-widest text-[11px]">
          {current.category}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="font-semibold text-white tracking-tight font-sans">
          {current.title}
        </span>
      </div>

      {/* Live System Status & User Area */}
      <div className="flex items-center gap-4">
        {/* Landing Page Switcher */}
        {onViewLandingPage && (
          <button
            onClick={onViewLandingPage}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-highlight text-muted-foreground hover:text-white border border-border text-xs font-mono uppercase tracking-wider transition-colors"
            title="View Public Landing Page"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Landing Page</span>
          </button>
        )}

        {/* Live Clock & Pulse Indicator */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span className="text-white/20">|</span>
          <span className="text-slate-300">{time.toLocaleTimeString()}</span>
        </div>

        {/* Worker Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5" />
          <span>{workerConcurrency} Workers</span>
        </div>

        {/* User Info & Clerk Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-border">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-white leading-tight font-sans">
              {user?.fullName || user?.firstName || 'Operator'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>

          <div className="flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 rounded-lg border border-white/10 shadow-sm',
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
