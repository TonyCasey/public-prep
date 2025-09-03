import { forwardRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Send,
  HelpCircle,
  Target,
  Lightbulb,
  Zap,
  Trophy,
  Mic,
  Trash2
} from "lucide-react";
import type { Question } from "@shared/schema";
import { getCompetencyById } from "@/lib/competencies";
import WebSpeechStreamingRecorder from "@/components/question/WebSpeechStreamingRecorder";

interface QuestionAnswerPanelProps {
  question: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  answer?: string;
  onAnswerChange?: (answer: string) => void;
  onAnswerSubmit?: (answer: string, timeElapsed: number) => void;
  isSubmitDisabled?: boolean;
  showSubmitButton?: boolean;
}

const QuestionAnswerPanelSimple = forwardRef<HTMLTextAreaElement, QuestionAnswerPanelProps>(
  ({ 
    question, 
    currentQuestionIndex, 
    totalQuestions,
    answer = '',
    onAnswerChange,
    onAnswerSubmit,
    isSubmitDisabled = false,
    showSubmitButton = true
  }, ref) => {
    const [timeElapsed, setTimeElapsed] = useState(0);
    
    // Timer logic
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }, []);
    
    // Reset timer when question changes
    useEffect(() => {
      setTimeElapsed(0);
    }, [question.id]);
    
    const competency = getCompetencyById(question.competency);
    const competencyName = competency?.name || question.competency
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const handleSubmit = () => {
      if (onAnswerSubmit && answer.trim() && !isSubmitDisabled) {
        onAnswerSubmit(answer, timeElapsed);
      }
    };
    
    const handleClear = () => {
      if (onAnswerChange) {
        onAnswerChange('');
      }
    };
    
    const handleRecordingComplete = (transcript: string) => {
      if (onAnswerChange) {
        onAnswerChange(answer + (answer ? ' ' : '') + transcript);
      }
    };
    
    const starMethod = [
      {
        letter: "S",
        title: "Situation",
        description: "Set the context",
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
    
    // Progress calculation
    const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    
    return (
      <Card className="shadow-lg bg-gradient-to-br from-white via-purple-50/10 to-pink-50/10 border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
              {competencyName}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5">
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
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-purple-200/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {starMethod.map((item) => (
                <div key={item.letter} className={`${item.bgColor} p-2 rounded-md text-center`}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`font-bold text-base ${item.color}`}>{item.letter}</div>
                    <div className="text-xs font-medium text-gray-700">{item.title}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Answer Section */}
          <div className="space-y-4">
            <Textarea
              ref={ref}
              value={answer}
              onChange={(e) => onAnswerChange?.(e.target.value)}
              placeholder="Type your answer here..."
              disabled={!showSubmitButton} // Disable when question is answered
              className={`min-h-[250px] resize-none border-gray-200 text-gray-700 placeholder:text-gray-400 ${
                !showSubmitButton 
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600' // Answered state styling
                  : 'bg-white/80 focus:border-purple-400' // Active state styling
              }`}
            />
            
            {/* Voice Recording & Clear Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-2 items-center">
                <WebSpeechStreamingRecorder
                  onTranscriptUpdate={handleRecordingComplete}
                  buttonSize="default"
                />
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="default"
                  className="h-10 px-3 border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  disabled={!answer}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Mic className="w-3 h-3" />
                <span className="hidden sm:inline">On mobile? Use keyboard microphone</span>
                <span className="sm:hidden">Use keyboard microphone</span>
              </div>
            </div>
            
            {/* Submit Button */}
            {showSubmitButton && (
              <div className="pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Answer
                </Button>
              </div>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Question {currentQuestionIndex + 1}</span>
              <span>{totalQuestions} total</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  }
);

QuestionAnswerPanelSimple.displayName = 'QuestionAnswerPanelSimple';

export default QuestionAnswerPanelSimple;