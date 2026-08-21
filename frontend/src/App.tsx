import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { CreateCampaignView } from './components/campaign/CreateCampaignView';
import { CampaignsListView } from './components/campaign/CampaignsListView';
import { EmailsListView } from './components/emails/EmailsListView';
import { QueueMonitorView } from './components/queue/QueueMonitorView';
import { LandingPage } from './components/landing/LandingPage';
import { api } from './services/api';
import { QueueStatus } from './types';
import { Radio, ArrowLeft } from 'lucide-react';

interface AuthenticatedAppProps {
  onViewLandingPage: () => void;
}

function AuthenticatedApp({ onViewLandingPage }: AuthenticatedAppProps) {
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
      activeTab={currentTab}
      onTabChange={handleNavigate}
      workerConcurrency={workerConcurrency}
      onViewLandingPage={onViewLandingPage}
    >
      {renderActiveView()}
    </AppLayout>
  );
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLandingWhenSignedIn, setShowLandingWhenSignedIn] = useState(false);

  return (
    <>
      <SignedOut>
        {showAuthModal ? (
          <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 noise-overlay">
            {/* Back to Landing Page Button */}
            <div className="mb-6 w-full max-w-md flex items-center justify-between">
              <button
                onClick={() => setShowAuthModal(false)}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>
            </div>

            <div className="mb-6 text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-xl shadow-indigo-600/30">
                <Radio className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-1 font-sans">
                Sign in to ReachInbox
              </h2>
              <p className="text-muted-foreground text-xs">
                Access your scheduled campaigns and real-time BullMQ telemetry console.
              </p>
            </div>

            <div className="w-full max-w-md flex justify-center">
              <SignIn
                fallbackRedirectUrl="/"
                signUpFallbackRedirectUrl="/"
              />
            </div>
          </div>
        ) : (
          <LandingPage
            onSignIn={() => setShowAuthModal(true)}
            onGetStarted={() => setShowAuthModal(true)}
          />
        )}
      </SignedOut>

      <SignedIn>
        {showLandingWhenSignedIn ? (
          <LandingPage
            isSignedIn={true}
            onSignIn={() => setShowLandingWhenSignedIn(false)}
            onGetStarted={() => setShowLandingWhenSignedIn(false)}
            onOpenDashboard={() => setShowLandingWhenSignedIn(false)}
          />
        ) : (
          <AuthenticatedApp
            onViewLandingPage={() => setShowLandingWhenSignedIn(true)}
          />
        )}
      </SignedIn>
    </>
  );
}

export default App;
