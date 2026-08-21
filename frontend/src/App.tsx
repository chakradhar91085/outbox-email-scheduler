import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { CreateCampaignView } from './components/campaign/CreateCampaignView';
import { CampaignsListView } from './components/campaign/CampaignsListView';
import { EmailsListView } from './components/emails/EmailsListView';
import { QueueMonitorView } from './components/queue/QueueMonitorView';
import { api } from './services/api';
import { QueueStatus } from './types';
import { Zap } from 'lucide-react';

function AuthenticatedApp() {
  const { getToken } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [workerConcurrency, setWorkerConcurrency] = useState<number>(5);

  // Sync Clerk JWT session token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);

        // Fetch initial queue config for concurrency badge in header
        const queueData: QueueStatus = await api.getQueueStatus(token);
        if (queueData?.workerConcurrency) {
          setWorkerConcurrency(queueData.workerConcurrency);
        }
      } catch (err) {
        console.error('Error fetching auth token / initial queue status:', err);
      }
    };
    fetchToken();
  }, [getToken]);

  const handleNavigate = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab !== 'campaigns') {
      setSelectedCampaignId(null);
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setCurrentTab('campaigns');
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onViewCampaign={handleViewCampaign}
            token={authToken}
          />
        );
      case 'create-campaign':
        return (
          <CreateCampaignView
            onNavigate={handleNavigate}
            onCampaignCreated={handleViewCampaign}
            token={authToken}
          />
        );
      case 'campaigns':
        return (
          <CampaignsListView
            onNavigate={handleNavigate}
            selectedCampaignId={selectedCampaignId}
            onClearSelectedCampaign={() => setSelectedCampaignId(null)}
            token={authToken}
          />
        );
      case 'emails':
        return <EmailsListView token={authToken} />;
      case 'queue':
        return <QueueMonitorView token={authToken} />;
      default:
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onViewCampaign={handleViewCampaign}
            token={authToken}
          />
        );
    }
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={handleNavigate}
      workerConcurrency={workerConcurrency}
    >
      {renderActiveView()}
    </AppLayout>
  );
}

function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
          <div className="mb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-500/25">
              <Zap className="w-7 h-7 fill-current" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              ReachInbox Email Scheduler
            </h1>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Automated delayed outreach, BullMQ persistent queues, and Ethereal SMTP delivery assessment.
            </p>
          </div>

          <div className="w-full flex justify-center">
            <SignIn
              fallbackRedirectUrl="/"
              signUpFallbackRedirectUrl="/"
            />
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </>
  );
}

export default App;
