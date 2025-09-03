import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { ArrowLeft, Calendar, Clock, Target, CheckCircle, X, Star, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
// Toast system disabled to prevent modal interference
import { cn } from "@/lib/utils";
import QuestionContainer from "@/components/question/QuestionContainer";
import InterviewProgress from "@/components/InterviewProgress";
import AppLayout from "@/components/AppLayout";
import AnswerAnalysisModal from "@/components/answer-analysis/AnswerAnalysisModal";
import PlanChoiceModal from "@/components/payment/PlanChoiceModal";
import type { Interview, Answer, Question } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { showExistingAnswerModal } from "@/hooks/use-answer-analysis-modal";

// Import redesigned components
import InterviewHeader from "@/components/interview-redesigned/InterviewHeader";
import QuestionAnswerPanel from "@/components/interview-redesigned/QuestionAnswerPanel";
import ProgressSidebar from "@/components/interview-redesigned/ProgressSidebar";

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

// Simplified Interview Page - rebuilt from scratch
export default function InterviewPage() {
  const { interviewId: id, questionId } = useParams<{ interviewId: string; questionId?: string }>();
  const [location, navigate] = useLocation();
  
  // Check if we should use the redesigned view
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialRedesigned = searchParams.get('redesigned') === '1';
  const [useRedesigned, setUseRedesigned] = useState(initialRedesigned);
  
  // Get auth state early
  const { user: authUser } = useAuth();
  
  // Toast disabled to prevent modal interference
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showPlanChoiceModal, setShowPlanChoiceModal] = useState(false);
  
  // State for redesigned view - must be before any conditional returns
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('Interview page - useRedesigned:', useRedesigned);
    console.log('Interview page - authUser:', authUser);
    console.log('Interview page - location:', location);
  }, [useRedesigned, authUser, location]);
  
  // Fetch this specific interview with real-time updates
  const { data: interview, isLoading: interviewLoading, error: interviewError } = useQuery<Interview>({
    queryKey: ['/api/interviews', id],
    enabled: !!id,
    refetchInterval: false, // Disabled excessive polling
  });

  // Fetch answers for THIS specific interview only
  const { data: interviewAnswers = [], isLoading: answersLoading } = useQuery<Answer[]>({
    queryKey: [`/api/interviews/${id}/answers`],
    enabled: !!id,
  });

  // Get user session data (includes subscription info)
  const { user } = useAuth();

  // Get all questions for THIS interview and find current one
  const { data: questions = [], isLoading: questionLoading, error: questionError } = useQuery<Question[]>({
    queryKey: ['/api/questions', id],
    enabled: !!id,
  });

  // Calculate current question based on interview progress
  const currentQuestion = questions.length > 0 ? questions[interview?.currentQuestionIndex || 0] : null;

  // Components handle their own loading states - no page-level loading dialogue

  // Calculate progress - ensure counts are correct
  const totalQuestions = interview?.totalQuestions || 12;
  // Only count unique answers by questionId to avoid duplicates
  const uniqueAnsweredQuestions = new Set(interviewAnswers.map((answer: any) => answer.questionId));
  const answeredCount = Math.min(uniqueAnsweredQuestions.size, totalQuestions);
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const isCompleted = interview?.completedAt;
  
  // Handle questionId in URL - show modal if questionId is present
  useEffect(() => {
    // Check for questionId in URL to show answer modal
    if (questionId && interviewAnswers.length > 0 && !showAnswerModal) {
      // Find the answer for this questionId (UUID, no need to parse)
      const answer = interviewAnswers.find((a: any) => a.questionId === questionId);
      // Found answer for this question
      if (answer) {
        // Show answer modal for this question
        setSelectedAnswerId(answer.id);
        setShowAnswerModal(true);
      }
    }
  }, [questionId, interviewAnswers.length, showAnswerModal]);



  // Grade colors
  const gradeColors = {
    'oa': 'from-blue-400 to-blue-500',
    'co': 'from-cyan-400 to-cyan-500',
    'eo': 'from-teal-400 to-teal-500',
    'heo': 'from-indigo-400 to-indigo-500',
    'ap': 'from-purple-400 to-purple-500',
    'po': 'from-pink-400 to-pink-500',
    'apo': 'from-rose-400 to-rose-500'
  };
  const gradeColor = gradeColors[interview?.jobGrade as keyof typeof gradeColors] || 'from-indigo-400 to-indigo-500';

  // Handle answer click to show answer modal via global modal system
  const handleAnswerClick = async (answerId: string) => {
    console.log('Interview page handleAnswerClick called with answerId:', answerId);
    
    // Use the global modal system to show existing answer data
    showExistingAnswerModal(answerId);
  };

  // Interview state tracking available

  // Show error only if there's an actual error, not just loading
  if (interviewError || (interview === undefined && !interviewLoading)) {
    return (
      <AppLayout>
        <div className="w-full">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-destructive mb-4">Interview not found</p>
              <p className="text-sm text-gray-500 mb-4">
                Error: {interviewError?.message || 'Interview not found'} | ID: {id}
              </p>
              <Button onClick={() => navigate('/app')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Don't render main content until interview is loaded
  if (!interview) {
    return (
      <AppLayout>
        <div className="w-full">
          {/* Navigation Row */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/app')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          
          {/* Show minimal loading state */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  // Event handler for redesigned components
  const handleInterviewEvent = (event: InterviewEvent) => {
    console.log('Interview event:', event);
    
    switch (event.type) {
      case 'CLEAR_ANSWER':
        setCurrentAnswer('');
        break;
      
      case 'SUBMIT_ANSWER':
        // Handle submit answer
        console.log('Submit answer:', event.answer);
        break;
      
      case 'NEXT_QUESTION':
        // Handle next question
        console.log('Next question');
        break;
      
      case 'PREVIOUS_QUESTION':
        // Handle previous question
        console.log('Previous question');
        break;
      
      default:
        console.log('Unknown event type:', event);
    }
  };
  
  // If using redesigned view
  if (useRedesigned) {
    // Calculate progress
    const totalQuestions = interview.totalQuestions || 12;
    const uniqueAnsweredQuestions = new Set(interviewAnswers.map((answer: any) => answer.questionId));
    const answeredCount = Math.min(uniqueAnsweredQuestions.size, totalQuestions);
    const progressPercentage = (answeredCount / totalQuestions) * 100;
    const isCompleted = interview.completedAt;
    
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Navigation Row */}
          <div className="mb-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="flex items-center gap-1 text-xs p-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseRedesigned(false)}
              className="text-xs"
            >
              Back to Original View
            </Button>
          </div>
          
          {/* Compact Header */}
          <InterviewHeader 
            interview={interview}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            progressPercentage={progressPercentage}
            onEvent={handleInterviewEvent}
          />
          
          {/* Main Content Area */}
          <div className="flex flex-col gap-6 mt-6">
            {/* Main Question/Answer Panel */}
            <div className="w-full">
              {currentQuestion ? (
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
                  hasAnsweredCurrentQuestion={interviewAnswers.some(a => a.questionId === currentQuestion.id)}
                  canGoBack={(interview.currentQuestionIndex || 0) > 0}
                  canGoForward={(interview.currentQuestionIndex || 0) < totalQuestions - 1}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500">Loading question...</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Progress Bar - Now Below */}
            <div className="w-full">
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

  return (
    <AppLayout>
      {/* Main Container - below header, above footer */}
      <div className="w-full"> {/* Remove min-height that might cause layout conflicts */}
        
        {/* Navigation Row - Reduced space */}
        <div className="mb-2 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app')}
            className="flex items-center gap-1 text-xs p-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseRedesigned(true)}
            className="text-xs"
          >
            Try Redesigned View
          </Button>
        </div>

        {/* Interview Summary Container - Enhanced Design */}
        <div className="mb-4">
          <Card className="border-purple-200 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 overflow-hidden relative">
            {/* Decorative background elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full"></div>
            <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full"></div>
            
            <div className="flex">
              {/* Left gradient strip - more prominent */}
              <div className={`w-2 bg-gradient-to-b ${gradeColor} shadow-lg`}></div>
              
              <CardContent className="pt-4 pb-4 px-4 flex-1 relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex-1">
                    {/* Header with icon and title - Enhanced */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradeColor} flex items-center justify-center text-white font-bold shadow-xl flex-shrink-0`}>
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                          {interview?.jobTitle || 'HEO Interview'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge className={`${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'} text-white border-0 text-xs font-medium px-2 py-1 shadow-md`}>
                            {isCompleted ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                In Progress
                              </>
                            )}
                          </Badge>
                          <Badge className={`bg-gradient-to-r ${gradeColor} text-white border-0 text-xs font-bold px-2 py-1 shadow-md`}>
                            {interview?.jobGrade?.toUpperCase() || 'HEO'}
                          </Badge>
                          {interview?.framework === 'new' && (
                            <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-200 text-xs font-medium px-2 py-1">
                              New Framework
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Section - Enhanced */}
                    <div className="mb-3 bg-white/60 rounded-xl p-3 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-gray-800">Interview Progress</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-700">{answeredCount} / {totalQuestions}</div>
                          <div className="text-xs text-gray-600">Questions</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <InterviewProgress 
                        currentQuestionIndex={interview?.currentQuestionIndex || 0}
                        totalQuestions={totalQuestions}
                        interviewId={id}
                        compact={true}
                        onAnswerClick={handleAnswerClick}
                      />
                    </div>
                    
                    {/* Interview Details - Enhanced */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white/80 rounded-lg p-3 border border-white/50 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-600">Date</div>
                            <div className="font-bold text-gray-800">
                              {format(new Date(interview?.completedAt || interview?.startedAt || new Date()), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {interview?.duration && (
                        <div className="bg-white/80 rounded-lg p-3 border border-white/50 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <div>
                              <div className="text-sm text-gray-600">Duration</div>
                              <div className="font-bold text-gray-800">
                                {Math.floor(interview.duration / 60)}h {interview.duration % 60}m
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-white/80 rounded-lg p-3 border border-white/50 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-emerald-600" />
                          <div>
                            <div className="text-sm text-gray-600">Questions</div>
                            <div className="font-bold text-gray-800">{totalQuestions} total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Main Content Container - Full Width */}
        <div className="w-full">
          <QuestionContainer 
            interviewId={id}
            showPlanChoiceModal={() => setShowPlanChoiceModal(true)}
          />
        </div>

      </div>
      
      {/* Answer Analysis Modal */}
      <AnswerAnalysisModal
        isOpen={showAnswerModal}
        onClose={() => {
          // Close modal and reset state
          setShowAnswerModal(false);
          setSelectedAnswerId(null);
          navigate(`/app/interview/${id}`);
        }}
        answerId={selectedAnswerId || undefined}
      />

      {/* Plan Choice Modal */}
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