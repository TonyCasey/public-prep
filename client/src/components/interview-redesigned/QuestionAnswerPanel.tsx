import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  MicOff, 
  Trash2, 
  Send,
  HelpCircle,
  Timer,
  Target,
  Lightbulb,
  Zap,
  Trophy,
  Star
} from "lucide-react";
import type { Question } from "@shared/schema";
import type { InterviewEvent } from "@/pages/interview-redesigned";
import { getCompetencyById } from "@/lib/competencies";
import WebSpeechStreamingRecorder from "@/components/question/WebSpeechStreamingRecorder";
import { cn } from "@/lib/utils";

interface QuestionAnswerPanelProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onEvent: (event: InterviewEvent) => void;
  isEvaluating: boolean;
  timeElapsed: number;
  onTimeElapsedChange: (time: number) => void;
  hasAnsweredCurrentQuestion: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export default function QuestionAnswerPanel({
  question,
  currentIndex,
  totalQuestions,
  answer,
  onAnswerChange,
  onEvent,
  isEvaluating,
  timeElapsed,
  onTimeElapsedChange,
  hasAnsweredCurrentQuestion,
  canGoBack,
  canGoForward
}: QuestionAnswerPanelProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Timer logic
  useEffect(() => {
    if (!isPaused && !isEvaluating) {
      const interval = setInterval(() => {
        onTimeElapsedChange(timeElapsed + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeElapsed, isPaused, isEvaluating, onTimeElapsedChange]);
  
  const competency = getCompetencyById(question.competency);
  const competencyName = competency?.name || question.competency
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleVoiceTranscript = (transcript: string) => {
    onAnswerChange(transcript);
  };
  
  const handleRecordingChange = (recording: boolean) => {
    setIsRecording(recording);
  };
  
  const canSubmit = answer.trim().length > 0 && !isEvaluating;
  const canNavigateNext = hasAnsweredCurrentQuestion && canGoForward;
  
  // STAR Method data
  const starMethod = [
    {
      letter: "S",
      title: "Situation",
      description: "Set the scene",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      letter: "T",
      title: "Task",
      description: "Your responsibility",
      icon: Lightbulb,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      letter: "A",
      title: "Action",
      description: "Steps you took",
      icon: Zap,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      letter: "R",
      title: "Result",
      description: "The outcome",
      icon: Trophy,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    }
  ];
  
  return (
    <Card className="shadow-xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {competencyName}
            </Badge>
          </div>
          

        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question Section */}
        <div className="bg-white/60 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              Question
            </h3>
          </div>
          <p className="text-base leading-relaxed text-gray-800">{question.questionText}</p>
        </div>
        
        {/* STAR Method Guide - Inline Compact */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-purple-200/50">
          <div className="grid grid-cols-4 gap-2">
            {starMethod.map((item) => (
              <div key={item.letter} className={`${item.bgColor} p-2 rounded-md text-center`}>
                <div className={`font-bold ${item.color} text-lg`}>{item.letter}</div>
                <div className="text-xs font-medium text-gray-700">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Answer Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Your Answer</h3>
          </div>
          
          <div className="bg-white/80 rounded-xl border border-white/50 shadow-sm">
            <Textarea
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type or record your answer here using the STAR method..."
              className="min-h-[200px] resize-none border-0 bg-transparent text-base p-4 placeholder:text-gray-400"
              disabled={isPaused && !isEvaluating}
            />
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-3">
            {/* Voice Recording */}
            <div className="flex-1 min-w-[200px]">
              <WebSpeechStreamingRecorder
                onTranscriptUpdate={handleVoiceTranscript}
                onRecordingChange={handleRecordingChange}
                isDisabled={isPaused}
                buttonSize="default"
                buttonVariant="default"
                eventType="interview-question"
              />
            </div>
            
            {/* Clear Button */}
            <Button
              onClick={() => onEvent({ type: 'CLEAR_ANSWER' })}
              variant="outline"
              size="icon"
              disabled={!answer || isPaused}
              className="w-10 h-10 border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Submit Section */}
        <div className="border-t pt-6">
          <div className="flex justify-center">
            {/* Submit Answer Button */}
            {!hasAnsweredCurrentQuestion && (
              <Button
                onClick={() => onEvent({ 
                  type: 'SUBMIT_ANSWER', 
                  answer, 
                  timeElapsed 
                })}
                disabled={!canSubmit}
                className="min-w-[200px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                size="lg"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Progress: {currentIndex + 1} of {totalQuestions} questions
          </div>
        </div>
      </CardContent>
    </Card>
  );
}