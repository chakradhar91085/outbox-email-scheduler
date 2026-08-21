import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Mail,
  Activity,
  Cpu,
  Radio,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type NavTab = 'dashboard' | 'create-campaign' | 'campaigns' | 'emails' | 'queue';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  workerConcurrency?: number;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  workerConcurrency = 5,
  className,
}) => {
  const mainNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: '⌘1',
    },
    {
      id: 'create-campaign' as NavTab,
      label: 'New Campaign',
      icon: <PlusCircle className="w-4 h-4" />,
      shortcut: '⌘2',
      badge: 'Create',
    },
    {
      id: 'campaigns' as NavTab,
      label: 'Campaigns',
      icon: <FolderKanban className="w-4 h-4" />,
      shortcut: '⌘3',
    },
    {
      id: 'emails' as NavTab,
      label: 'Email Logs',
      icon: <Mail className="w-4 h-4" />,
      shortcut: '⌘4',
    },
  ];

  const monitoringItems = [
    {
      id: 'queue' as NavTab,
      label: 'Queue Monitor',
      icon: <Activity className="w-4 h-4" />,
      shortcut: '⌘5',
      badge: 'Live',
    },
  ];

  return (
    <aside
      className={cn(
        'w-64 bg-surface border-r border-border flex flex-col justify-between h-screen sticky top-0 z-30 select-none',
        className
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
                OUTBOX <span className="text-[10px] font-mono font-normal text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">v1.0</span>
              </h1>
              <span className="text-[11px] font-mono text-muted-foreground mt-0.5 block">
                Email Queue Engine
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 flex items-center gap-2">
              <span className="w-3 h-px bg-white/20" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Navigation
              </span>
            </div>

            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm'
                        : 'text-muted-foreground hover:text-slate-200 hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('transition-colors', isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200')}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.shortcut}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Monitoring Navigation */}
          <div>
            <div className="px-3 mb-2 flex items-center gap-2">
              <span className="w-3 h-px bg-white/20" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Telemetry
              </span>
            </div>

            <nav className="space-y-1">
              {monitoringItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm'
                        : 'text-muted-foreground hover:text-slate-200 hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('transition-colors', isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200')}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {item.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Infrastructure Status Footer */}
      <div className="p-4 border-t border-border bg-surface-elevated/40">
        <div className="p-3 bg-background border border-border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Worker Threading
            </span>
            <span className="text-[11px] font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {workerConcurrency} Concurrency
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-border">
            <span className="text-muted-foreground font-mono text-[10px]">Redis BullMQ:</span>
            <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
