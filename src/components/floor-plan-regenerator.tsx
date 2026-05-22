'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Download, RefreshCcw, Sparkles } from 'lucide-react';
import { useFloorPlanStore } from '@/store/use-floor-plan';
import { Button } from '@/components/ui/button';
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

  if (!originalImage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px]">
        <ImageUpload onUploadComplete={setOriginalImage} disabled={isGenerating} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      
      {/* TOP ROW: Side-by-Side Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[450px]">
        {/* Left: Original Panel */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[15px] font-bold text-[var(--text-primary)]">Original Upload</span>
            <span className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Input</span>
          </div>
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-[16px] p-4 flex items-center justify-center flex-1 overflow-hidden shadow-inner">
            {originalImage.startsWith('data:application/pdf') ? (
              <div className="text-center p-8">
                <span className="text-6xl mb-4 block">📄</span>
                <span className="text-sm text-[var(--text-secondary)] font-medium">PDF Document</span>
              </div>
            ) : (
              <img 
                src={originalImage} 
                alt="Original" 
                className="max-h-[550px] max-w-full object-contain rounded-[8px]"
              />
            )}
            {!isGenerating && !generatedImage && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={reset} 
                className="absolute top-4 right-4 h-8 px-4 bg-white/90 backdrop-blur hover:bg-white text-[13px] font-medium border border-[var(--border)] shadow-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Change Image
              </Button>
            )}
          </div>
        </div>

        {/* Right: AI Output Panel */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[15px] font-bold text-[var(--text-primary)]">AI Output</span>
            {generatedImage && (
               <span className="text-[12px] text-[var(--success)] font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--success)]" /> Generated Successfully</span>
            )}
          </div>
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-[16px] p-4 flex flex-col items-center justify-center flex-1 overflow-hidden shadow-inner">
            <AnimatePresence mode="wait">
              {!isGenerating && !generatedImage && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[var(--primary-light)] border-2 border-dashed border-[var(--border-blue)] rounded-[12px] w-full h-full flex flex-col items-center justify-center text-center p-6"
                >
                  <Sparkles className="w-[48px] h-[48px] text-[var(--primary)] mb-4" />
                  <p className="text-[18px] text-[var(--text-primary)] font-bold">Ready to generate</p>
                  <p className="text-[14px] text-[var(--text-muted)] mt-1">Configure settings below and click Generate Blueprint</p>
                </motion.div>
              )}

              {isGenerating && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[var(--primary-light)] border-2 border-dashed border-[var(--border-blue)] rounded-[12px] w-full h-full flex flex-col items-center justify-center text-center p-6"
                >
                  <div className="relative mb-6 flex items-center justify-center">
                    <div className="w-24 h-24 border-[4px] border-[var(--border-blue)] rounded-full" />
                    <div className="w-24 h-24 border-[4px] border-transparent border-t-[var(--primary)] rounded-full absolute animate-spin" />
                    <span className="absolute font-bold text-[var(--primary)] text-xl">{progress}%</span>
                  </div>
                  <p className="text-[16px] font-bold text-[var(--primary)]">{statusText}</p>
                </motion.div>
              )}

              {generatedImage && !isGenerating && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center relative"
                >
                  <img 
                    src={generatedImage} 
                    alt="AI Output" 
                    className="max-h-[550px] max-w-full object-contain rounded-[8px] mb-16"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <Button 
                      onClick={() => handleDownload(generatedImage)}
                      className="rounded-full px-6 py-5 shadow-[0_8px_30px_rgba(43,127,255,0.3)] bg-[var(--primary)] hover:bg-[#1f6ced] text-white hover:scale-105 transition-all font-semibold"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Save High-Res PNG
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Settings Panel */}
      <div className="bg-[var(--primary-light)] border border-[var(--border-blue)] rounded-[16px] p-5 md:p-6 mt-2 shrink-0">
        <div className="mb-5 flex items-center justify-between border-b border-[var(--border-blue)] pb-4">
          <div>
            <h3 className="font-bold text-[16px] text-[var(--text-primary)]">Generation Settings</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Configure parameters before regenerating</p>
          </div>
          {generatedImage && (
             <Button 
               variant="outline" 
               onClick={reset}
               className="h-9 px-5 text-[13px] font-semibold border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
             >
               <RefreshCcw className="w-4 h-4 mr-2" />
               Start New Project
             </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-end">
          {/* Style Selector */}
          <div className="lg:col-span-3 space-y-2">
            <Label htmlFor="style" className="text-[13px] font-bold text-[var(--text-primary)]">Output Style</Label>
            <Select value={style} onValueChange={(val) => val && setStyle(val)} disabled={isGenerating}>
              <SelectTrigger id="style" className="w-full bg-white border border-[var(--border)] focus:ring-[var(--primary)] h-[44px] rounded-[10px] font-medium text-[14px]">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAD Blueprint">CAD Blueprint</SelectItem>
                <SelectItem value="Modern Architectural">Modern Architectural</SelectItem>
                <SelectItem value="Technical Drafting">Technical Drafting</SelectItem>
                <SelectItem value="Pharmaceutical Layout">Pharmaceutical Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-4 space-y-2 flex flex-col">
            <Label htmlFor="instructions" className="text-[13px] font-bold text-[var(--text-primary)]">
              Custom Instructions <span className="text-[var(--text-muted)] font-medium">(optional)</span>
            </Label>
            <Textarea 
              id="instructions"
              placeholder="e.g. highlight emergency exits..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isGenerating}
              className="resize-none h-[76px] w-full bg-white border border-[var(--border)] rounded-[10px] focus-visible:ring-[var(--primary)] text-[14px] py-2.5 px-3"
            />
          </div>

          {/* Toggles */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="flex items-center justify-between p-2.5 px-4 rounded-[10px] bg-white border border-[var(--border)] h-[44px]">
              <Label htmlFor="preserve-structure" className="text-[13px] font-bold text-[var(--text-primary)] cursor-pointer">
                Preserve Structure
              </Label>
              <Switch 
                id="preserve-structure" 
                checked={preserveStructure} 
                onCheckedChange={setPreserveStructure}
                disabled={isGenerating}
                className="data-[state=checked]:bg-[var(--primary)] scale-90 origin-right"
              />
            </div>
            <div className="flex items-center justify-between p-2.5 px-4 rounded-[10px] bg-white border border-[var(--border)] h-[44px]">
              <Label htmlFor="enhance-labels" className="text-[13px] font-bold text-[var(--text-primary)] cursor-pointer">
                Enhance Labels
              </Label>
              <Switch 
                id="enhance-labels" 
                checked={enhanceLabels} 
                onCheckedChange={setEnhanceLabels}
                disabled={isGenerating}
                className="data-[state=checked]:bg-[var(--primary)] scale-90 origin-right"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="lg:col-span-2 flex flex-col h-full justify-end">
            <Button 
              onClick={generateFloorPlan} 
              disabled={isGenerating}
              className="w-full h-[44px] lg:h-[100px] rounded-[12px] bg-[var(--primary)] hover:bg-[#1f6ced] text-white font-bold transition-all shadow-[0_4px_20px_rgba(43,127,255,0.4)] disabled:opacity-50 hover:scale-[1.02] text-[15px]"
            >
              {isGenerating ? (
                <div className="flex lg:flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex lg:flex-col items-center justify-center gap-2">
                  <Wand2 className="w-5 h-5 lg:w-7 lg:h-7 lg:mb-1" />
                  <span>Generate AI</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
