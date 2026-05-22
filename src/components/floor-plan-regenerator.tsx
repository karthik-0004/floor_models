'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Download, RefreshCcw, Loader2, Settings2, Sparkles } from 'lucide-react';
import { useFloorPlanStore } from '@/store/use-floor-plan';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/image-upload';

export function FloorPlanRegenerator() {
  const { 
    originalImage, 
    generatedImage, 
    isGenerating, 
    progress,
    statusText,
    style,
    instructions,
    preserveStructure,
    enhanceLabels,
    setOriginalImage, 
    setGeneratedImage,
    setIsGenerating,
    setProgress,
    setStatusText,
    setStyle,
    setInstructions,
    setPreserveStructure,
    setEnhanceLabels,
    reset
  } = useFloorPlanStore();

  const generateFloorPlan = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setProgress(10);
    setStatusText('Analyzing original floor plan layout...');

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 10);
        });
      }, 1000);

      setTimeout(() => setStatusText(`Applying ${style} style...`), 3000);
      setTimeout(() => setStatusText('Refining architectural details...'), 6000);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: originalImage,
          style,
          instructions,
          preserveStructure,
          enhanceLabels
        }),
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate floor plan');
      }

      setProgress(100);
      setStatusText('Complete!');
      setGeneratedImage(data.results.imageUrl);
      const modelTag = data.model ? ` (${data.model})` : '';
toast.success(`Generated via ${data.provider || "AI"}${modelTag}`);
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floorplan-${style.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Upload Section */}
      {!originalImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImageUpload 
            onUploadComplete={setOriginalImage} 
            disabled={isGenerating} 
          />
        </motion.div>
      )}

      {/* Workspace Section */}
      {originalImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Previews Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Original View */}
            <Card className="overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-xl border-slate-200/50 shadow-xl dark:border-slate-800/50 rounded-3xl">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/40 dark:bg-black/40">
                <h3 className="font-medium text-sm text-slate-500 uppercase tracking-wider">Original Input</h3>
                {!isGenerating && !generatedImage && (
                  <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-foreground">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Change
                  </Button>
                )}
              </div>
              <div className="relative aspect-[4/3] bg-slate-50/50 dark:bg-slate-900/50 p-6 flex items-center justify-center">
                {originalImage.startsWith('data:application/pdf') ? (
                   <div className="text-center space-y-4">
                     <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-full inline-block">
                       <span className="text-2xl">📄</span>
                     </div>
                     <p className="text-slate-500 font-medium text-sm">PDF Document Uploaded</p>
                   </div>
                ) : (
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                  />
                )}
              </div>
            </Card>

            {/* Generated View */}
            <Card className="relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-xl border-slate-200/50 shadow-xl dark:border-slate-800/50 rounded-3xl">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/40 dark:bg-black/40">
                <h3 className="font-medium text-sm text-slate-500 uppercase tracking-wider">AI Output</h3>
                {generatedImage && (
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(generatedImage)} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>

              <div className="relative aspect-[4/3] bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6">
                <AnimatePresence mode="wait">
                  {!isGenerating && !generatedImage && (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center text-center space-y-6"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-medium">Ready to Generate</h4>
                      </div>
                    </motion.div>
                  )}

                  {isGenerating && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full max-w-xs space-y-8 flex flex-col items-center"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full animate-pulse" />
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-black shadow-2xl flex items-center justify-center relative z-10 border border-slate-100 dark:border-slate-800">
                          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                        </div>
                      </div>
                      <div className="w-full space-y-3 text-center">
                        <Progress value={progress} className="h-2 w-full bg-slate-100 dark:bg-slate-800" />
                        <p className="text-sm font-medium animate-pulse text-slate-600 dark:text-slate-300">{statusText}</p>
                      </div>
                    </motion.div>
                  )}

                  {generatedImage && !isGenerating && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <img 
                        src={generatedImage} 
                        alt="Generated CAD" 
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-800/50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* AI Controls Panel */}
          {!generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border-slate-200/50 shadow-2xl shadow-purple-500/5 dark:border-slate-800/50 rounded-3xl">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3 bg-white/40 dark:bg-black/20">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">AI Generation Controls</h3>
                </div>
                
                <div className="p-8 grid md:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="style" className="text-slate-700 dark:text-slate-300 font-medium">Output Style</Label>
                      <Select value={style} onValueChange={(val) => val && setStyle(val)} disabled={isGenerating}>
                        <SelectTrigger id="style" className="w-full h-12 bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-purple-500">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                          <SelectItem value="CAD Blueprint">CAD Blueprint</SelectItem>
                          <SelectItem value="Modern Architectural">Modern Architectural</SelectItem>
                          <SelectItem value="Technical Drafting">Technical Drafting</SelectItem>
                          <SelectItem value="Pharmaceutical Layout">Pharmaceutical Layout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="instructions" className="text-slate-700 dark:text-slate-300 font-medium">Additional Instructions</Label>
                      <Textarea 
                        id="instructions"
                        placeholder="e.g., 'Make sure to highlight the emergency exits' or 'Use a minimalist style for the furniture'..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        disabled={isGenerating}
                        className="resize-none min-h-[120px] bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-slate-100 dark:border-slate-800/50 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="preserve-structure" className="text-base font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                            Preserve Exact Structure
                          </Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Prevents the AI from altering original wall lengths and angles.
                          </p>
                        </div>
                        <Switch 
                          id="preserve-structure" 
                          checked={preserveStructure} 
                          onCheckedChange={setPreserveStructure}
                          disabled={isGenerating}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-slate-100 dark:border-slate-800/50 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="enhance-labels" className="text-base font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                            Enhance Labels & Dimensions
                          </Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            AI will attempt to automatically clarify unreadable text.
                          </p>
                        </div>
                        <Switch 
                          id="enhance-labels" 
                          checked={enhanceLabels} 
                          onCheckedChange={setEnhanceLabels}
                          disabled={isGenerating}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={generateFloorPlan} 
                      disabled={isGenerating}
                      size="lg" 
                      className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/20 text-lg group transition-all duration-300 hover:scale-[1.02]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Processing AI Generation...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                          Generate Floor Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Action Footer (When Complete) */}
          {generatedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-4"
            >
              <Button 
                variant="outline" 
                size="lg" 
                onClick={reset}
                className="rounded-full h-12 shadow-sm hover:shadow-md transition-all px-8 border-slate-200 dark:border-slate-800 hover:bg-purple-50 dark:hover:bg-slate-800/80 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Start a New Project
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
