import React from 'react';

const technologiesRow1 = [
  { name: 'BullMQ', category: 'Distributed Queue' },
  { name: 'Redis 7', category: 'In-Memory Store' },
  { name: 'PostgreSQL 16', category: 'Relational DB' },
  { name: 'Prisma ORM', category: 'Data Layer' },
  { name: 'TypeScript 5.x', category: 'Type Safety' },
  { name: 'Node.js / Express', category: 'REST API' },
];

const technologiesRow2 = [
  { name: 'Clerk Auth', category: 'Google OAuth' },
  { name: 'Nodemailer', category: 'SMTP Transport' },
  { name: 'Ethereal Email', category: 'Test SMTP' },
  { name: 'Docker Compose', category: 'Infrastructure' },
  { name: 'React + Vite', category: 'Frontend UI' },
  { name: 'Tailwind CSS', category: 'Styling' },
];

export const LandingTechStack: React.FC = () => {
  return (
    <section id="tech-stack" className="py-24 border-t border-border overflow-hidden bg-[#0d0f14] relative">
      {/* Side Fade Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-[#0d0f14] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-[#0d0f14] to-transparent z-10 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mb-12 text-center">
        <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3">
          <span className="w-8 h-px bg-indigo-500/60" />
          Production Stack
          <span className="w-8 h-px bg-indigo-500/60" />
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
          Built with industry-standard technologies.
        </h2>
        <p className="text-xs sm:text-sm font-mono text-muted-foreground mt-2 max-w-lg mx-auto">
          Every component chosen for high throughput, persistence, and reliability under load.
        </p>
      </div>

      {/* Row 1 Marquee: Moving Left to Right (LTR) with Indigo Accent Dots */}
      <div className="overflow-hidden mb-4 select-none">
        <div className="animate-marquee-ltr flex gap-4">
          {[...Array(4)].map((_, loopIdx) => (
            <div key={loopIdx} className="flex gap-4 flex-shrink-0">
              {technologiesRow1.map((tech, i) => (
                <div
                  key={`${loopIdx}-${i}`}
                  className="px-6 py-4 rounded-xl bg-surface border border-border flex items-center gap-3 shadow-sm hover:border-indigo-500/50 hover:bg-surface-elevated transition-all cursor-default"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-white font-sans">{tech.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{tech.category}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 Marquee: Moving Right to Left (RTL) with Emerald Green Accent Dots */}
      <div className="overflow-hidden select-none">
        <div className="animate-marquee-rtl flex gap-4">
          {[...Array(4)].map((_, loopIdx) => (
            <div key={loopIdx} className="flex gap-4 flex-shrink-0">
              {technologiesRow2.map((tech, i) => (
                <div
                  key={`${loopIdx}-${i}`}
                  className="px-6 py-4 rounded-xl bg-surface border border-border flex items-center gap-3 shadow-sm hover:border-emerald-500/50 hover:bg-surface-elevated transition-all cursor-default"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-white font-sans">{tech.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{tech.category}</div>
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
