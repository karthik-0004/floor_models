'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Download,
  RefreshCcw,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { useFloorPlanStore, FloorPlanJob } from '@/store/use-floor-plan';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/image-upload';
import { cn } from '@/lib/utils';

export function FloorPlanRegenerator() {
  const {
    jobs,
    setJobs,
    updateJob,
    removeJob,
    reset,
  } = useFloorPlanStore();

  const [compareJobId, setCompareJobId] = useState<string | null>(null);
  const progressIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const totalCount = jobs.length;
  const isProcessingBatch = jobs.some((j) => j.status === 'processing');
  const hasPending = jobs.some((j) => j.status === 'pending');
  const errorCount = jobs.filter((j) => j.status === 'error').length;
  const isAllDone = !isProcessingBatch && !hasPending && completedCount > 0;

  useEffect(() => {
    const intervals = progressIntervals.current;
    return () => {
      intervals.forEach(clearInterval);
      intervals.clear();
    };
  }, []);

  const handleFilesReady = useCallback(
    (files: Array<{ fileName: string; base64: string; pageNumber?: number }>) => {
      const newJobs: FloorPlanJob[] = files.map((f) => ({
        id: crypto.randomUUID(),
        fileName: f.fileName,
        originalImage: f.base64,
        generatedImage: null,
        status: 'pending' as const,
        progress: 0,
        statusText: 'Waiting...',
        error: null,
        pageNumber: f.pageNumber,
      }));
      setJobs(newJobs);
    },
    [setJobs]
  );

  const triggerSingleDownload = useCallback((job: FloorPlanJob) => {
    if (!job.generatedImage) return;
    const sanitized = job.fileName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '_');
    const a = document.createElement('a');
    a.href = job.generatedImage;
    a.download = `generated_${sanitized}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const compareJob = compareJobId ? jobs.find((j) => j.id === compareJobId) ?? null : null;

  const generateSingleJob = useCallback(
    async (job: FloorPlanJob) => {
      updateJob(job.id, { status: 'processing', progress: 10, statusText: 'Analyzing layout...' });

      const interval = setInterval(() => {
        const current = useFloorPlanStore.getState().jobs.find((j) => j.id === job.id);
        if (current && current.progress < 85) {
          const next = Math.min(current.progress + Math.floor(Math.random() * 10), 85);
          updateJob(job.id, { progress: next });
        }
      }, 1200);
      progressIntervals.current.set(job.id, interval);

      try {
        setTimeout(() => {
          updateJob(job.id, { statusText: 'Applying architectural style...' });
        }, 3000);
        setTimeout(() => {
          updateJob(job.id, { statusText: 'Refining details...' });
        }, 6000);

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: job.originalImage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Generation failed');
        }

        clearInterval(interval);
        progressIntervals.current.delete(job.id);

        updateJob(job.id, {
          status: 'completed',
          progress: 100,
          statusText: 'Complete',
          generatedImage: data.results.imageUrl,
        });

      } catch (error: unknown) {
        clearInterval(interval);
        progressIntervals.current.delete(job.id);

        const message = error instanceof Error ? error.message : 'Generation failed';

        updateJob(job.id, {
          status: 'error',
          progress: 0,
          statusText: 'Failed',
          error: message,
        });
      }
    },
    [updateJob]
  );

  const generateBatch = useCallback(async () => {
    const pending = jobs.filter((j) => j.status === 'pending');
    if (pending.length === 0) return;

    const promises = pending.map((job) => generateSingleJob(job));
    await Promise.allSettled(promises);

    const succeeded = useFloorPlanStore.getState().jobs.filter((j) => j.status === 'completed').length;
    const failed = useFloorPlanStore.getState().jobs.filter((j) => j.status === 'error').length;

    if (failed === 0) {
      toast.success(`All ${succeeded} blueprints generated!`);
    } else if (succeeded > 0) {
      toast.warning(`${succeeded} succeeded, ${failed} failed`);
    } else {
      toast.error('All generations failed. Please try again.');
    }
  }, [jobs, generateSingleJob]);

  const downloadAllAsZip = useCallback(async () => {
    const completed = jobs.filter((j) => j.status === 'completed');
    if (completed.length === 0) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const job of completed) {
      if (!job.generatedImage) continue;
      const base64Data = job.generatedImage.split(',')[1];
      const sanitized = job.fileName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '_');
      zip.file(`blueprint_${sanitized}.png`, base64Data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    a.download = `floorplan_blueprints_${ts}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('ZIP downloaded successfully');
  }, [jobs]);

  const retryJob = useCallback(
    (jobId: string) => {
      updateJob(jobId, {
        status: 'pending',
        progress: 0,
        statusText: 'Waiting...',
        error: null,
        generatedImage: null,
      });
      const job = useFloorPlanStore.getState().jobs.find((j) => j.id === jobId);
      if (job) generateSingleJob(job);
    },
    [updateJob, generateSingleJob]
  );

  const retryAll = useCallback(() => {
    const errored = useFloorPlanStore.getState().jobs.filter((j) => j.status === 'error');
    errored.forEach((job) => {
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        statusText: 'Waiting...',
        error: null,
        generatedImage: null,
      });
    });
    const updatedPending = useFloorPlanStore.getState().jobs.filter((j) => j.status === 'pending');
    if (updatedPending.length > 0) {
      Promise.allSettled(updatedPending.map((job) => generateSingleJob(job)));
    }
  }, [updateJob, generateSingleJob]);

  if (jobs.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px]">
        <ImageUpload onFilesReady={handleFilesReady} />
      </div>
    );
  }

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full space-y-5">
      {/* Actions Bar */}
      <div className="flex items-center justify-center gap-3">
        {!isAllDone && !isProcessingBatch && (
          <Button
            onClick={generateBatch}
            disabled={hasPending === false}
            className="h-11 px-8 rounded-[12px] bg-[var(--primary)] hover:bg-[#1f6ced] text-white font-bold transition-all shadow-[0_4px_20px_rgba(43,127,255,0.4)] hover:scale-[1.02] text-[14px]"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate {totalCount} Blueprint{totalCount !== 1 ? 's' : ''}
          </Button>
        )}

        {isProcessingBatch && (
          <Button
            disabled
            className="h-11 px-8 rounded-[12px] bg-[var(--primary)] text-white font-bold text-[14px] opacity-70"
          >
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </Button>
        )}

        {isAllDone && totalCount > 1 && (
          <Button
            onClick={downloadAllAsZip}
            className="h-11 px-8 rounded-[12px] bg-[var(--primary)] hover:bg-[#1f6ced] text-white font-bold transition-all shadow-[0_4px_20px_rgba(43,127,255,0.4)] hover:scale-[1.02] text-[14px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All as ZIP
          </Button>
        )}

        {errorCount > 0 && !isProcessingBatch && (
          <Button
            onClick={retryAll}
            variant="outline"
            className="h-10 px-6 rounded-[12px] border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-bold text-[13px]"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry All Failed ({errorCount})
          </Button>
        )}

        {isAllDone && (
          <Button
            onClick={reset}
            variant="outline"
            className="h-10 px-6 rounded-[12px] border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-bold text-[13px]"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Start New Batch
          </Button>
        )}
      </div>

      {/* Progress Header Bar */}
      {(isProcessingBatch || isAllDone) && (
        <div className="bg-[var(--primary-light)] border border-[var(--border-blue)] rounded-[12px] p-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0 text-center min-w-[60px]">
              <span className="text-[20px] font-bold text-[var(--primary)]">{completedCount}</span>
              <span className="text-[16px] text-[var(--text-muted)]"> / {totalCount}</span>
              <div className="text-[12px] text-[var(--text-muted)]">Blueprints Generated</div>
            </div>

            <div className="flex-1">
              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--primary)] rounded-full"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="text-center text-[12px] text-[var(--text-muted)] mt-1">
                {progressPercent}%
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {isProcessingBatch && (
                <>
                  <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
                  <span className="text-[12px] text-[var(--text-secondary)]">Processing...</span>
                </>
              )}
              {isAllDone && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                  {totalCount >= 1 && (
                    <Button
                      onClick={downloadAllAsZip}
                      size="sm"
                      className="h-8 rounded-[8px] bg-[var(--primary)] hover:bg-[#1f6ced] text-white text-[12px] font-bold"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download {totalCount > 1 ? 'All' : ''}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onDownload={triggerSingleDownload}
            onRetry={retryJob}
            onRemove={removeJob}
            onCompare={setCompareJobId}
            isProcessing={isProcessingBatch}
          />
        ))}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {compareJob && compareJob.generatedImage && (
          <ComparisonModal
            job={compareJob}
            onClose={() => setCompareJobId(null)}
            onDownload={triggerSingleDownload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JobCard({
  job,
  onDownload,
  onRetry,
  onRemove,
  onCompare,
  isProcessing,
}: {
  job: FloorPlanJob;
  onDownload: (job: FloorPlanJob) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onCompare: (id: string | null) => void;
  isProcessing: boolean;
}) {
  const isCompleted = job.status === 'completed' && job.generatedImage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-white border border-[var(--border)] rounded-[14px] overflow-hidden shadow-sm",
        isCompleted && "cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div
        className="relative h-[160px] bg-[var(--background)]"
        onClick={() => isCompleted && onCompare(job.id)}
      >
        <img
          src={job.originalImage}
          alt={job.fileName}
          className="w-full h-full object-cover"
        />
        {job.pageNumber && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[11px] text-[var(--text-secondary)] font-medium px-2 py-0.5 rounded-full border border-[var(--border)]">
            Page {job.pageNumber}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6 pointer-events-none">
          <span className="text-[11px] text-white truncate block font-medium">
            {job.fileName}
          </span>
        </div>
        {job.status === 'pending' && !isProcessing && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(job.id); }}
            className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 rounded-md border border-[var(--border)] transition-colors shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Compare overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="text-white text-[13px] font-bold opacity-0 hover:opacity-100 transition-opacity bg-black/50 px-4 py-2 rounded-full backdrop-blur">
              Click to compare
            </span>
          </div>
        )}
      </div>

      {/* Status Area */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {job.status === 'pending' && (
              <>
                <Clock className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                <span className="text-[12px] text-[var(--text-muted)] font-medium">Waiting</span>
              </>
            )}
            {job.status === 'processing' && (
              <>
                <Loader2 className="w-3.5 h-3.5 shrink-0 text-[var(--primary)] animate-spin" />
                <span className="text-[12px] text-[var(--primary)] font-medium truncate">
                  {job.statusText}
                </span>
              </>
            )}
            {job.status === 'completed' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--success)]" />
                <span className="text-[12px] text-[var(--success)] font-medium">Completed</span>
              </>
            )}
            {job.status === 'error' && (
              <>
                <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span className="text-[11px] text-red-600 truncate" title={job.error || ''}>
                  {job.error && job.error.length > 40 ? `${job.error.slice(0, 40)}...` : job.error}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {job.status === 'completed' && (
              <button
                onClick={() => onDownload(job)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors rounded-md hover:bg-[var(--primary-light)]"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            {job.status === 'error' && (
              <button
                onClick={() => onRetry(job.id)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors rounded-md hover:bg-[var(--primary-light)]"
                title="Retry"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar for processing */}
        {job.status === 'processing' && (
          <div className="mt-2.5 w-full h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              animate={{ width: `${job.progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ComparisonModal({
  job,
  onClose,
  onDownload,
}: {
  job: FloorPlanJob;
  onClose: () => void;
  onDownload: (job: FloorPlanJob) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="bg-white rounded-[20px] max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-[16px] font-bold text-[var(--text-primary)]">
              {job.fileName}
            </h3>
            <p className="text-[12px] text-[var(--text-muted)]">
              Original vs AI-Generated Blueprint
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(job)}
              className="h-9 px-4 rounded-[10px] bg-[var(--primary)] hover:bg-[#1f6ced] text-white text-[13px] font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side-by-side images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-5 flex flex-col items-center">
            <span className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Original Upload
            </span>
            <img
              src={job.originalImage}
              alt="Original"
              className="w-full h-auto max-h-[65vh] object-contain rounded-[10px] border border-[var(--border)]"
            />
          </div>
          <div className="p-5 flex flex-col items-center border-t md:border-t-0 md:border-l border-[var(--border)]">
            <span className="text-[12px] font-bold text-[var(--primary)] uppercase tracking-wider mb-3">
              AI Generated
            </span>
            {job.generatedImage && (
              <img
                src={job.generatedImage}
                alt="Generated"
                className="w-full h-auto max-h-[65vh] object-contain rounded-[10px] border border-[var(--border)]"
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


