import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";
import AnswerAnalysisModal from "@/components/answer-analysis/AnswerAnalysisModal";
import PlanChoiceModal from "@/components/payment/PlanChoiceModal";
import type { Interview, Answer, Question } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { showExistingAnswerModal, showAnswerAnalysisModal, updateAnswerAnalysisModal, showAnswerAnalysisError, triggerAnswerAnalysisModal } from "@/hooks/use-answer-analysis-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { triggerPaymentModal } from "@/hooks/use-payment-modal";

// Import new modular components
import InterviewHeader from "../components/interview-redesigned/InterviewHeader";
import QuestionAnswerPanel from "../components/interview-redesigned/QuestionAnswerPanel";
import ProgressSidebar from "../components/interview-redesigned/ProgressSidebar";
import NavigationControls from "../components/interview-redesigned/NavigationControls";

// Event types for component communication
export type InterviewEvent = 
  | { type: 'SUBMIT_ANSWER'; answer: string; timeElapsed: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'JUMP_TO_QUESTION'; index: number }
  | { type: 'CLEAR_ANSWER' }
  | { type: 'RECORD_START' }
  | { type: 'RECORD_STOP' }
  | { type: 'SHOW_PLAN_MODAL' }
  | { type: 'VIEW_ANSWER'; answerId: string };

export default function InterviewRedesignedPage() {
  console.log('InterviewRedesignedPage: Component rendering');
  
  const { interviewId: id, questionId } = useParams<{ interviewId: string; questionId?: string }>();
  const [, navigate] = useLocation();
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showPlanChoiceModal, setShowPlanChoiceModal] = useState(false);
  
  console.log('InterviewRedesignedPage: Params:', { id, questionId });
  
  // State for current answer
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Fetch interview data
  const { data: interview, isLoading: interviewLoading, error: interviewError } = useQuery<Interview>({
    queryKey: ['/api/interviews', id],
    enabled: !!id,
    refetchInterval: false,
  });

  // Fetch answers for this interview
  const { data: interviewAnswers = [], isLoading: answersLoading } = useQuery<Answer[]>({
    queryKey: [`/api/interviews/${id}/answers`],
    enabled: !!id,
  });

  // Get user session data
  const { user } = useAuth();
  console.log('InterviewRedesignedPage: User auth state:', { user });

  // Get all questions for this interview
  const { data: questions = [], isLoading: questionLoading, error: questionError } = useQuery<Question[]>({
    queryKey: ['/api/questions', id],
    enabled: !!id,
  });

  // Calculate current question
  const currentQuestion = questions.length > 0 ? questions[interview?.currentQuestionIndex || 0] : null;
  
  // Event handler for all child components
  const handleInterviewEvent = (event: InterviewEvent) => {
    console.log('Interview event:', event);
    
    switch (event.type) {
      case 'SUBMIT_ANSWER':
        handleSubmitAnswer(event.answer, event.timeElapsed);
        break;
        
      case 'NEXT_QUESTION':
        handleNextQuestion();
        break;
        
      case 'PREVIOUS_QUESTION':
        handlePreviousQuestion();
        break;
        
      case 'JUMP_TO_QUESTION':
        handleJumpToQuestion(event.index);
        break;
        
      case 'CLEAR_ANSWER':
        setCurrentAnswer("");
        break;
        
      case 'SHOW_PLAN_MODAL':
        setShowPlanChoiceModal(true);
        break;
        
      case 'VIEW_ANSWER':
        handleAnswerClick(event.answerId);
        break;
        
      default:
        console.warn('Unhandled event type:', event);
    }
  };
  
  // Mutation to update interview progress
  const updateInterviewMutation = useMutation({
    mutationFn: async (updates: Partial<Interview>) => {
      return apiRequest('PATCH', `/api/interviews/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews', id] });
    }
  });

  // Mutation to submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ answer, timeElapsed }: { answer: string; timeElapsed: number }) => {
      if (!currentQuestion || !interview) throw new Error('No question or interview data');
      
      const response = await apiRequest('POST', '/api/answers', {
        interviewId: id,
        questionId: currentQuestion.id,
        answerText: answer,
        timeSpent: timeElapsed
      });
      
      // Parse the JSON response
      const data = await response.json();
      return { ...data, submittedAnswer: answer }; // Include the answer in the return
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${id}/answers`] });
      
      const newAnswer = result;
      const submittedAnswer = result.submittedAnswer;
      
      // Show answer analysis modal
      showAnswerAnalysisModal();
      
      // Handle the response from API
      if (newAnswer && newAnswer.evaluation) {
        // If evaluation is already included, show it
        triggerAnswerAnalysisModal({
          ...newAnswer.evaluation,
          answerId: newAnswer.id,
          userAnswer: submittedAnswer,
          questionText: currentQuestion?.questionText,
          competency: currentQuestion?.competency
        });
      } else {
        // Otherwise wait for evaluation
        updateAnswerAnalysisModal({
          answerId: newAnswer.id,
          isLoading: true,
          evaluationStage: 1,
          userAnswer: submittedAnswer,
          questionText: currentQuestion?.questionText,
          competency: currentQuestion?.competency
        });
      }
    },
    onError: (error: any) => {
      console.error('Submit answer error:', error);
      if (error?.message?.includes('subscription required')) {
        triggerPaymentModal();
      } else {
        showAnswerAnalysisError(error?.message || 'Failed to submit answer', true);
      }
    }
  });

  const handleSubmitAnswer = async (answer: string, timeElapsed: number) => {
    setIsEvaluating(true);
    try {
      await submitAnswerMutation.mutateAsync({ answer, timeElapsed });
    } finally {
      setIsEvaluating(false);
    }
  };
  
  const handleNextQuestion = async () => {
    if (!interview || !questions.length) return;
    const nextIndex = Math.min((interview.currentQuestionIndex || 0) + 1, questions.length - 1);
    
    await updateInterviewMutation.mutateAsync({
      currentQuestionIndex: nextIndex
    });
    
    setCurrentAnswer("");
    setTimeElapsed(0);
  };
  
  const handlePreviousQuestion = async () => {
    if (!interview || !questions.length) return;
    const prevIndex = Math.max((interview.currentQuestionIndex || 0) - 1, 0);
    
    await updateInterviewMutation.mutateAsync({
      currentQuestionIndex: prevIndex
    });
    
    setCurrentAnswer("");
    setTimeElapsed(0);
  };
  
  const handleJumpToQuestion = async (index: number) => {
    if (!interview || !questions.length || index < 0 || index >= questions.length) return;
    
    await updateInterviewMutation.mutateAsync({
      currentQuestionIndex: index
    });
    
    setCurrentAnswer("");
    setTimeElapsed(0);
  };

  const handleAnswerClick = async (answerId: string) => {
    showExistingAnswerModal(answerId);
  };
  
  // Handle URL question ID
  useEffect(() => {
    if (questionId && interviewAnswers.length > 0 && !showAnswerModal) {
      const answer = interviewAnswers.find((a: any) => a.questionId === questionId);
      if (answer) {
        setSelectedAnswerId(answer.id);
        setShowAnswerModal(true);
      }
    }
  }, [questionId, interviewAnswers.length, showAnswerModal]);
  
  // Loading state
  if (interviewLoading || questionLoading || answersLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-64"></div>
            <div className="h-64 bg-gray-200 rounded w-96"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (interviewError || questionError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-6 max-w-md">
            <CardContent>
              <p className="text-red-600">Error loading interview. Please try again.</p>
              <Button onClick={() => navigate('/app/dashboard')} className="mt-4">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!interview || !currentQuestion) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-6 max-w-md">
            <CardContent>
              <p className="text-gray-600">Interview not found.</p>
              <Button onClick={() => navigate('/app/dashboard')} className="mt-4">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Calculate progress
  const totalQuestions = interview.totalQuestions || 12;
  const uniqueAnsweredQuestions = new Set(interviewAnswers.map((answer: any) => answer.questionId));
  const answeredCount = Math.min(uniqueAnsweredQuestions.size, totalQuestions);
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const isCompleted = interview.completedAt;
  
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Compact Header */}
        <InterviewHeader 
          interview={interview}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          progressPercentage={progressPercentage}
          onEvent={handleInterviewEvent}
        />
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Main Question/Answer Panel */}
          <div className="flex-1 order-2 lg:order-1">
            <QuestionAnswerPanel
              question={currentQuestion}
              currentIndex={interview.currentQuestionIndex || 0}
              totalQuestions={totalQuestions}
              answer={currentAnswer}
              onAnswerChange={setCurrentAnswer}
              onEvent={handleInterviewEvent}
              isEvaluating={isEvaluating}
              timeElapsed={timeElapsed}
              onTimeElapsedChange={setTimeElapsed}
              hasAnsweredCurrentQuestion={currentQuestion ? interviewAnswers.some(a => a.questionId === currentQuestion.id) : false}
              canGoBack={(interview.currentQuestionIndex || 0) > 0}
              canGoForward={(interview.currentQuestionIndex || 0) < totalQuestions - 1}
            />
          </div>
          
          {/* Progress Sidebar */}
          <div className="w-full lg:w-80 order-1 lg:order-2">
            <ProgressSidebar
              questions={questions}
              answers={interviewAnswers}
              currentQuestionIndex={interview.currentQuestionIndex || 0}
              onEvent={handleInterviewEvent}
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AnswerAnalysisModal
        isOpen={showAnswerModal}
        onClose={() => {
          setShowAnswerModal(false);
          setSelectedAnswerId(null);
          navigate(`/app/interview/${id}`);
        }}
        answerId={selectedAnswerId || undefined}
      />

      <PlanChoiceModal
        isOpen={showPlanChoiceModal}
        onClose={() => setShowPlanChoiceModal(false)}
        subscription={{
          subscriptionStatus: user?.subscriptionStatus,
          planType: user?.subscriptionStatus === 'premium' ? 'premium' : user?.subscriptionStatus === 'starter' ? 'starter' : undefined
        }}
      />
    </AppLayout>
  );
}