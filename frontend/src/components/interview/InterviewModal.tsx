import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCRMTracking } from "@/hooks/use-crm-tracking";
import LoadingAnimation from "../LoadingAnimation";
import { ArrowRight, PlayCircle, X } from "lucide-react";
import { getGradeById, getQuestionCountForGrade } from "@/lib/gradeConfiguration";

// Import child components
import DocumentUploadSection from "./DocumentUploadSection";
import FrameworkSelector from "./FrameworkSelector";
import GradeSelector from "./GradeSelector";

interface InterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InterviewModal({ open, onOpenChange }: InterviewModalProps) {
  const [cvDocument, setCvDocument] = useState<any>(null);
  const [jobSpecDocument, setJobSpecDocument] = useState<any>(null);
  const [framework, setFramework] = useState<'old' | 'new'>('old');
  const [grade, setGrade] = useState<string>('heo');
  const [, navigate] = useLocation();
  const { trackFeature } = useCRMTracking();

  // Fetch existing documents
  const { data: documents = [], isLoading: documentsLoading, isFetching: documentsFetching } = useQuery({
    queryKey: ['/api/documents'],
    enabled: open,
  });

  // Update local state when documents are fetched
  useEffect(() => {
    console.log('NewInterviewModal: Documents effect triggered, documents:', documents);
    
    // Type-safe document access
    const docsArray = Array.isArray(documents) ? documents : [];
    
    if (docsArray.length > 0) {
      const cv = docsArray.find((doc: any) => doc.type === 'cv');
      const jobSpec = docsArray.find((doc: any) => doc.type === 'job_spec');
      console.log('NewInterviewModal: Setting documents - CV:', cv, 'JobSpec:', jobSpec);
      setCvDocument(cv);
      setJobSpecDocument(jobSpec);
    } else if (!documentsLoading && !documentsFetching) {
      console.log('NewInterviewModal: No documents found and not loading, clearing local state');
      setCvDocument(null);
      setJobSpecDocument(null);
    }
  }, [documents, documentsLoading, documentsFetching]);

  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('Starting interview creation process...');
        
        // Always analyze CV before starting interview (since analysis might not exist)
        console.log('Starting CV analysis...');
        try {
          await apiRequest('POST', '/api/cv/analyze');
          console.log('CV analysis completed successfully');
        } catch (analysisError) {
          console.error('CV analysis failed:', analysisError);
          throw new Error('CV analysis failed. Please try again.');
        }
        
        console.log('Starting practice session with params:', {
          sessionType: 'full',
          questionCount: getQuestionCountForGrade(grade),
          framework: framework,
          grade: grade
        });
        
        // Then start the practice session
        const response = await apiRequest('POST', '/api/practice/start', {
          sessionType: 'full',
          questionCount: getQuestionCountForGrade(grade),
          framework: framework,
          grade: grade
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Practice session started successfully:', data);
        return data;
      } catch (error) {
        console.error('Error in startInterviewMutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Interview creation successful, data:', data);
      console.log('Full response structure:', JSON.stringify(data, null, 2));
      
      // Extract interview ID from the response
      const interviewId = data.interview?.id;
      
      console.log('Extracted interview ID:', interviewId);
      console.log('Interview object:', data.interview);
      
      if (interviewId) {
        // Track the interview creation
        trackFeature('interview_started', {
          grade: grade,
          framework: framework,
          hasJobSpec: !!jobSpecDocument
        });
        
        // Navigate to the interview page immediately 
        console.log('Navigating to interview page with interviewId:', interviewId);
        navigate(`/app/interview/${interviewId}`);
      } else {
        console.error('No interview ID received in response');
        // onOpenChange(false);
      }
    },
    onError: (error: any) => {
      console.error('Interview creation failed:', error);
      // Toast replaced with console logging
      console.log('Failed to start interview', error.message);
      
      // Only close modal on error
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    },
  });

  const handleStartInterview = () => {
    trackFeature('interview_creation_attempt', {
      hasCv: !!cvDocument,
      hasJobSpec: !!jobSpecDocument,
      grade: grade,
      framework: framework
    });
    
    startInterviewMutation.mutate();
  };

  const gradeConfig = getGradeById(grade);
  const questionCount = getQuestionCountForGrade(grade);

  return (
    <Dialog open={open} onOpenChange={startInterviewMutation.isPending ? () => {} : onOpenChange}>
      <DialogContent className={`${
        startInterviewMutation.isPending 
          ? "sm:max-w-[900px] w-[90vw] max-h-[90vh] h-[80vh]" 
          : "sm:max-w-[600px] max-h-[90vh]"
      } overflow-y-auto bg-white border border-gray-200 shadow-lg p-0 [&>button]:hidden`}>
        {startInterviewMutation.isPending ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Creating Your Interview</DialogTitle>
              <DialogDescription className="text-center">
                Please wait while we prepare your personalized interview questions...
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 min-h-[400px] flex items-center justify-center">
              <LoadingAnimation isVisible={true} />
            </div>
          </>
        ) : (
          <>
            {/* Header with gradient background matching Preferences modal */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Start New Interview</h2>
                    <p className="text-indigo-100 text-sm">Upload your documents and select your preferences to begin your personalized interview practice.</p>
                  </div>
                </div>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Upload Section */}
              <DocumentUploadSection
                cvDocument={cvDocument}
                jobSpecDocument={jobSpecDocument}
                onCvChange={setCvDocument}
                onJobSpecChange={setJobSpecDocument}
              />

              {/* Grade Selection */}
              <GradeSelector 
                grade={grade}
                onGradeChange={setGrade}
              />

              {/* Framework Selection */}
              <FrameworkSelector
                framework={framework}
                onFrameworkChange={setFramework}
              />

              {/* Summary Card */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Interview Summary</h4>
                <ul className="space-y-1 text-sm text-purple-700">
                  <li>• Grade: {gradeConfig?.name} ({gradeConfig?.id.toUpperCase()})</li>
                  <li>• Questions: {questionCount}</li>
                  <li>• Framework: {framework === 'old' ? 'Traditional 6-Competency' : 'New 4-Area Capability'}</li>
                  <li>• Passing Score: {gradeConfig?.passingScore}%</li>
                </ul>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleStartInterview}
                disabled={!cvDocument || !grade || startInterviewMutation.isPending}
                className="w-full h-12 text-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {startInterviewMutation.isPending ? (
                  "Creating Interview..."
                ) : (
                  <>
                    Start Interview
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}