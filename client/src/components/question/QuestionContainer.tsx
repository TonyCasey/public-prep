import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { triggerPaymentModal } from "@/hooks/use-payment-modal";
import type { Interview, Question, Answer } from "@shared/schema";

// Import child components
import QuestionCard from "./QuestionCard";
import AnswerInput from "./AnswerInput";
import STARMethodGuide from "./STARMethodGuide";
import QuestionTimerCard from "./QuestionTimerCard";

import { showAnswerAnalysisModal, updateAnswerAnalysisModal, showAnswerAnalysisError, triggerAnswerAnalysisModal } from "@/hooks/use-answer-analysis-modal";

interface QuestionContainerProps {
  interviewId?: string;
  showPlanChoiceModal?: () => void;
}

interface CurrentQuestionData {
  session: Interview;
  currentQuestion: Question;
}

export default function QuestionContainer({ interviewId, showPlanChoiceModal }: QuestionContainerProps) {
  const { interviewId: urlInterviewId } = useParams<{ interviewId: string }>();
  const actualInterviewId = interviewId || urlInterviewId;
  
  // Get user session data (includes subscription info)
  const { user } = useAuth();
  
  // Event-based payment modal trigger (no hook needed)

  // Session data available via user object
  
  const [answer, setAnswer] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch interview data
  const { data: interview, isLoading: interviewLoading } = useQuery<Interview>({
    queryKey: ['/api/interviews', actualInterviewId],
    enabled: !!actualInterviewId,
  });

  // Fetch questions for this interview
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions', actualInterviewId],
    enabled: !!actualInterviewId,
  });

  // Fetch answers for THIS specific interview only for subscription limits
  const { data: interviewAnswers = [] } = useQuery<any[]>({
    queryKey: [`/api/interviews/${actualInterviewId}/answers`],
    enabled: !!actualInterviewId,
    queryFn: async () => {
      console.log('🔍 Fetching answers for interview:', actualInterviewId);
      const response = await fetch(`/api/interviews/${actualInterviewId}/answers`);
      console.log('🔍 Answers response status:', response.status);
      if (!response.ok) {
        console.log('🔍 Answers fetch failed:', response.statusText);
        return [];
      }
      const data = await response.json();
      console.log('🔍 Fetched answers data:', data);
      console.log('🔍 Answers count:', data.length);
      console.log('🔍 Current question ID:', currentQuestion?.id);
      console.log('🔍 Answer question IDs:', data.map((ans: any) => ans.questionId));
      const hasAnswerForCurrentQ = currentQuestion?.id ? data.some((ans: any) => ans.questionId === currentQuestion.id) : false;
      console.log('🔍 Has answer for current question:', hasAnswerForCurrentQ);
      return data;
    }
  });

  const isLoading = interviewLoading || questionsLoading;
  const currentQuestion = questions.length > 0 ? questions[interview?.currentQuestionIndex || 0] : null;
  
  // Populate answer field with existing answer if one exists for current question
  // BUT NOT when we're navigating between questions (user wants fresh empty field)
  useEffect(() => {
    if (isNavigating) {
      // Reset navigation flag after a short delay
      const timeout = setTimeout(() => setIsNavigating(false), 100);
      return () => clearTimeout(timeout);
    }
    
    if (currentQuestion?.id && interviewAnswers.length > 0 && !isNavigating) {
      const existingAnswer = interviewAnswers.find(
        (ans: any) => ans.questionId === currentQuestion.id
      );
      if (existingAnswer && existingAnswer.answerText && existingAnswer.answerText !== answer) {
        console.log('🔄 Populating answer field with existing answer:', existingAnswer.answerText.substring(0, 100));
        setAnswer(existingAnswer.answerText);
      }
    }
  }, [currentQuestion?.id, interviewAnswers, answer, isNavigating]);
  
  // Create currentQuestionData structure for backward compatibility
  const currentQuestionData = interview && currentQuestion ? {
    session: interview,
    currentQuestion: currentQuestion
  } : null;

  // Check if free user should be shown upgrade modal when viewing question 2+
  const shouldShowUpgradeForQuestion = user && 
    (!user.subscriptionStatus || user.subscriptionStatus === 'free') && 
    interviewAnswers.length > 0 && 
    (interview?.currentQuestionIndex || 0) > 0;
  
  // Trigger upgrade modal if free user is on question 2+ and has already answered
  useEffect(() => {
    if (shouldShowUpgradeForQuestion && !isLoading) {
      console.log('🎯 Free user on question 2+ with existing answers - triggering upgrade modal');
      triggerPaymentModal();
    }
  }, [shouldShowUpgradeForQuestion, isLoading]);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!currentQuestion?.id || !interview?.id) {
        throw new Error("No question available");
      }

      const response = await apiRequest("POST", "/api/answers", {
        questionId: currentQuestion.id,
        interviewId: interview.id,
        answerText: answer.trim(),
        timeSpent: timeElapsed,
      });

      // Parse the JSON response
      const data = await response.json();
      return data;
    },
    onSuccess: async (data) => {
      // Answer submitted successfully
      console.log('Answer submission response:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('Has evaluation?', !!(data as any).evaluation);
      
      // Invalidate query cache to fetch fresh data including the new answer
      queryClient.invalidateQueries({ 
        queryKey: [`/api/interviews/${actualInterviewId}/answers`] 
      });
      
      // DON'T clear the answer - user should see their submitted answer
      // Reset timer only
      setTimeElapsed(0);
      
      // Handle evaluation result
      if ((data as any).evaluation) {
        const evaluation = (data as any).evaluation;
        console.log('Frontend received evaluation:', evaluation);
        
        // Parse arrays that are stored as JSON strings
        const parseArray = (field: any) => {
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [field];
            } catch {
              return [field];
            }
          }
          return field || [];
        };
        
        // Update modal progressively with evaluation data (parsed arrays)
        updateAnswerAnalysisModal({
          overallScore: evaluation.overallScore,
          isLoading: false
        });
        
        // Add STAR method analysis after a delay
        setTimeout(() => {
          updateAnswerAnalysisModal({
            starMethodAnalysis: evaluation.starMethodAnalysis,
            competencyScores: evaluation.competencyScores
          });
        }, 800);
        
        // Add feedback after another delay
        setTimeout(() => {
          updateAnswerAnalysisModal({
            feedback: evaluation.feedback,
            strengths: parseArray(evaluation.strengths),
            improvementAreas: parseArray(evaluation.improvementAreas)
          });
        }, 1600);
        
        // Add improved answer last - NO automatic progression
        setTimeout(() => {
          updateAnswerAnalysisModal({
            improvedAnswer: evaluation.improvedAnswer
          });
        }, 2400);
        
      } else {
        console.log('No evaluation data in response');
        console.log('Response data structure:', JSON.stringify(data, null, 2));
        // Complete loading without evaluation data
        updateAnswerAnalysisModal({
          isLoading: false
        });
        
        // No automatic progression - user must click Next Question
      }
      
      setIsEvaluating(false);
      setIsPaused(true);
    },
    onError: (error: any) => {
      console.error("Submit answer error:", error);
      setIsEvaluating(false);
      setIsPaused(false);
      
      // Check if it's an OpenAI overload error
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('OpenAI seems to be busy') || error?.status === 503) {
        // Show error modal with user-friendly message
        showAnswerAnalysisError(
          "OpenAI seems to be busy at the moment. Please try again in a few minutes.",
          true,
          {
            questionText: currentQuestion?.questionText,
            competency: currentQuestion?.competency,
            userAnswer: answer.trim()
          }
        );
      }
    },
  });

  // Update interview mutation (for moving to next question)
  const updateInterviewMutation = useMutation({
    mutationFn: async (updates: Partial<Interview>) => {
      return apiRequest("PATCH", `/api/interviews/${interview?.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews', actualInterviewId] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/questions', actualInterviewId] 
      });
    },
  });

  const handleSubmitAnswer = () => {
    if (!answer.trim() || isEvaluating) return;
    
    // Check subscription limits - free users can only submit 1 answer total
    console.log('=== ANSWER SUBMISSION SUBSCRIPTION CHECK ===');
    console.log('User subscription status:', user?.subscriptionStatus);
    console.log('Interview answers count:', interviewAnswers.length);
    console.log('Is user free?', !user?.subscriptionStatus || user?.subscriptionStatus === 'free');
    
    // Free users are limited to 1 answer per interview
    if (user && (!user.subscriptionStatus || user.subscriptionStatus === 'free') && interviewAnswers.length >= 1) {
      console.log('🚫 BLOCKING FREE USER from submitting additional answers - triggering payment modal');
      triggerPaymentModal();
      return; // Don't proceed with answer submission
    }
    
    console.log('✅ PROCEEDING WITH ANSWER SUBMISSION');

    // Only proceed if subscription allows - Show modal immediately with loading state and question context
    showAnswerAnalysisModal({
      questionText: currentQuestion?.questionText,
      competency: currentQuestion?.competency,
      userAnswer: answer.trim(),
      isLoading: true
    });

    // Proceed with answer submission
    setIsEvaluating(true);
    setIsPaused(true);
    
    submitAnswerMutation.mutate();
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleNextQuestion = useCallback(() => {
    if (!interview) return;
    
    // Check if current question has been answered FIRST
    const currentQuestionId = currentQuestion?.id;
    const existingAnswer = currentQuestionId ? interviewAnswers.find(
      (ans: any) => ans.questionId === currentQuestionId
    ) : null;
    
    const hasAnswer = existingAnswer && existingAnswer.answerText && existingAnswer.answerText.trim().length > 0;
    
    if (!hasAnswer) {
      console.log('🚫 BLOCKING progression - current question not answered yet');
      return;
    }
    
    // Check subscription limits BEFORE moving to next question
    console.log('=== NEXT QUESTION SUBSCRIPTION CHECK ===');
    console.log('User subscription status:', user?.subscriptionStatus);
    console.log('Current question index:', interview.currentQuestionIndex || 0);
    console.log('Interview answers count:', interviewAnswers.length);
    console.log('Is user free?', !user?.subscriptionStatus || user?.subscriptionStatus === 'free');
    
    // Free users are limited to 1 question per interview (block progression from question 1 to question 2)
    // Check if user is currently on question 1 (index 0) and trying to move to question 2 (index 1)
    const nextQuestionIndex = (interview.currentQuestionIndex || 0) + 1;
    if (user && (!user.subscriptionStatus || user.subscriptionStatus === 'free') && nextQuestionIndex >= 1) {
      console.log(`🚫 BLOCKING FREE USER from progressing from question ${(interview.currentQuestionIndex || 0) + 1} to question ${nextQuestionIndex + 1} - triggering payment modal`);
      triggerPaymentModal();
      return; // Don't proceed to next question
    }
    
    console.log('✅ PROCEEDING TO NEXT QUESTION');
    
    // Set navigation flag to prevent auto-populating answer field
    setIsNavigating(true);
    
    const nextIndex = (interview.currentQuestionIndex || 0) + 1;
    
    updateInterviewMutation.mutate({
      currentQuestionIndex: nextIndex
    });
    
    // Reset state for new question
    setAnswer("");
    setTimeElapsed(0);
    setIsPaused(false);
  }, [interview, user, interviewAnswers, updateInterviewMutation]);

  const handlePreviousQuestion = useCallback(() => {
    if (!interview) return;
    
    const currentIndex = interview.currentQuestionIndex || 0;
    if (currentIndex <= 0) return; // Can't go back from first question
    
    const prevIndex = currentIndex - 1;
    
    // Set navigation flag to prevent auto-populating answer field
    setIsNavigating(true);
    
    updateInterviewMutation.mutate({
      currentQuestionIndex: prevIndex
    });
    
    // Reset state for new question
    setAnswer("");
    setTimeElapsed(0);
    setIsPaused(false);
  }, [interview, updateInterviewMutation]);



  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Show no session state
  if (!currentQuestionData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No Active Interview</h3>
        <p className="text-gray-600">Start a new interview from the dashboard.</p>
      </div>
    );
  }

  const session = currentQuestionData.session;
  const currentIndex = session.currentQuestionIndex || 0;
  const totalQuestions = session.totalQuestions || 12;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Timer Card */}
      <QuestionTimerCard
        timeElapsed={timeElapsed}
        onTimeUpdate={setTimeElapsed}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
        isEvaluating={isEvaluating}
        hasQuestion={!!currentQuestion}
      />

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        framework={session.framework || undefined}
      />

      {/* STAR Method Guide */}
      <STARMethodGuide />

      {/* Answer Input */}
      <AnswerInput
        answer={answer}
        onAnswerChange={(newAnswer) => {
          console.log('QuestionContainer - Answer change received:', newAnswer);
          setAnswer(newAnswer);
        }}
        onSubmit={handleSubmitAnswer}
        isPaused={isPaused}
        isEvaluating={isEvaluating}
        hasQuestionData={!!currentQuestion}
        onNextQuestion={handleNextQuestion}
        canGoForward={currentIndex < totalQuestions - 1}
        hasAnsweredCurrentQuestion={(() => {
          if (!currentQuestion?.id) return false;
          
          const existingAnswer = interviewAnswers.find(
            (ans: any) => ans.questionId === currentQuestion.id
          );
          
          // Simple logic: if answer exists with text, enable button
          const hasAnswer = existingAnswer && existingAnswer.answerText && existingAnswer.answerText.trim().length > 0;
          
          console.log('🎯 Button check - Has answer:', hasAnswer);
          
          return hasAnswer;
        })()}
        currentQuestionIndex={currentIndex}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}