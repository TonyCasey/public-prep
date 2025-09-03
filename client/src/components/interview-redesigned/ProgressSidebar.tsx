import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { Question, Answer } from "@shared/schema";
import type { InterviewEvent } from "@/pages/interview-redesigned";
import { getCompetencyById } from "@/lib/competencies";
import { cn } from "@/lib/utils";

interface ProgressSidebarProps {
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  onEvent: (event: InterviewEvent) => void;
}

interface ProgressItem {
  index: number;
  question: Question;
  answer?: Answer;
  status: 'completed' | 'current' | 'upcoming';
  score?: number;
}

export default function ProgressSidebar({
  questions,
  answers,
  currentQuestionIndex,
  onEvent
}: ProgressSidebarProps) {
  
  // Build progress items
  const progressItems: ProgressItem[] = questions.map((question, index) => {
    const answer = answers.find(a => a.questionId === question.id);
    const status = index < currentQuestionIndex ? 'completed' : 
                   index === currentQuestionIndex ? 'current' : 'upcoming';
                   
    return {
      index,
      question,
      answer,
      status,
      score: undefined // TODO: Fetch from ratings table
    };
  });
  
  // Competency colors
  const competencyColors: Record<string, string> = {
    // Traditional 6-competency framework
    'Team Leadership': 'bg-blue-500',
    'Judgement, Analysis & Decision Making': 'bg-purple-500', 
    'Management & Delivery of Results': 'bg-green-500',
    'Interpersonal & Communication Skills': 'bg-orange-500',
    'Specialist Knowledge, Expertise and Self Development': 'bg-red-500',
    'Drive & Commitment': 'bg-indigo-500',
    // New 4-area Capability Framework
    'Building Future Readiness': 'bg-emerald-500',
    'Leading and Empowering': 'bg-red-500',
    'Evidence Informed Delivery': 'bg-blue-500',
    'Communicating and Collaborating': 'bg-amber-500'
  };
  
  const getCompetencyColor = (competencyId: string) => {
    const competency = getCompetencyById(competencyId);
    return competencyColors[competency?.name || ''] || 'bg-gray-500';
  };
  
  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          Question Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {progressItems.map((item) => {
            const isClickable = item.status === 'completed' && item.answer;
            const competencyColor = getCompetencyColor(item.question.competency);
            
            return (
              <button
                key={item.index}
                className={cn(
                  "relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  // Base styling
                  item.status === 'upcoming' && "bg-gray-100 text-gray-400 border-2 border-gray-200",
                  item.status === 'current' && "bg-purple-100 text-purple-700 border-2 border-purple-400 animate-pulse",
                  item.status === 'completed' && "bg-green-100 text-green-700 border-2 border-green-400",
                  // Hover states
                  isClickable && "hover:scale-110 cursor-pointer"
                )}
                onClick={() => {
                  if (isClickable && item.answer) {
                    onEvent({ type: 'VIEW_ANSWER', answerId: item.answer.id });
                  }
                }}
                disabled={!isClickable}
              >
                {item.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{item.index + 1}</span>
                )}
                
                {/* Competency color indicator */}
                <div 
                  className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white",
                    competencyColor
                  )}
                />
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-400" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-400" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200" />
              <span>Upcoming</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}