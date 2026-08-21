import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Menu, ShieldCheck } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  workerConcurrency?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  workerConcurrency = 5,
}) => {
  const { user } = useUser();

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'System Overview';
      case 'create-campaign':
        return 'Schedule New Campaign';
      case 'campaigns':
        return 'Campaigns';
      case 'emails':
        return 'Email Delivery Log';
      case 'queue':
        return 'BullMQ Queue Telemetry';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">{getTitle()}</h1>
        </div>
      </div>

      {/* Right side user & system badge */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Worker Concurrency: <strong className="text-white">{workerConcurrency}</strong></span>
        </div>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="hidden md:block text-right">
            <span className="text-xs font-medium text-white block leading-tight">
              {user?.fullName || user?.firstName || 'Logged In'}
            </span>
            <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8 rounded-full border border-indigo-500/30',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};
