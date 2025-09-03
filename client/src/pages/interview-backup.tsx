// This is a backup of the original interview.tsx page before applying the redesigned interface
// Created on July 29, 2025

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/apiRequest';
import { InterviewHeader } from '@/components/interview/InterviewHeader';
import { QuestionContainer } from '@/components/interview/QuestionContainer';
import { useAuth } from '@/hooks/use-auth';
import { Interview, Question, Answer } from '@/shared/schema';
import {
  InterviewHeader as RedesignedHeader,
  QuestionAnswerPanel,
  ProgressSidebar,
  NavigationControls
} from '@/components/interview-redesigned';
import { useInterviewStore } from '@/store/interview-store';
import { Card } from '@/components/ui/card';

interface SessionApiResponse extends Interview {}

interface ProgressComponentProps {
  interview: Interview;
  questions: Question[];
  answers: Answer[];
  onQuestionClick?: (question: Question) => void;
}

// Add a separate component to avoid hook issues
function ProgressComponent({ interview, questions, answers, onQuestionClick }: ProgressComponentProps) {
  const currentQuestionId = questions[interview.currentQuestionIndex]?.id;
  
  // Get the evaluation for the current question's answer
  const currentAnswer = answers.find(a => a.questionId === currentQuestionId);
  const evaluation = currentAnswer?.evaluation;
  
  return (
    <ProgressSidebar
      questions={questions}
      currentQuestionIndex={interview.currentQuestionIndex}
      answers={answers}
      onQuestionClick={onQuestionClick}
      competencyScores={evaluation?.competencyScores || {}}
    />
  );
}

export function InterviewPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const [, params] = useRoute('/app/interview/:id');
  const isRedesigned = params && new URLSearchParams(window.location.search).get('redesigned') === '1';
  
  // Zustand store for managing interview state
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    setInterviewData,
    resetInterview
  } = useInterviewStore();
  
  // Refs for managing component state
  const hasFetchedInitialData = useRef(false);
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Fetch interview data
  const { data: interview, isLoading: isLoadingInterview } = useQuery<SessionApiResponse>({
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
  const { data: answers = [], isLoading: isLoadingAnswers } = useQuery<Answer[]>({
    queryKey: [`/api/interviews/${interviewId}/answers`],
    enabled: !!interviewId && !!user,
    refetchInterval: 5000,
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: (updates: Partial<Interview>) =>
      apiRequest('PUT', `/api/interviews/${interviewId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${interviewId}`] });
    },
  });
  
  // Initialize interview data
  useEffect(() => {
    if (interview && questions.length > 0 && !hasFetchedInitialData.current) {
      hasFetchedInitialData.current = true;
      setInterviewData({
        interview,
        questions,
        currentQuestionIndex: interview.currentQuestionIndex || 0,
      });
      setCurrentQuestionIndex(interview.currentQuestionIndex || 0);
    }
  }, [interview, questions, setInterviewData, setCurrentQuestionIndex]);
  
  // Update session when question index changes
  useEffect(() => {
    if (interview && currentQuestionIndex !== interview.currentQuestionIndex) {
      updateSessionMutation.mutate({ currentQuestionIndex });
    }
  }, [currentQuestionIndex, interview]);
  
  // Handle navigation
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      // Invalidate the answer query for the next question to ensure it's fresh
      const nextQuestion = questions[newIndex];
      if (nextQuestion) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/answers/by-question/${nextQuestion.id}`] 
        });
      }
    }
  }, [currentQuestionIndex, questions, setCurrentQuestionIndex]);
  
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex]);
  
  const handleQuestionClick = useCallback((clickedQuestion: Question) => {
    const index = questions.findIndex(q => q.id === clickedQuestion.id);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      
      // Scroll to the question
      const element = questionRefs.current[clickedQuestion.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [questions, setCurrentQuestionIndex]);
  
  // Handle answer updates
  const handleAnswerUpdate = useCallback(() => {
    // Invalidate answers query to refresh the list
    queryClient.invalidateQueries({ 
      queryKey: [`/api/interviews/${interviewId}/answers`] 
    });
    
    // Invalidate the current question's answer
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/answers/by-question/${currentQuestion.id}`] 
      });
    }
  }, [interviewId, questions, currentQuestionIndex]);
  
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
  
  // Show redesigned interface if query parameter is present
  if (isRedesigned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container max-w-7xl mx-auto p-4 space-y-6">
          <RedesignedHeader interview={interview} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {currentQuestion && (
                <QuestionAnswerPanel
                  question={currentQuestion}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={questions.length}
                  onAnswerSubmit={handleAnswerUpdate}
                />
              )}
              
              <NavigationControls
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onPrevious={handlePreviousQuestion}
                onNext={handleNextQuestion}
                hasAnswered={answers.some(a => a.questionId === currentQuestion?.id)}
              />
            </div>
            
            <div className="lg:col-span-1">
              <ProgressComponent
                interview={interview}
                questions={questions}
                answers={answers}
                onQuestionClick={handleQuestionClick}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Original interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container max-w-6xl mx-auto p-4">
        <InterviewHeader interview={interview} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {currentQuestion && (
              <div 
                ref={(el) => { 
                  if (currentQuestion) {
                    questionRefs.current[currentQuestion.id] = el; 
                  }
                }}
              >
                <QuestionContainer
                  question={currentQuestion}
                  interview={interview}
                  onNextQuestion={handleNextQuestion}
                  onPreviousQuestion={handlePreviousQuestion}
                  onAnswerUpdate={handleAnswerUpdate}
                />
              </div>
            )}
          </div>
          
          {/* Progress sidebar */}
          <div className="lg:col-span-1">
            <ProgressComponent
              interview={interview}
              questions={questions}
              answers={answers}
              onQuestionClick={handleQuestionClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}