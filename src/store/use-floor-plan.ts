import { create } from 'zustand';

export interface FloorPlanJob {
  id: string;
  fileName: string;
  originalImage: string;
  generatedImage: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  statusText: string;
  error: string | null;
  pageNumber?: number;
}

interface FloorPlanState {
  jobs: FloorPlanJob[];
  setJobs: (jobs: FloorPlanJob[]) => void;
  updateJob: (id: string, updates: Partial<FloorPlanJob>) => void;
  removeJob: (id: string) => void;
  reset: () => void;
}

export const useFloorPlanStore = create<FloorPlanState>((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  updateJob: (id, updates) => set((state) => ({
    jobs: state.jobs.map((job) =>
      job.id === id ? { ...job, ...updates } : job
    ),
  })),
  removeJob: (id) => set((state) => ({
    jobs: state.jobs.filter((job) => job.id !== id),
  })),
  reset: () => set({ jobs: [] }),
}));
