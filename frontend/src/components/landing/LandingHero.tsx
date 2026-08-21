import React, { useEffect, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { LandingSphere } from './LandingSphere';

const words = ['schedule', 'scale', 'dispatch', 'deliver'];

interface LandingHeroProps {
  onGetStarted: () => void;
  onExploreHowItWorks?: () => void;
  isSignedIn?: boolean;
  onOpenDashboard?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onGetStarted,
  onExploreHowItWorks,
  isSignedIn = false,
  onOpenDashboard,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const marqueeStats = [
    { value: '0 Cron Jobs', label: '100% BullMQ Delayed Queues', tag: 'PERSISTENCE' },
    { value: '5 Workers', label: 'Dedicated Worker Concurrency', tag: 'THROUGHPUT' },
    { value: '1,000+', label: 'Bulk Enqueue Throughput', tag: 'SCALE' },
    { value: '100%', label: 'Ethereal SMTP Live Audit', tag: 'DELIVERY' },
    { value: '< 25ms', label: 'Redis Token-Bucket Latency', tag: 'RATE LIMIT' },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-28 pb-16">
      {/* Animated 2D Canvas Sphere in Background */}
      <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] lg:w-[850px] lg:h-[850px] opacity-45 pointer-events-none select-none">
        <LandingSphere />
      </div>

      {/* Subtle Grid Lines Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        {[...Array(6)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/20"
            style={{ top: `${16.6 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/20"
            style={{ left: `${12.5 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Eyebrow */}
        <div
          className={`mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400">
            <span className="w-8 h-px bg-indigo-500/60" />
            <Zap className="w-3.5 h-3.5" />
            The engine for modern outreach teams
          </span>
        </div>

        {/* Dynamic Rotating Headline with Character Reveal */}
        <div className="mb-8">
          <h1
            className={`text-[clamp(2.75rem,8vw,7.5rem)] font-bold tracking-tight text-white leading-[0.95] font-sans transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="block">The platform</span>
            <span className="block text-slate-100">
              to{' '}
              <span className="relative inline-block text-indigo-400">
                <span key={wordIndex} className="inline-flex">
                  {words[wordIndex].split('').map((char, i) => (
                    <span
                      key={`${wordIndex}-${i}`}
                      className="inline-block animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-indigo-500/30 rounded-full" />
              </span>
            </span>
          </h1>
        </div>

        {/* Description & CTAs */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-end">
          <p
            className={`text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700 delay-200 font-sans ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Your high-throughput distributed email job scheduler. Seamlessly persist,
            queue, and dispatch bulk campaigns with BullMQ, Redis, and dedicated worker concurrency.
          </p>

          {/* Action CTAs */}
          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {isSignedIn ? (
              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-200 text-[#090a0d] text-xs font-mono uppercase tracking-wider font-bold rounded-full transition-all shadow-xl shadow-white/10 hover:scale-[1.02] group"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider font-bold rounded-full transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] group"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}

            <a
              href="#how-it-works"
              onClick={(e) => {
                if (onExploreHowItWorks) {
                  e.preventDefault();
                  onExploreHowItWorks();
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-surface hover:bg-surface-elevated text-slate-200 text-xs font-mono uppercase tracking-wider font-semibold rounded-full border border-border transition-colors hover:border-white/20"
            >
              <span>Explore Process</span>
            </a>
          </div>
        </div>
      </div>

      {/* Infinite Stats Marquee Ticker: Left to Right (LTR) */}
      <div
        className={`mt-12 pt-8 border-t border-border overflow-hidden select-none transition-all duration-700 delay-500 relative ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Subtle Vignette Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#090a0d] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#090a0d] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-ltr flex gap-12 hover:[animation-play-state:paused]">
          {[...Array(4)].map((_, loopIdx) => (
            <div key={loopIdx} className="flex gap-16 items-center flex-shrink-0">
              {marqueeStats.map((stat, i) => (
                <div key={`${loopIdx}-${i}`} className="flex items-baseline gap-4 hover:opacity-80 transition-opacity">
                  <span className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-sans">
                    {stat.value}
                  </span>
                  <div className="text-xs text-muted-foreground font-sans">
                    <span>{stat.label}</span>
                    <span className="block font-mono text-[10px] text-indigo-400 mt-0.5 uppercase tracking-wider font-semibold">
                      {stat.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
