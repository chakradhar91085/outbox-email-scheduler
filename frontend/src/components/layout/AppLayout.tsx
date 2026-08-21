import React from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: React.ReactNode;
  workerConcurrency?: number;
  onViewLandingPage?: () => void;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  workerConcurrency = 5,
  onViewLandingPage,
  className,
}) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground noise-overlay">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        workerConcurrency={workerConcurrency}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          workerConcurrency={workerConcurrency}
          onViewLandingPage={onViewLandingPage}
        />

        <main className={cn('flex-1 p-6 lg:p-10 max-w-[1500px] w-full mx-auto space-y-8', className)}>
          {children}
        </main>
      </div>
    </div>
  );
};
