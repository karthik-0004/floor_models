'use client';

import { FloorPlanRegenerator } from '@/components/floor-plan-regenerator';
import { Layers, Zap, PenTool, LayoutTemplate, ArrowRight, CheckCircle2, DraftingCompass } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Home() {
  const scrollToGenerator = () => {
    document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Dynamic Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-indigo-600/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/40 dark:bg-black/40 border-b border-slate-200/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-purple-600/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              FloorPlan AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">How it Works</a>
          </div>
          <Button onClick={scrollToGenerator} className="rounded-full px-6 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 transition-all">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-sm border border-purple-200 dark:border-purple-800/50 mb-4">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Regeneration Engine v2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Transform Any Floor Plan Into <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 animate-gradient-x">
              Professional Architectural Style
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload rough sketches, handwritten layouts, or old floor plans and regenerate them into clean CAD-style architectural layouts using AI in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              onClick={scrollToGenerator} 
              size="lg" 
              className="rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/20 px-8 py-6 text-lg group w-full sm:w-auto transition-all duration-300 hover:scale-105"
            >
              Start Generating Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 py-6 text-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-900 w-full sm:w-auto"
            >
              View Examples
            </Button>
          </div>
        </motion.div>

        {/* Hero Visual Teaser */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mt-20 w-full max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl p-2 bg-white/20 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 rounded-3xl h-full translate-y-1/2" />
            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video relative flex items-center justify-center">
              {/* Decorative Hero Dashboard Mockup */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
              <div className="z-10 text-center">
                <DraftingCompass className="w-20 h-20 text-white/50 mx-auto mb-4" />
                <p className="text-white/60 font-medium tracking-widest uppercase">AI CAD Blueprint Engine</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* AI Features Section */}
      <section id="features" className="py-24 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Intelligent Layout Recognition
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our advanced AI model understands spatial relationships, doorways, windows, and structural walls from even the roughest sketches.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <PenTool className="w-8 h-8 text-purple-500" />,
                title: "Sketch to CAD",
                desc: "Turn messy hand-drawn scribbles into perfectly straight, precise architectural lines."
              },
              {
                icon: <LayoutTemplate className="w-8 h-8 text-blue-500" />,
                title: "Layout Preservation",
                desc: "Maintains your exact room proportions, connectivity, and original intent without hallucinating."
              },
              {
                icon: <Zap className="w-8 h-8 text-indigo-500" />,
                title: "Lightning Fast",
                desc: "Get your professional grade blueprint back in under 15 seconds. No waiting for manual redrawing."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent rounded-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Generator Section (Upload & Preview & Result) */}
      <section id="generator-section" className="py-24 px-6 z-10 relative bg-slate-100/50 dark:bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Try It Yourself
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Upload an image below to see the magic happen.
            </p>
          </div>
          
          <FloorPlanRegenerator />
          
        </div>
      </section>

      {/* How it Works / Benefits */}
      <section id="how-it-works" className="py-24 px-6 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-purple-900 to-indigo-950 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10 space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The Professional Standard</h2>
                <p className="text-purple-200 max-w-2xl mx-auto text-lg">
                  Designed for real estate agents, architects, and homeowners who need pristine floor plans instantly.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  "Standardized Architectural Symbols",
                  "Perfectly Straight Wall Lines",
                  "Clean Black & White High-Contrast",
                  "Instant High-Resolution Download",
                  "No 3D Artifacts or Hallucinations",
                  "Secure & Private Processing"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    <span className="font-medium text-purple-50">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/50 backdrop-blur-lg z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Layers className="w-5 h-5 text-purple-600" />
            <span className="font-semibold tracking-tight">FloorPlan AI</span>
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} FloorPlan AI. All rights reserved.
          </div>
          
          <div className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
