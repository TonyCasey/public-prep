import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAnswerAnalysisModal, updateAnswerAnalysisModal } from '@/hooks/use-answer-analysis-modal';
import { useAuth } from '@/hooks/use-auth';

// Import child components
import STARMethodAnalysis from '../answer-analysis/STARMethodAnalysis';
import FeedbackSection from '../answer-analysis/FeedbackSection';
import StrengthsAndImprovements from '../answer-analysis/StrengthsAndImprovements';
import ImprovedAnswer from '../answer-analysis/ImprovedAnswer';
import ModalHeader from '../answer-analysis/ModalHeader';

export default function GlobalAnswerAnalysisModal() {
  const { isOpen, analysisData, closeModal } = useAnswerAnalysisModal();
  const { user } = useAuth();
  const [showUserAnswer, setShowUserAnswer] = useState(false);

  // Fetch existing answer data when answerId is provided
  useEffect(() => {
    if (analysisData?.answerId && analysisData.isLoading) {
      fetchExistingAnswer(analysisData.answerId);
    }
  }, [analysisData?.answerId, analysisData?.isLoading]);

  // Handle scroll locking and event management
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        // Restore body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, closeModal]);

  const fetchExistingAnswer = async (answerId: string) => {
    try {
      // Fetch answer data
      const answerResponse = await fetch(`/api/answers/${answerId}`);
      if (!answerResponse.ok) throw new Error('Failed to fetch answer');
      const answerData = await answerResponse.json();

      // Fetch rating data - handle case where no rating exists yet
      const ratingResponse = await fetch(`/api/ratings/by-answer/${answerId}`);
      let ratingData = null;
      if (ratingResponse.ok) {
        ratingData = await ratingResponse.json();
      } else if (ratingResponse.status === 404) {
        // No rating exists for this answer yet
        ratingData = null;
      } else {
        throw new Error('Failed to fetch rating');
      }

      // Fetch question data
      const questionResponse = await fetch(`/api/questions/single/${answerData.questionId}`);
      if (!questionResponse.ok) throw new Error('Failed to fetch question');
      const questionData = await questionResponse.json();

      // Update modal with fetched data
      if (ratingData) {
        // Rating exists - show full evaluation
        updateAnswerAnalysisModal({
          userAnswer: answerData.answerText,
          questionText: questionData.questionText,
          competency: questionData.competency,
          overallScore: ratingData.overallScore,
          competencyScores: ratingData.competencyScores || {},
          starMethodAnalysis: ratingData.starMethodAnalysis || {
            situation: 0,
            task: 0,
            action: 0,
            result: 0
          },
          feedback: ratingData.feedback,
          strengths: ratingData.strengths || [],
          improvementAreas: ratingData.improvementAreas || [],
          improvedAnswer: ratingData.aiImprovedAnswer,
          isLoading: false
        });
      } else {
        // No rating exists - show answer only with message
        updateAnswerAnalysisModal({
          userAnswer: answerData.answerText,
          questionText: questionData.questionText,
          competency: questionData.competency,
          error: 'This answer has not been evaluated yet. You can get AI feedback by submitting it for evaluation.',
          userFriendlyError: true,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching existing answer:', error);
      updateAnswerAnalysisModal({
        error: 'Failed to load answer data. Please try again.',
        userFriendlyError: true,
        isLoading: false
      });
    }
  };

  if (!isOpen || !analysisData) return null;

  const {
    overallScore,
    competencyScores,
    starMethodAnalysis,
    feedback,
    strengths,
    improvementAreas,
    improvedAnswer,
    userAnswer,
    questionText,
    competency
  } = analysisData;

  // Format competency scores for display
  const formattedCompetencyScores = typeof competencyScores === 'object' && competencyScores !== null
    ? competencyScores
    : {};

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center p-2 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto modal-scroll"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ModalHeader 
          competency={competency}
          onClose={closeModal}
          evaluationStage={analysisData.evaluationStage}
          isLoading={analysisData.isLoading}
          overallScore={overallScore}
        />

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Error Message Display */}
          {analysisData.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {analysisData.userFriendlyError ? "Service Temporarily Unavailable" : "Evaluation Error"}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{analysisData.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAR Method Analysis */}
          {(starMethodAnalysis || analysisData.isLoading) && (
            <div className="space-y-4">
              {analysisData.isLoading && !starMethodAnalysis ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {['Situation', 'Task', 'Action', 'Result'].map((method) => (
                    <div key={method} className="p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm">
                      <div className="flex sm:flex-col items-center sm:text-center">
                        <div className="animate-pulse flex sm:flex-col items-center sm:w-full">
                          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gray-200 rounded-full mr-3 sm:mr-0 sm:mx-auto mb-0 sm:mb-3 flex-shrink-0"></div>
                          <div className="flex-1 sm:w-full">
                            <div className="h-4 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2 w-20 sm:w-full"></div>
                            <div className="h-3 sm:h-3 bg-gray-200 rounded w-16 sm:w-3/4 sm:mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : starMethodAnalysis ? (
                <STARMethodAnalysis 
                  starMethodAnalysis={starMethodAnalysis}
                  isLoading={false}
                />
              ) : null}
            </div>
          )}

          {/* AI Feedback - only show when feedback is available */}
          {feedback && (
            <FeedbackSection 
              feedback={feedback}
            />
          )}

          {/* Strengths and Improvements - always show when rating data exists */}
          {(strengths !== undefined || improvementAreas !== undefined) && (
            <StrengthsAndImprovements 
              strengths={Array.isArray(strengths) && strengths.length > 0 ? strengths.join(' • ') : 
                        (typeof strengths === 'string' && strengths ? strengths : undefined)}
              improvementAreas={Array.isArray(improvementAreas) && improvementAreas.length > 0 ? improvementAreas.join(' • ') : 
                              (typeof improvementAreas === 'string' && improvementAreas ? improvementAreas : undefined)}
            />
          )}

          {/* AI Improved Answer - only show when data is available */}
          {improvedAnswer && (
            <ImprovedAnswer
              improvedAnswer={improvedAnswer}
              isSampleQuestion={!user}
            />
          )}

          {/* Your Answer - collapsible section */}
          {userAnswer && (
            <div className="border border-gray-200 rounded-xl">
              <button
                onClick={() => setShowUserAnswer(!showUserAnswer)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Your Answer</h3>
                {showUserAnswer ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {showUserAnswer && (
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed">
                    {userAnswer}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons - only show when not loading */}
          {!analysisData.isLoading && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={closeModal}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ring-2 ring-purple-200 hover:ring-purple-300 text-sm sm:text-base"
              >
                Close Analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}