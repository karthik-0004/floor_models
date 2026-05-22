'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
    
    // Create object URL for instant preview (if image)
    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    } else if (selectedFile.type === 'application/pdf') {
      setPreview('pdf'); // Special marker for PDF
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

    // Read as Base64 in parallel for the actual app to use
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          onUploadComplete(e.target?.result as string);
        }, 500);
      }, 1500); // minimum 1.5s visual feedback
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
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: disabled || isUploading
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative group overflow-hidden flex flex-col items-center justify-center w-full min-h-[350px]",
          "rounded-3xl border-2 border-dashed transition-all duration-300 ease-out",
          isDragActive 
            ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 scale-[1.02]" 
            : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/20 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 backdrop-blur-xl",
          (disabled || isUploading) && "pointer-events-none opacity-80"
        )}
      >
        <input {...getInputProps()} />
        
        {/* Glow effect on drag */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 transition-opacity duration-300 blur-2xl",
          isDragActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        )} />

        <AnimatePresence mode="wait">
          {!file && (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-10 flex flex-col items-center p-6 text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity" />
                <div className="relative p-5 bg-white dark:bg-slate-900 rounded-full shadow-xl shadow-purple-500/10 border border-slate-100 dark:border-slate-800 text-purple-600 dark:text-purple-400 group-hover:-translate-y-1 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Upload your floor plan
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Drag & drop your file here, or click to browse your computer.
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50">
                  <FileImage className="w-3.5 h-3.5" />
                  JPG, PNG, WEBP
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50">
                  <FileText className="w-3.5 h-3.5" />
                  PDF
                </span>
                <span className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
                  Up to 10MB
                </span>
              </div>
            </motion.div>
          )}

          {file && (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-10 w-full p-8 flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative group/preview w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                {preview === 'pdf' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                    <FileText className="w-16 h-16 text-red-400" />
                    <span className="font-medium text-slate-600 dark:text-slate-300">{file.name}</span>
                  </div>
                ) : (
                  <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                )}
                
                {/* Remove Button */}
                {!isUploading && (
                  <button
                    onClick={removeFile}
                    className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md opacity-0 group-hover/preview:opacity-100 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Upload Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <span className="text-white font-medium">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="w-full max-w-sm space-y-2">
                  <Progress value={uploadProgress} className="h-2 w-full" />
                  <p className="text-sm text-center text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                    Processing your floor plan...
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
}
