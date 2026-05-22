import { create } from 'zustand';

interface FloorPlanState {
  originalImage: string | null;
  generatedImage: string | null;
  description: string | null;
  isGenerating: boolean;
  progress: number;
  statusText: string;
  style: string;
  instructions: string;
  preserveStructure: boolean;
  enhanceLabels: boolean;
  setOriginalImage: (image: string | null) => void;
  setGeneratedImage: (image: string | null) => void;
  setDescription: (description: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: number | ((prev: number) => number)) => void;
  setStatusText: (statusText: string) => void;
  setStyle: (style: string) => void;
  setInstructions: (instructions: string) => void;
  setPreserveStructure: (preserve: boolean) => void;
  setEnhanceLabels: (enhance: boolean) => void;
  reset: () => void;
}

export const useFloorPlanStore = create<FloorPlanState>((set) => ({
  originalImage: null,
  generatedImage: null,
  description: null,
  isGenerating: false,
  progress: 0,
  statusText: '',
  style: 'CAD Blueprint',
  instructions: '',
  preserveStructure: true,
  enhanceLabels: true,
  setOriginalImage: (image) => set({ originalImage: image }),
  setGeneratedImage: (image) => set({ generatedImage: image }),
  setDescription: (description) => set({ description }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setProgress: (progress) => set((state) => ({ progress: typeof progress === 'function' ? progress(state.progress) : progress })),
  setStatusText: (statusText) => set({ statusText }),
  setStyle: (style) => set({ style }),
  setInstructions: (instructions) => set({ instructions }),
  setPreserveStructure: (preserveStructure) => set({ preserveStructure }),
  setEnhanceLabels: (enhanceLabels) => set({ enhanceLabels }),
  reset: () => set({
    originalImage: null,
    generatedImage: null,
    description: null,
    isGenerating: false,
    progress: 0,
    statusText: '',
    style: 'CAD Blueprint',
    instructions: '',
    preserveStructure: true,
    enhanceLabels: true,
  })
}));
