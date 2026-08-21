import React, { useEffect, useState, useRef } from 'react';
import { Database, Radio, Mail, Lock, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

const nodes = [
  {
    name: 'BullMQ Queue Engine',
    desc: 'Redis 7 persistent delayed job scheduler',
    latency: '< 12ms',
    status: 'All operational',
    icon: <Radio className="w-4 h-4 text-indigo-400" />,
  },
  {
    name: 'PostgreSQL Database',
    desc: 'Prisma ORM schema with atomic transactions',
    latency: '< 18ms',
    status: 'Connected & Synced',
    icon: <Database className="w-4 h-4 text-blue-400" />,
  },
  {
    name: 'Dedicated Worker Process',
    desc: '5 parallel worker threads consuming queue',
    latency: '5 Concurrency',
    status: 'Running Separate Daemon',
    icon: <Cpu className="w-4 h-4 text-emerald-400" />,
  },
  {
    name: 'Nodemailer Pooled SMTP',
    desc: 'Ethereal test transport with burst throttling',
    latency: '< 35ms',
    status: 'Verified & Pooled',
    icon: <Mail className="w-4 h-4 text-amber-400" />,
  },
  {
    name: 'Clerk Google OAuth',
    desc: 'JWT bearer authentication & user profile',
    latency: '< 15ms',
    status: 'Protected Middleware',
    icon: <Lock className="w-4 h-4 text-purple-400" />,
  },
];

export const LandingArchitecture: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeNode, setActiveNode] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % nodes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative py-24 lg:py-32 border-t border-border overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column: Context & Stats */}
          <div
            className={`space-y-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div>
              <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4">
                <span className="w-8 h-px bg-indigo-500/60" />
                Technical Architecture
              </span>
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-white font-sans">
                Persistent by design.
                <br />
                <span className="text-muted-foreground font-light">Scalable by default.</span>
              </h2>
            </div>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans max-w-xl">
              Engineered to survive infrastructure restarts without losing state.
              BullMQ delayed jobs are safely persisted in Redis, while campaign metadata and
              individual dispatch audit trails are stored in PostgreSQL with full ACID guarantees.
            </p>

            {/* Architecture KPI Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-white font-sans">5x</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">Worker Concurrency</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-white font-sans">100%</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">State Persistence</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-white font-sans">&lt;25ms</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">Queue Latency</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Infrastructure Node List */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-elevated">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Active System Topology
                </span>
                <span className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  All Systems Operational
                </span>
              </div>

              {/* Node Items */}
              <div className="divide-y divide-border/60">
                {nodes.map((node, index) => {
                  const isActive = activeNode === index;
                  return (
                    <div
                      key={node.name}
                      className={cn(
                        'px-6 py-4.5 flex items-center justify-between transition-all duration-300',
                        isActive ? 'bg-white/[0.03]' : 'bg-transparent'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'p-2 rounded-lg border transition-colors',
                            isActive
                              ? 'bg-indigo-500/20 border-indigo-500/40'
                              : 'bg-background border-border'
                          )}
                        >
                          {node.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-sans">{node.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{node.desc}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono text-indigo-300 block">{node.latency}</span>
                        <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                          {node.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
