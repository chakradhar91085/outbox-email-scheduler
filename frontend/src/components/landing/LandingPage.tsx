import React from 'react';
import { LandingNavigation } from './LandingNavigation';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingArchitecture } from './LandingArchitecture';
import { LandingMetrics } from './LandingMetrics';
import { LandingTechStack } from './LandingTechStack';
import { LandingDevelopers } from './LandingDevelopers';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
  isSignedIn?: boolean;
  onOpenDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onGetStarted,
  isSignedIn = false,
  onOpenDashboard,
}) => {
  return (
    <div className="min-h-screen bg-[#090a0d] text-foreground noise-overlay overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <LandingNavigation
        onSignIn={onSignIn}
        onGetStarted={onGetStarted}
        isSignedIn={isSignedIn}
        onOpenDashboard={onOpenDashboard}
      />

      <main>
        <LandingHero
          onGetStarted={onGetStarted}
          isSignedIn={isSignedIn}
          onOpenDashboard={onOpenDashboard}
        />

        <LandingFeatures />

        <LandingHowItWorks />

        <LandingArchitecture />

        <LandingMetrics />

        <LandingTechStack />

        <LandingDevelopers />

        <LandingCTA
          onGetStarted={onGetStarted}
          isSignedIn={isSignedIn}
          onOpenDashboard={onOpenDashboard}
        />
      </main>

      <LandingFooter />
    </div>
  );
};
