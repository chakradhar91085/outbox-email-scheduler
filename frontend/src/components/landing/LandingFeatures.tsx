import React, { useEffect, useState, useRef } from 'react';

interface FeatureItem {
  number: string;
  title: string;
  description: string;
  visual: 'queue' | 'workers' | 'ratelimit' | 'telemetry';
}

const features: FeatureItem[] = [
  {
    number: '01',
    title: 'Persistent Delayed Scheduling',
    description:
      'Zero cron dependencies. Every email is registered as an immutable delayed job in Redis via BullMQ, guaranteeing delivery even after server restarts or network partitions.',
    visual: 'queue',
  },
  {
    number: '02',
    title: 'Dedicated Worker Concurrency',
    description:
      'Multi-threaded workers consume jobs in parallel without bottlenecking the API server. Configurable concurrency scales to thousands of queued recipients seamlessly.',
    visual: 'workers',
  },
  {
    number: '03',
    title: 'Per-Sender Rate Limiting',
    description:
      'Atomic Redis Lua token-bucket algorithm enforces per-sender hourly limits across multiple worker instances, automatically rescheduling excess emails into the next valid window.',
    visual: 'ratelimit',
  },
  {
    number: '04',
    title: 'CSV Parsing & Live Telemetry',
    description:
      'Drag-and-drop CSV lead parsing with auto-column detection, staggered interval math, and real-time delivery tracking with live polling and native error inspection.',
    visual: 'telemetry',
  },
];

function QueueVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-indigo-400">
      {/* Queue slots */}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={30 + i * 36}
          y="60"
          width="28"
          height="40"
          rx="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="transition-all"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.3;0.9;0.3"
            dur="2s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
        </rect>
      ))}

      {/* Delayed Job Indicator */}
      <circle cx="44" cy="80" r="5" fill="currentColor">
        <animate
          attributeName="cx"
          values="44;80;116;152"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Redis Persistence Label */}
      <text
        x="100"
        y="125"
        textAnchor="middle"
        fontSize="10"
        fontFamily="monospace"
        fill="currentColor"
        opacity="0.6"
      >
        REDIS PERSISTENCE
      </text>
    </svg>
  );
}

function WorkerVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-indigo-400">
      {/* Central Dispatcher */}
      <circle cx="100" cy="80" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="80" r="6" fill="currentColor" />

      {/* 5 Concurrent Worker Nodes */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const radius = 48;
        const x = 100 + Math.cos(angle) * radius;
        const y = 80 + Math.sin(angle) * radius;
        return (
          <g key={i}>
            <line
              x1="100"
              y1="80"
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-6"
                dur="1s"
                repeatCount="indefinite"
              />
            </line>
            <circle cx={x} cy={y} r="8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <animate
                attributeName="r"
                values="7;9;7"
                dur="2s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

function RateLimitVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-indigo-400">
      {/* Token Bucket Shield */}
      <path
        d="M 100 25 L 145 45 L 145 90 Q 145 125 100 140 Q 55 125 55 90 L 55 45 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M 100 40 L 132 54 L 132 88 Q 132 114 100 126 Q 68 114 68 88 L 68 54 Z"
        fill="currentColor"
        opacity="0.08"
      />

      {/* Lua Script Token Pulse */}
      <circle cx="100" cy="85" r="10" fill="none" stroke="currentColor" strokeWidth="2">
        <animate attributeName="r" values="8;16;8" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <text
        x="100"
        y="88"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="currentColor"
      >
        LUA
      </text>
    </svg>
  );
}

function TelemetryVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-indigo-400">
      {/* Table Frame */}
      <rect x="30" y="35" width="140" height="90" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="60" x2="170" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.4" />

      {/* Rows with animated pulse */}
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <circle cx="48" cy={75 + r * 16} r="3" fill="currentColor">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin={`${r * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1="60"
            y1={75 + r * 16}
            x2="150"
            y2={75 + r * 16}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}

export const LandingFeatures: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32 border-t border-border"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4">
            <span className="w-8 h-px bg-indigo-500/60" />
            Capabilities & Core Architecture
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-bold tracking-tight text-white transition-all duration-700 font-sans ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Everything you need.
            <br />
            <span className="text-muted-foreground font-light">Nothing you don&apos;t.</span>
          </h2>
        </div>

        {/* Features List */}
        <div className="divide-y divide-border">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="py-12 lg:py-16 grid lg:grid-cols-12 gap-8 items-center group transition-colors hover:bg-white/[0.01] px-4 rounded-xl"
            >
              {/* Number */}
              <div className="lg:col-span-1">
                <span className="font-mono text-sm font-bold text-indigo-400">
                  {feature.number}
                </span>
              </div>

              {/* Title & Description */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors font-sans">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans max-w-xl">
                  {feature.description}
                </p>
              </div>

              {/* Animated Visual */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="w-48 h-36 p-4 rounded-2xl bg-surface border border-border group-hover:border-indigo-500/30 transition-all shadow-sm">
                  {feature.visual === 'queue' && <QueueVisual />}
                  {feature.visual === 'workers' && <WorkerVisual />}
                  {feature.visual === 'ratelimit' && <RateLimitVisual />}
                  {feature.visual === 'telemetry' && <TelemetryVisual />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
