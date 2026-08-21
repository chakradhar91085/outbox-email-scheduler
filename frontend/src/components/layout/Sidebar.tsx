import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Mail,
  Activity,
  Zap,
  Server,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'create-campaign' | 'campaigns' | 'emails' | 'queue';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'System overview & metrics',
    },
    {
      id: 'create-campaign' as NavTab,
      label: 'Create Campaign',
      icon: <PlusCircle className="w-5 h-5" />,
      description: 'CSV upload & scheduling',
    },
    {
      id: 'campaigns' as NavTab,
      label: 'Campaigns',
      icon: <FolderKanban className="w-5 h-5" />,
      description: 'All scheduled campaigns',
    },
    {
      id: 'emails' as NavTab,
      label: 'Emails',
      icon: <Mail className="w-5 h-5" />,
      description: 'Sent, pending & failed logs',
    },
    {
      id: 'queue' as NavTab,
      label: 'Queue Monitor',
      icon: <Activity className="w-5 h-5" />,
      description: 'Live BullMQ telemetry',
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base block leading-none">
                ReachInbox
              </span>
              <span className="text-[11px] font-medium text-slate-400 block mt-1 tracking-wider uppercase">
                Email Scheduler
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info badge */}
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                BullMQ + Ethereal SMTP
              </span>
              <span className="text-[11px] text-slate-500 block truncate flex items-center gap-1">
                <Server className="w-3 h-3" /> Redis + Postgres
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
