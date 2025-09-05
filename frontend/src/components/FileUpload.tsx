import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Toast imports removed - toasts can interfere with modal behavior
import { cn } from "@/lib/utils";
import { useCRMTracking } from "@/hooks/use-crm-tracking";

interface FileUploadProps {
  type: 'cv' | 'job_spec';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  existingFile?: { filename: string; id: string };
  onUploadComplete?: () => void;
  disableToasts?: boolean;
}

export default function FileUpload({ 
  type, 
  label, 
  description, 
  icon: Icon, 
  existingFile,
  onUploadComplete,
  disableToasts = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  // Toast functionality removed
  const queryClient = useQueryClient();
  const { trackFeature } = useCRMTracking();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Starting file upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      

      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      try {
        console.log("Making API request to /api/documents");
        const response = await apiRequest('POST', '/api/documents', formData);
        console.log("Response received:", response.status, response.statusText);
        const result = await response.json();
        console.log("Upload successful:", result);
        return result;
      } catch (error) {
        console.error("Upload error details:", {
          message: (error as any)?.message,
          stack: (error as any)?.stack,
          name: (error as any)?.name,
          error: error
        });
        
        // Re-throw with a more descriptive error
        if ((error as any)?.message) {
          throw new Error(`Upload failed: ${(error as any).message}`);
        } else {
          throw new Error('Upload failed: Unknown error occurred');
        }
      }
    },
    onSuccess: (data) => {
      console.log("FileUpload: Upload mutation success for", type, ":", data);
      console.log("FileUpload: About to invalidate queries and call onUploadComplete");
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      console.log("FileUpload: Query invalidation completed, calling onUploadComplete");
      onUploadComplete?.();
      console.log("FileUpload: onUploadComplete called");
      
      // Track successful file upload in CRM
      trackFeature(`${type}_upload`, { filename: data?.document?.filename });
      
      // Upload success feedback removed to prevent modal interference
    },
    onError: (error: any) => {
      console.error("Upload mutation error:", error);
      const errorMessage = error?.message || error?.toString() || 'Unknown upload error';
      
      // Upload error feedback removed to prevent modal interference
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        uploadMutation.mutate(acceptedFiles[0]);
      }
    },
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0];
      
      // File rejection feedback removed to prevent modal interference
    }
  });

  const removeFile = async () => {
    if (!existingFile?.id) return;
    
    try {
      await apiRequest('DELETE', `/api/documents/${existingFile.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      onUploadComplete?.();
      
      // Track file removal in CRM
      trackFeature(`${type}_removal`, { filename: existingFile.filename });
      
      // File removal feedback removed to prevent modal interference
    } catch (error) {
      // File removal error feedback removed to prevent modal interference
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
      
      {/* Privacy notice for CV uploads */}
      {type === 'cv' && (
        <div className="mb-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-amber-800 font-medium">Privacy Protection</p>
              <p className="text-xs text-amber-700 mt-1">
                Please remove personal details (name, address, phone, PPS number) from your CV before uploading. 
                Our AI only needs your professional experience and skills for effective analysis.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {existingFile ? (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 transition-all duration-300 hover:shadow-md group">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-purple-600 animate-pulse" />
            <span className="text-sm font-medium text-purple-800 group-hover:text-pink-600 transition-colors duration-200">{existingFile.filename}</span>
            <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">✓ Ready</span>
          </div>
          <button
            onClick={removeFile}
            className="text-neutral-400 hover:text-red-500 hover:scale-110 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden",
            isDragActive ? "border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 scale-105 shadow-lg" : "border-purple-300 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50",
            uploadMutation.isPending && "opacity-75 pointer-events-none"
          )}
        >
          <input {...getInputProps()} />
          
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 transform -skew-x-12"></div>
          </div>
          
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center space-y-3 relative z-10">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-purple-200 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Processing your document...</p>
                <div className="w-32 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-neutral-500">✨ AI is analyzing your content</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 relative z-10">
              <Icon className={cn(
                "w-10 h-10 transition-all duration-300",
                isDragActive ? "text-purple-600 scale-125 animate-bounce" : "text-purple-400 group-hover:text-purple-600 group-hover:scale-110"
              )} />
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-200">
                  {isDragActive ? "✨ Drop your file here!" : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-purple-500 group-hover:text-purple-600 transition-colors duration-200">{description}</p>
                <p className="text-xs text-purple-400">Supports PDF, DOC, DOCX (Max 5MB)</p>
                
                {/* Encouraging message that appears on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  <p className="text-xs text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full inline-block">
                    🎯 {type === 'cv' ? 'Your career story awaits!' : 'Perfect job match incoming!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
