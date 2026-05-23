'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Loader2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileEntry {
  id: string;
  fileName: string;
  base64: string;
  pageNumber?: number;
}

interface ImageUploadProps {
  onFilesReady: (files: Array<{ fileName: string; base64: string; pageNumber?: number }>) => void;
  disabled?: boolean;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function extractPdfPages(file: File): Promise<FileEntry[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const MAX_PAGES = 20;
  if (totalPages > MAX_PAGES) {
    toast.warning(`PDF has ${totalPages} pages. Processing first ${MAX_PAGES} only.`);
  }

  const pagesToProcess = Math.min(totalPages, MAX_PAGES);
  const entries: FileEntry[] = [];
  const pdfName = file.name.replace(/\.pdf$/i, '');

  for (let i = 1; i <= pagesToProcess; i++) {
    let page: any;
    try {
      page = await pdf.getPage(i);
    } catch (pageErr: unknown) {
      const msg = pageErr instanceof Error ? pageErr.message : 'Unknown error';
      console.error(`Failed to get PDF page ${i}:`, pageErr);
      throw new Error(`Failed to read page ${i}: ${msg}`);
    }

    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    try {
      await page.render({ canvas, viewport }).promise;
    } catch (renderErr: unknown) {
      const msg = renderErr instanceof Error ? renderErr.message : 'Unknown error';
      console.error(`Failed to render PDF page ${i}:`, renderErr);
      throw new Error(`Failed to render page ${i}: ${msg}`);
    }

    const base64 = canvas.toDataURL('image/jpeg', 0.92);

    entries.push({
      id: crypto.randomUUID(),
      fileName: `${pdfName}_page${i}.jpg`,
      base64,
      pageNumber: i,
    });
  }

  return entries;
}

export function ImageUpload({ onFilesReady, disabled = false }: ImageUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setIsProcessing(true);
    setEntries([]);

    const imageFiles = acceptedFiles.filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name)
    );
    const pdfFiles = acceptedFiles.filter(
      (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    );
    // Remove any duplicates caught by both filters
    const pdfNames = new Set(pdfFiles.map((f) => f.name));
    const dedupedImages = imageFiles.filter((f) => !pdfNames.has(f.name));

    const total = dedupedImages.length + pdfFiles.length;
    setTotalToProcess(total);
    let processed = 0;
    const result: FileEntry[] = [];

    for (const file of dedupedImages) {
      try {
        const base64 = await readFileAsBase64(file);
        result.push({ id: crypto.randomUUID(), fileName: file.name, base64 });
        processed++;
        setProcessedCount(processed);
        setProcessingText(`Reading files... (${processed}/${total})`);
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    for (const file of pdfFiles) {
      try {
        setProcessingText('Extracting pages from PDF...');
        const pdfEntries = await extractPdfPages(file);
        result.push(...pdfEntries);
        processed++;
        setProcessedCount(processed);
        setProcessingText(`Reading files... (${processed}/${total})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to process PDF ${file.name}: ${message}`);
      }
    }

    setIsProcessing(false);

    if (result.length === 0) {
      setError('No valid images could be processed.');
      toast.error('No valid images found');
      return;
    }

    setEntries(result);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const code = rejection.errors[0]?.code;
        if (code === 'file-too-large') {
          setError('File size must be less than 50MB.');
          toast.error('File too large');
        } else if (code === 'file-invalid-type') {
          setError('Invalid format. Please upload JPG, PNG, WEBP, or PDF.');
          toast.error('Invalid file format');
        } else if (code === 'too-many-files') {
          setError('Maximum 20 files allowed.');
          toast.error('Too many files');
        } else {
          setError(rejection.errors[0]?.message || 'Upload failed.');
        }
        return;
      }

      if (acceptedFiles.length === 0) return;
      processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024,
    multiple: true,
    disabled: disabled || isProcessing,
  });

  const handleRemove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAll = () => {
    setEntries([]);
    setError(null);
  };

  const handleContinue = () => {
    if (entries.length === 0) return;
    onFilesReady(entries.map(({ fileName, base64, pageNumber }) => ({ fileName, base64, pageNumber })));
  };

  if (entries.length > 0) {
    const maxVisible = 8;
    const visibleEntries = entries.slice(0, maxVisible);
    const extra = entries.length - maxVisible;

    return (
      <div className="w-full">
        <div className="rounded-[16px] border-2 border-[var(--border-blue)] bg-[var(--primary-light)] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] font-bold text-[var(--text-primary)]">
              {entries.length} image{entries.length !== 1 ? 's' : ''} ready
            </span>
            <button
              onClick={handleClearAll}
              className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {visibleEntries.map((entry) => (
              <div key={entry.id} className="relative group aspect-square rounded-[10px] overflow-hidden bg-white border border-[var(--border)]">
                {entry.base64 ? (
                  <img
                    src={entry.base64}
                    alt={entry.fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <FileText className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                )}
                {entry.pageNumber && (
                  <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur text-[11px] text-[var(--text-secondary)] font-medium px-2 py-0.5 rounded-full border border-[var(--border)]">
                    Page {entry.pageNumber}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-5">
                  <span className="text-[11px] text-white truncate block">
                    {entry.fileName}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-white/80 backdrop-blur hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 rounded-md border border-[var(--border)] transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {extra > 0 && (
              <div className="aspect-square rounded-[10px] bg-[var(--primary-light)] border-2 border-dashed border-[var(--border-blue)] flex items-center justify-center">
                <span className="text-[var(--primary)] font-bold text-[18px]">
                  +{extra} more
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={handleContinue}
              disabled={disabled}
              className="h-11 px-8 rounded-[12px] bg-[var(--primary)] hover:bg-[#1f6ced] text-white font-bold transition-all shadow-[0_4px_20px_rgba(43,127,255,0.4)] hover:scale-[1.02] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate {entries.length} Blueprint{entries.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative group overflow-hidden flex flex-col items-center justify-center w-full min-h-[280px]',
          'rounded-[16px] transition-all duration-200 ease-out',
          error
            ? 'border border-[#FCA5A5] bg-[#FFF1F1]'
            : isDragActive
              ? 'border-2 border-dashed border-[var(--primary)] bg-[#e1edff] scale-[1.01]'
              : 'border-2 border-dashed border-[var(--border-blue)] bg-[var(--primary-light)] hover:border-[var(--primary)]',
          (disabled || isProcessing) && 'pointer-events-none'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {!isProcessing && !error && (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <UploadCloud
                className={cn(
                  'w-[48px] h-[48px] text-[var(--primary)] mb-4 transition-transform',
                  isDragActive && 'animate-pulse scale-110'
                )}
              />
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-1">
                Drop your floor plans here
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] mb-6">
                or click to browse
              </p>

              <div className="flex gap-2 mb-2">
                {['JPG', 'PNG', 'WEBP', 'PDF'].map((ext) => (
                  <span
                    key={ext}
                    className="bg-white border border-[var(--border)] rounded-full px-3 py-1 text-[12px] text-[var(--text-secondary)] font-medium"
                  >
                    {ext}
                  </span>
                ))}
              </div>
              <span className="text-[12px] text-[var(--text-muted)]">
                Up to 50MB &middot; Multi-page PDF supported
              </span>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin mb-4" />
              <p className="text-[15px] font-bold text-[var(--text-primary)]">
                {processingText || 'Processing files...'}
              </p>
              {totalToProcess > 0 && (
                <p className="text-[12px] text-[var(--text-muted)] mt-1">
                  Processed {processedCount} of {totalToProcess} file{totalToProcess !== 1 ? 's' : ''}
                </p>
              )}
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
              <p className="text-[15px] font-bold text-[var(--text-primary)] mb-2">
                Upload Error
              </p>
              <p className="text-[13px] text-red-600 text-center max-w-[300px]">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-[#DC2626] text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
