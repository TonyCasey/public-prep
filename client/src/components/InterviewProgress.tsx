import { useQuery, useQueries } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Check, Circle, Play } from "lucide-react";

interface InterviewProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  interviewId?: string;
  onAnswerClick?: (answerId: string) => void;
  compact?: boolean;
}

interface ProgressItem {
  index: number;
  questionId: string | null;
  answerId: string | null;
  status: 'completed' | 'current' | 'upcoming';
  score: number | null;
  competency: string | null;
}

export default function InterviewProgress({ 
  currentQuestionIndex, 
  totalQuestions, 
  interviewId,
  onAnswerClick,
  compact = false
}: InterviewProgressProps) {
  // Fetch questions specifically for this interview
  const { data: questions = [] } = useQuery({
    queryKey: ['/api/questions', interviewId],
    enabled: !!interviewId,
    queryFn: async () => {
      const response = await fetch(`/api/questions/${interviewId}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    }
  });

  // Get competency colors for both frameworks
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

  // Fetch latest answer for each question
  const answerQueries = useQueries({
    queries: questions.slice(0, totalQuestions).map((question: any) => ({
      queryKey: ['/api/answers/by-question', question.id],
      queryFn: async () => {
        if (!question.id) return null;
        const response = await fetch(`/api/answers/by-question/${question.id}`);
        if (!response.ok) {
          if (response.status === 404) return null; // No answer yet
          throw new Error('Failed to fetch answer');
        }
        const answers = await response.json();
        // Return the latest answer (answers are sorted by createdAt DESC)
        return answers.length > 0 ? answers[0] : null;
      },
      enabled: !!question.id
    }))
  });

  // Build progress items with answer data
  const progressItems: ProgressItem[] = questions.slice(0, totalQuestions).map((question: any, i: number) => {
    const answerQuery = answerQueries[i];
    const answer = answerQuery?.data as any;
    
    let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (i < currentQuestionIndex) status = 'completed';
    else if (i === currentQuestionIndex) status = 'current';
    
    return {
      index: i,
      questionId: question?.id || null,
      answerId: answer?.id || null,
      status,
      score: answer?.evaluation?.overallScore || answer?.score || null,
      competency: question?.competency || null
    };
  });

  const handleItemClick = (item: ProgressItem) => {
    console.log('InterviewProgress click detected!', item.status, item.answerId);
    if (item.status === 'completed' && item.answerId && onAnswerClick) {
      console.log('Bus stop click - answerId:', item.answerId, 'type:', typeof item.answerId);
      onAnswerClick(item.answerId);
    } else {
      console.log('Click conditions not met:', {
        status: item.status,
        hasAnswerId: !!item.answerId,
        hasCallback: !!onAnswerClick
      });
    }
  };

  // Compact mode - horizontal progress indicators
  if (compact) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-wrap gap-1.5 justify-end">
          {progressItems.map((item) => {
            const competencyColor = item.competency ? competencyColors[item.competency] : 'bg-gray-400';
            
            return (
              <div 
                key={item.index} 
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300",
                  item.status === 'completed' && 'bg-green-500 border-green-400 text-white cursor-pointer hover:bg-green-600',
                  item.status === 'current' && `${competencyColor} border-white text-white shadow-lg`,
                  item.status === 'upcoming' && 'bg-gray-100 border-gray-200 text-gray-500'
                )}
                title={`Question ${item.index + 1}${item.score ? ` (Score: ${item.score}/10)` : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {item.status === 'completed' ? (
                  item.score || <Check className="w-3 h-3" />
                ) : item.status === 'current' ? (
                  <Play className="w-2.5 h-2.5" />
                ) : (
                  item.index + 1
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full mode - vertical progress with details
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Interview Progress</h3>
      
      <div className="space-y-2">
        {progressItems.map((item) => {
          const competencyColor = item.competency ? competencyColors[item.competency] : 'bg-gray-400';
          
          return (
            <div 
              key={item.index}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-all",
                item.status === 'completed' && item.answerId && "cursor-pointer hover:bg-gray-50",
                item.status === 'current' && "bg-blue-50"
              )}
              onClick={() => handleItemClick(item)}
            >
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300",
                item.status === 'completed' && 'bg-green-500 border-green-400 text-white',
                item.status === 'current' && `${competencyColor} border-white text-white shadow-lg`,
                item.status === 'upcoming' && 'bg-gray-100 border-gray-200 text-gray-500'
              )}>
                {item.status === 'completed' ? (
                  item.score || <Check className="w-4 h-4" />
                ) : item.status === 'current' ? (
                  <Play className="w-3 h-3" />
                ) : (
                  item.index + 1
                )}
              </div>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">
                  Question {item.index + 1}
                  {item.competency && <span className="text-gray-500 ml-2">• {item.competency}</span>}
                </div>
                {item.status === 'completed' && item.score && (
                  <div className="text-xs text-gray-500">Score: {item.score}/10</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}