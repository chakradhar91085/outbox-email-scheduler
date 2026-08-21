import React, { useEffect, useState, useRef } from 'react';

function AnimatedCounter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1800;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return (
    <div ref={ref} className="text-5xl lg:text-7xl font-bold tracking-tight text-white font-sans">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

const metrics = [
  {
    value: 1089,
    suffix: '+',
    prefix: '',
    label: 'Emails enqueued & processed',
    tag: 'SCALE VERIFIED',
  },
  {
    value: 98,
    suffix: '.2%',
    prefix: '',
    label: 'SMTP delivery success rate',
    tag: 'LIVE AUDIT',
  },
  {
    value: 5,
    suffix: ' threads',
    prefix: '',
    label: 'Dedicated worker concurrency',
    tag: 'THROUGHPUT',
  },
  {
    value: 0,
    suffix: ' jobs',
    prefix: '',
    label: 'Cron jobs required (100% BullMQ)',
    tag: 'ARCHITECTURE',
  },
];

export const LandingMetrics: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="metrics" ref={sectionRef} className="relative py-24 lg:py-32 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16 lg:mb-20">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4">
              <span className="w-8 h-px bg-indigo-500/60" />
              Live Telemetry
            </span>
            <h2
              className={`text-4xl lg:text-6xl font-bold tracking-tight text-white transition-all duration-700 font-sans ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Performance you
              <br />
              <span className="text-muted-foreground font-light">can measure.</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground bg-surface border border-border px-4 py-2 rounded-xl">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Engine
            </span>
            <span className="text-white/20">|</span>
            <span className="text-slate-300">{time.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Metrics Grid with Split-Border Pattern */}
        <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="p-8 lg:p-10 space-y-4 hover:bg-white/[0.015] transition-colors"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block">
                  {metric.tag}
                </span>

                <AnimatedCounter
                  end={metric.value}
                  suffix={metric.suffix}
                  prefix={metric.prefix}
                />

                <div className="text-xs sm:text-sm text-muted-foreground font-sans">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
