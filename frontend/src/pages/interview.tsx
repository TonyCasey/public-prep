import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Interview, Question, Answer } from '@shared/schema';
import InterviewHeader from '@/components/interview-redesigned/InterviewHeader';
import QuestionAnswerPanelSimple from '@/components/interview-redesigned/QuestionAnswerPanelSimple';
import ProgressSidebar from '@/components/interview-redesigned/ProgressSidebar';

import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Star } from 'lucide-react';
import { showExistingAnswerModal } from '@/hooks/use-answer-analysis-modal';
import GlobalAnswerAnalysisModal from '@/components/modals/GlobalAnswerAnalysisModal';
import confetti from 'canvas-confetti';



export default function InterviewPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  
  // State management
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confettiTriggered = useRef(false);
  const interviewInitialized = useRef(false);
  
  // Local state for current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Fetch interview data
  const { data: interview, isLoading: isLoadingInterview } = useQuery<Interview>({
    queryKey: [`/api/interviews/${interviewId}`],
    enabled: !!interviewId && !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch questions for the interview
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: [`/api/questions/${interviewId}`],
    enabled: !!interviewId && !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch answers for the interview
  const { data: answers = [], isLoading: isLoadingAnswers, refetch: refetchAnswers } = useQuery<Answer[]>({
    queryKey: [`/api/interviews/${interviewId}/answers`],
    enabled: !!interviewId && !!user,
    refetchInterval: false, // Disable automatic polling
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: (updates: Partial<Interview>) =>
      apiRequest('PUT', `/api/interviews/${interviewId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${interviewId}`] });
    },
  });
  
  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { answer: string; timeSpent: number }) => {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) throw new Error('No current question');
      
      const response = await apiRequest('POST', `/api/answers`, {
        questionId: currentQuestion.id,
        interviewId: interviewId,
        answerText: data.answer,
        timeSpent: data.timeSpent
      });
      
      const result = await response.json();
      console.log('🔧 Raw API response from submitAnswerMutation:', result);
      return result;
    },
    onSuccess: () => {
      // Refetch answers to update the progress sidebar
      refetchAnswers();
    },
    onError: () => {
      setIsSubmitting(false);
      setIsSaving(false);
    }
  });

  // Handle answer submission
  const handleSubmitAnswer = useCallback(async (answer: string, timeElapsed: number) => {
    if (!answer.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Show the analysis modal immediately with loading state
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      window.dispatchEvent(new CustomEvent('show-answer-analysis-modal', {
        detail: {
          questionText: currentQuestion.questionText,
          competency: currentQuestion.competency,
          userAnswer: answer,
          isLoading: true
        }
      }));
    }
    
    // Submit answer in background
    try {
      console.log('🔧 Submitting answer for question:', currentQuestion?.id);
      console.log('🔧 Current answer count before submit:', answers.length);
      
      const result = await submitAnswerMutation.mutateAsync({ 
        answer, 
        timeSpent: timeElapsed 
      });
      
      console.log('🔧 Answer submission result:', result);
      
      // Update modal with evaluation results
      if (result && currentQuestion) {
        console.log('🔧 Full result object:', result);
        const evaluation = (result as any).evaluation;
        console.log('🔧 Extracted evaluation:', evaluation);
        
        // Check for evaluation data more robustly
        if (evaluation && (
          evaluation.overallScore !== undefined || 
          evaluation.feedback || 
          evaluation.starMethodAnalysis
        )) {
          console.log('✅ Valid evaluation found, updating modal with data');
          console.log('✅ Evaluation data:', {
            overallScore: evaluation.overallScore,
            feedback: evaluation.feedback?.substring(0, 100) + '...',
            hasStarMethod: !!evaluation.starMethodAnalysis,
            hasStrengths: !!evaluation.strengths,
            hasImprovedAnswer: !!evaluation.improvedAnswer
          });
          
          window.dispatchEvent(new CustomEvent('update-answer-analysis-modal', {
            detail: {
              overallScore: Number(evaluation.overallScore) || 0,
              competencyScores: evaluation.competencyScores || {},  
              starMethodAnalysis: evaluation.starMethodAnalysis || {},
              feedback: evaluation.feedback || '',
              strengths: evaluation.strengths || [],
              improvementAreas: evaluation.improvementAreas || [],
              improvedAnswer: evaluation.improvedAnswer || '', // Note: not aiImprovedAnswer
              isLoading: false
            }
          }));
        } else {
          console.log('❌ No valid evaluation found, showing error');
          console.log('❌ Evaluation check failed:', { 
            evaluation, 
            hasOverallScore: evaluation?.overallScore,
            hasFeedback: !!evaluation?.feedback,
            hasStarMethod: !!evaluation?.starMethodAnalysis
          });
          // No evaluation data received
          window.dispatchEvent(new CustomEvent('update-answer-analysis-modal', {
            detail: {
              error: 'AI evaluation failed to complete. Please try submitting again.',
              userFriendlyError: true,
              isLoading: false
            }
          }));
        }
        
        // CRITICAL FIX: Only show Next Question after answer is saved to database
        // Wait for refetch to complete to ensure answer is saved
        await refetchAnswers();
        
        console.log('🔧 Answer count after refetch:', answers.length);
        console.log('🔧 Enabling Next Question button');
        
        // Update UI state after successful submission AND database save
        // DO NOT automatically advance - just show Next Question button
        setShowNextButton(true);
        setCurrentAnswer('');
        setIsSubmitting(false);
        
        // Check if this completes the interview and trigger confetti
        const currentAnswerCount = answers.length + 1; // +1 for the answer we just submitted
        const isLastQuestion = currentQuestionIndex >= questions.length - 1;
        if (currentAnswerCount >= questions.length && isLastQuestion) {
          triggerConfettiCelebration();
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Show error in modal
      window.dispatchEvent(new CustomEvent('show-answer-analysis-modal', {
        detail: {
          error: 'Failed to analyze answer. Please try again.',
          isLoading: false,
          userFriendlyError: true
        }
      }));
      setIsSubmitting(false);
    }
  }, [currentQuestionIndex, questions, isSubmitting, submitAnswerMutation]);

  // Handle next question navigation
  const handleNextQuestion = useCallback(async () => {
    // CRITICAL: Only allow progression if current question has been answered
    const currentQuestion = questions[currentQuestionIndex];
    const hasCurrentAnswer = currentQuestion && answers.some(a => a.questionId === currentQuestion.id);
    
    if (!hasCurrentAnswer) {
      console.log('Cannot advance: current question not answered');
      return; // Block progression without answer
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setIsLoadingNext(true);
      
      // Clear the answer and reset state
      setCurrentAnswer('');
      setShowNextButton(false);
      
      // Move to next question
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      // Invalidate the answer query for the next question
      const nextQuestion = questions[newIndex];
      if (nextQuestion) {
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/answers/by-question/${nextQuestion.id}`] 
        });
      }
      
      setIsLoadingNext(false);
    }
  }, [currentQuestionIndex, questions, answers]);

  // Handle answer input change
  const handleAnswerChange = useCallback((value: string) => {
    setCurrentAnswer(value);
    // Reset submit button if we're editing after submission
    if (showNextButton && value !== '') {
      setShowNextButton(false);
    }
  }, [showNextButton]);

  // Handle interview events (navigation, question clicks)
  const handleInterviewEvent = useCallback((event: any) => {
    if (event.type === 'navigate-back') {
      // Handle back navigation if needed
    } else if (event.type === 'VIEW_ANSWER' && event.answerId) {
      // Handle clicking on a completed question to view its analysis
      const answer = answers.find(a => a.id === event.answerId);
      if (answer) {
        // Find the question for this answer to get the question text and competency
        const question = questions.find(q => q.id === answer.questionId);
        if (question) {
          // Trigger the global answer analysis modal with the existing answer data
          window.dispatchEvent(new CustomEvent('show-answer-analysis-modal', {
            detail: {
              questionText: question.questionText,
              competency: question.competency,
              userAnswer: answer.answerText,
              answerId: event.answerId,
              isLoading: true // Will trigger fetching of existing analysis data
            }
          }));
        }
      }
    }
  }, [answers, questions]);
  
  // Initialize interview data and restore session position
  useEffect(() => {
    if (interview && questions.length > 0 && !interviewInitialized.current) {
      // Only initialize once to prevent auto-advancement
      interviewInitialized.current = true;
      
      // Restore to the last unanswered question or the saved position
      const lastAnsweredIndex = questions.findIndex(q => 
        !answers.some(a => a.questionId === q.id)
      );
      
      const resumeIndex = lastAnsweredIndex !== -1 
        ? lastAnsweredIndex 
        : (interview.currentQuestionIndex || 0);
      
      console.log('🔧 Initializing interview to question index:', resumeIndex);
      setCurrentQuestionIndex(resumeIndex);
    }
  }, [interview, questions]); // Remove answers dependency to prevent auto-advancement
  
  // Update session when question index changes
  useEffect(() => {
    if (interview && currentQuestionIndex !== interview.currentQuestionIndex) {
      updateSessionMutation.mutate({ currentQuestionIndex });
    }
  }, [currentQuestionIndex, interview]);
  
  // Auto-focus input when question changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && !showNextButton) {
        inputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, showNextButton]);
  
  // Check if current question has an answer when component loads or question changes
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      const hasAnswer = answers.some(a => a.questionId === currentQuestion.id);
      if (hasAnswer) {
        setShowNextButton(true);
        setCurrentAnswer(''); // Clear the input
      } else {
        setShowNextButton(false);
      }
    }
  }, [currentQuestionIndex, questions, answers]);
  
  // Listen for modal close event to transition UI to answered state
  useEffect(() => {
    const handleModalClose = async () => {
      console.log('🔧 Modal closed, transitioning to answered state');
      
      if (isSubmitting) {
        setIsSaving(true);
        
        // Refetch answers to ensure we have the latest data
        await refetchAnswers();
        
        // Check if current question now has an answer
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion) {
          const hasAnswer = answers.some(a => a.questionId === currentQuestion.id);
          if (hasAnswer) {
            console.log('🔧 Answer confirmed in database, showing Next Question button');
            setShowNextButton(true);
            // Don't clear currentAnswer - let the component show the submitted answer
          }
        }
        
        setTimeout(() => {
          setIsSaving(false);
          setIsSubmitting(false); // Reset submitting state
        }, 1000);
      }
    };
    
    window.addEventListener('answerAnalysisModalClosed', handleModalClose);
    return () => window.removeEventListener('answerAnalysisModalClosed', handleModalClose);
  }, [isSubmitting, questions, currentQuestionIndex, answers, refetchAnswers]);
  
  // Loading state
  if (isLoadingInterview || isLoadingQuestions || isLoadingAnswers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }
  
  if (!interview || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Interview not found</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.length;
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  // Check if interview is fully completed
  const isInterviewCompleted = answeredCount >= totalQuestions && totalQuestions > 0;
  const isOnLastQuestion = currentQuestionIndex >= questions.length - 1;
  const lastQuestionHasAnswer = isOnLastQuestion && answers.some(a => a.questionId === currentQuestion?.id);
  
  // Simple function to trigger confetti celebration (no hooks)
  const triggerConfettiCelebration = () => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#ec4899', '#8b5cf6']
      });
      
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#10b981', '#3b82f6']
        });
      }, 200);
    }, 500);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <InterviewHeader 
          interview={interview}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          progressPercentage={progressPercentage}
          onEvent={handleInterviewEvent}
        />
        
        <div className="space-y-6">
          {currentQuestion && (
            <>
              <QuestionAnswerPanelSimple
                ref={inputRef}
                question={currentQuestion}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                answer={showNextButton ? 
                  // Show submitted answer when question is answered
                  answers.find(a => a.questionId === currentQuestion.id)?.answerText || '' :
                  // Show current draft when answering
                  currentAnswer
                }
                onAnswerChange={handleAnswerChange}
                onAnswerSubmit={handleSubmitAnswer}
                isSubmitDisabled={!currentAnswer.trim() || isSubmitting || showNextButton}
                showSubmitButton={!showNextButton}
              />
              
              {/* Action buttons / Completion message */}
              <div className="flex justify-center">
                {isSaving && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Saving answer...</span>
                  </div>
                )}
                
                {/* Show celebration when interview is completed */}
                {isInterviewCompleted && lastQuestionHasAnswer ? (
                  <div className="text-center space-y-4 py-8">
                    <div className="flex items-center justify-center gap-3 text-3xl">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                        Well Done!
                      </span>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="text-lg text-gray-700 font-medium">
                      You've completed all {totalQuestions} interview questions
                    </p>
                    <div className="text-sm text-gray-600">
                      Great job! You can review your answers by clicking on any question in the progress bar below.
                    </div>
                  </div>
                ) : (
                  /* Show Next Question button only if not completed */
                  showNextButton && !isSaving && (
                    <Button
                      onClick={handleNextQuestion}
                      disabled={isLoadingNext || isOnLastQuestion}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    >
                      {isLoadingNext ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading next question...
                        </>
                      ) : (
                        'Next Question'
                      )}
                    </Button>
                  )
                )}
              </div>
              
              {/* Progress indicators - always horizontal at bottom */}
              <ProgressSidebar
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                answers={answers}
                onEvent={handleInterviewEvent}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Global Answer Analysis Modal */}
      <GlobalAnswerAnalysisModal />
    </div>
  );
}