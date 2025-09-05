import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Import child components
import STARMethodAnalysis from './STARMethodAnalysis';
import FeedbackSection from './FeedbackSection';
import StrengthsAndImprovements from './StrengthsAndImprovements';
import ImprovedAnswer from './ImprovedAnswer';
import ModalHeader from './ModalHeader';

interface AnswerAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  answerId?: string;
  evaluationData?: any; // For new answers
  questionData?: any; // For new answers
  sessionData?: any; // For new answers
  onNextQuestion?: () => void;
  onRetryQuestion?: () => void;
  isLoading?: boolean;
  error?: boolean;
  evaluationStage?: number; // For showing progress messages
}

export default function AnswerAnalysisModal({
  isOpen,
  onClose,
  answerId,
  evaluationData,
  questionData,
  sessionData,
  onNextQuestion,
  onRetryQuestion,
  isLoading: externalLoading,
  error: externalError,
  evaluationStage = 0
}: AnswerAnalysisModalProps) {
  const [showUserAnswer, setShowUserAnswer] = useState(false);

  // Fetch answer data if answerId is provided
  const { data: answerData, isLoading: answerLoading, error: answerError } = useQuery({
    queryKey: [`/api/answers/${answerId}`],
    enabled: !!answerId && isOpen,
    queryFn: async () => {
      const response = await fetch(`/api/answers/${answerId}`);
      if (!response.ok) throw new Error('Failed to fetch answer');
      return response.json();
    }
  });

  // Determine what data to use
  const isViewMode = !!answerId;
  const isLoading = isViewMode ? answerLoading : externalLoading;
  const error = isViewMode ? answerError : externalError;
  
  // Extract evaluation data - handle both formats
  let evaluation = isViewMode ? answerData?.evaluation : evaluationData;
  
  // Parse evaluation data properly
  let overallScore: number | undefined;
  let competencyScores: any;
  let feedback: string | undefined;
  let strengths: string | undefined;
  let improvementAreas: string | undefined;
  let starMethodAnalysis: { situation?: number; task?: number; action?: number; result?: number } | undefined;
  let improvedAnswer: string | undefined;
  let cvSuggestedAnswer: string | undefined;
  let isSampleQuestion: boolean = false;
  
  if (evaluation) {
    overallScore = evaluation.overallScore;
    competencyScores = evaluation.competencyScores;
    // Check for feedback in evaluation object first, then fall back to answer level
    feedback = evaluation.feedback || (isViewMode ? answerData?.feedback : undefined);
    starMethodAnalysis = evaluation.starMethodAnalysis;
    improvedAnswer = evaluation.improvedAnswer;
    cvSuggestedAnswer = evaluation.cvSuggestedAnswer;
    isSampleQuestion = evaluation.isSampleQuestion || false;
    
    // Handle strengths - could be array or string
    if (Array.isArray(evaluation.strengths)) {
      strengths = evaluation.strengths.join(' • ');
    } else {
      strengths = evaluation.strengths;
    }
    
    // Handle improvements - could be array or string
    if (Array.isArray(evaluation.improvementAreas)) {
      improvementAreas = evaluation.improvementAreas.join(' • ');
    } else {
      improvementAreas = evaluation.improvementAreas;
    }
  }
  
  const userAnswer = isViewMode ? answerData?.answerText : evaluationData?.userAnswer;
  const question = isViewMode ? answerData?.question : questionData;
  const questionText = question?.questionText;
  const competency = question?.competency;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ModalHeader 
          title={isLoading ? "Evaluating Answer" : "AI Feedback"}
          overallScore={overallScore}
          isLoading={!!isLoading}
          evaluationStage={evaluationStage}
          onClose={onClose}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Process</h3>
              <p className="text-gray-600 mb-6">
                {isViewMode ? 'Failed to load answer details.' : 'We encountered an issue while evaluating your response.'}
              </p>
              <div className="flex gap-3 justify-center">
                {!isViewMode && onRetryQuestion && !isSampleQuestion && (
                  <button
                    onClick={onRetryQuestion}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Content - Only show if not error state */}
          {!error && (
            <>
              {/* Question Text (if available) */}
              {questionText && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">Question:</h3>
                  <p className="text-gray-700">{questionText}</p>
                  {competency && (
                    <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {competency}
                    </Badge>
                  )}
                </div>
              )}

              {/* STAR Method Analysis */}
              <STARMethodAnalysis 
                starMethodAnalysis={starMethodAnalysis}
                isLoading={!!isLoading}
              />

              {/* Feedback Content */}
              <div className="space-y-4">
                {/* AI Feedback */}
                <FeedbackSection feedback={feedback} />

                {/* Strengths & Improvements */}
                <StrengthsAndImprovements 
                  strengths={strengths}
                  improvementAreas={improvementAreas}
                />

                {/* Improved Answer */}
                <ImprovedAnswer 
                  improvedAnswer={improvedAnswer}
                  isSampleQuestion={isSampleQuestion}
                />

                {/* User's Answer - Collapsible */}
                {userAnswer && (
                  <Card className="border-gray-200">
                    <CardHeader 
                      className="bg-gradient-to-r from-gray-50 to-slate-50 cursor-pointer"
                      onClick={() => setShowUserAnswer(!showUserAnswer)}
                    >
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Your Answer</span>
                        {showUserAnswer ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </CardTitle>
                    </CardHeader>
                    {showUserAnswer && (
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{userAnswer}</p>
                      </CardContent>
                    )}
                  </Card>
                )}
              </div>

              {/* Action Buttons - Only for new answers, not view mode */}
              {!isViewMode && !isLoading && (
                <div className="flex justify-end gap-3 mt-6">
                  {onRetryQuestion && !isSampleQuestion && (
                    <Button
                      variant="outline"
                      onClick={onRetryQuestion}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Question
                    </Button>
                  )}
                  {onNextQuestion && (
                    <Button
                      onClick={onNextQuestion}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    >
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
              
              {/* Loading skeleton for action buttons */}
              {!isViewMode && isLoading && (
                <div className="flex justify-end gap-3 mt-6">
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}