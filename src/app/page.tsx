'use client';

import { FloorPlanRegenerator } from '@/components/floor-plan-regenerator';
import { Layers } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col font-sans relative bg-[var(--background)]">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none -z-10" />

      {/* Minimal Navbar */}
      <nav className="h-[56px] px-6 md:px-[32px] flex items-center justify-between z-50 w-full shrink-0 border-b border-[var(--border)] bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-bold text-[var(--text-primary)] tracking-tight">FloorPlan AI</span>
        </div>
        <div className="px-3 py-1 bg-[var(--primary-light)] rounded-full border border-[var(--border-blue)]">
          <span className="text-xs font-semibold text-[var(--primary)]">gpt-image-2</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 w-full max-w-[1600px] mx-auto z-10 h-full">
        {/* Header Text */}
        <div className="text-center mb-6 mt-2 w-full">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mb-2">
            Transform Your Floor Plans
          </h1>
          <p className="text-[14px] md:text-[15px] text-[var(--text-secondary)]">
            Upload any sketch and get a clean CAD layout instantly.
          </p>
        </div>

        {/* WORKSPACE CARD */}
        <div className="w-full bg-white border border-[var(--border)] rounded-[20px] p-4 md:p-6 shadow-[0_8px_32px_rgba(43,127,255,0.06)] flex-1 flex flex-col min-h-0">
          <FloorPlanRegenerator />
        </div>

      </div>
    </main>
  );
}
