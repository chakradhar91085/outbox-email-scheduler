import React, { useState, useEffect } from 'react';
import { Radio, ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LandingNavigationProps {
  onSignIn: () => void;
  onGetStarted: () => void;
  isSignedIn?: boolean;
  onOpenDashboard?: () => void;
}

export const LandingNavigation: React.FC<LandingNavigationProps> = ({
  onSignIn,
  onGetStarted,
  isSignedIn = false,
  onOpenDashboard,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Capabilities', href: '#features' },
    { label: 'Process', href: '#how-it-works' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Live Metrics', href: '#metrics' },
    { label: 'Tech Stack', href: '#tech-stack' },
    { label: 'Developers', href: '#developers' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#090a0d]/85 backdrop-blur-md border-b border-border/80 py-3.5 shadow-lg shadow-black/20'
          : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-none flex items-center gap-2 font-sans">
              <span>REACHINBOX</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                SCHEDULER
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">
              Distributed Outreach Engine
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-200 text-[#090a0d] text-xs font-mono uppercase tracking-wider font-semibold transition-all hover:scale-[1.02] shadow-md shadow-white/10"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={onSignIn}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-indigo-600/30"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-white py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-border flex flex-col gap-2.5">
            {isSignedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDashboard?.();
                }}
                className="w-full py-2.5 rounded-xl bg-white text-[#090a0d] text-xs font-mono uppercase tracking-wider font-semibold"
              >
                Open Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignIn();
                  }}
                  className="w-full py-2 rounded-xl bg-surface-elevated text-white text-xs font-mono uppercase tracking-wider"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStarted();
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-mono uppercase tracking-wider font-semibold"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
