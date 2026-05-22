'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (base64: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ onUploadComplete, disabled = false }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);

    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size must be less than 10MB.');
        toast.error('File too large');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file format. Please upload JPG, PNG, WEBP, or PDF.');
        toast.error('Invalid file format');
      } else {
        setError(rejection.errors[0]?.message || 'File upload failed.');
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    
    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    } else if (selectedFile.type === 'application/pdf') {
      setPreview('pdf');
    }

    simulateUpload(selectedFile);
  }, []);

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          onUploadComplete(e.target?.result as string);
        }, 500);
      }, 1500);
    };
    reader.onerror = () => {
      clearInterval(interval);
      setIsUploading(false);
      setError('Failed to read file.');
      setFile(null);
      setPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview && preview !== 'pdf') URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setUploadProgress(0);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: disabled || isUploading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative group overflow-hidden flex flex-col items-center justify-center w-full min-h-[280px]",
          "rounded-[16px] transition-all duration-200 ease-out",
          error ? "border border-[#FCA5A5] bg-[#FFF1F1]" :
          isDragActive 
            ? "border-2 border-dashed border-[var(--primary)] bg-[#e1edff] scale-[1.01]" 
            : "border-2 border-dashed border-[var(--border-blue)] bg-[var(--primary-light)] hover:border-[var(--primary)]",
          (disabled || isUploading) && "pointer-events-none"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {!file && (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <UploadCloud 
                className={cn(
                  "w-[48px] h-[48px] text-[var(--primary)] mb-4 transition-transform",
                  isDragActive && "animate-pulse scale-110"
                )} 
              />
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-1">
                Drop your floor plan here
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] mb-6">
                or click to browse
              </p>

              <div className="flex gap-2 mb-2">
                {['JPG', 'PNG', 'PDF'].map(ext => (
                  <span key={ext} className="bg-white border border-[var(--border)] rounded-full px-3 py-1 text-[12px] text-[var(--text-secondary)] font-medium">
                    {ext}
                  </span>
                ))}
              </div>
              <span className="text-[12px] text-[var(--text-muted)]">
                Up to 10MB
              </span>
            </motion.div>
          )}

          {file && (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center justify-center p-6"
            >
              <div className="relative bg-white border border-[var(--border)] p-2 rounded-[12px] shadow-sm mb-3">
                {preview === 'pdf' ? (
                  <div className="w-[200px] h-[150px] flex items-center justify-center bg-slate-50 rounded-lg">
                    <span className="text-4xl">📄</span>
                  </div>
                ) : (
                  <img 
                    src={preview!} 
                    alt="Preview" 
                    className="max-h-[200px] rounded-lg object-contain" 
                  />
                )}
                
                {!isUploading && (
                  <button
                    onClick={removeFile}
                    className="absolute top-3 right-3 p-1 bg-white/80 backdrop-blur hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 rounded-md border border-[var(--border)] transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <span className="text-[12px] text-[var(--text-muted)] truncate max-w-[200px] mb-3">
                {file.name}
              </span>

              {isUploading && (
                <div className="w-[200px] h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[var(--primary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              )}
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
