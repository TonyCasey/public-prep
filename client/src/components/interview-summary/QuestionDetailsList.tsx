import { Clock, BarChart, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Answer } from "@shared/schema";

interface QuestionDetailsListProps {
  answers: (Answer & { competency: string; questionText: string })[];
  onQuestionClick: (answer: Answer) => void;
}

const competencyColors: Record<string, string> = {
  'Team Leadership': 'from-blue-500 to-blue-600',
  'Judgement, Analysis & Decision Making': 'from-purple-500 to-purple-600',
  'Management & Delivery of Results': 'from-green-500 to-green-600',
  'Interpersonal & Communication Skills': 'from-orange-500 to-orange-600',
  'Specialist Knowledge, Expertise & Self Development': 'from-red-500 to-red-600',
  'Specialist Knowledge, Expertise and Self Development': 'from-red-500 to-red-600',
  'Drive & Commitment': 'from-indigo-500 to-indigo-600'
};

export default function QuestionDetailsList({ answers, onQuestionClick }: QuestionDetailsListProps) {
  return (
    <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Question Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {answers.map((answer, index) => {
            // TODO: get score from ratings
            const answerScore = 0;
            const scoreColor = answerScore >= 80 ? 'from-green-400 to-green-600' :
                             answerScore >= 70 ? 'from-blue-400 to-blue-600' :
                             answerScore >= 60 ? 'from-purple-400 to-purple-600' :
                             answerScore >= 50 ? 'from-orange-400 to-orange-600' :
                             'from-red-400 to-red-600';
            
            const competencyColor = competencyColors[answer.competency] || 'from-gray-500 to-gray-600';
            
            return (
              <div 
                key={answer.id} 
                className="group relative overflow-hidden border-2 border-purple-200 rounded-xl p-3 sm:p-5 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5"
                onClick={() => onQuestionClick(answer)}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  {/* Header with competency and score */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r ${competencyColor} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <span className="text-white font-bold text-xs sm:text-sm">{index + 1}</span>
                      </div>
                      <p className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                        {answer.competency}
                      </p>
                    </div>
                    {/* Score circle - smaller and right aligned */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r ${scoreColor} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                      <span className="text-white font-bold text-sm sm:text-base">{answerScore}%</span>
                    </div>
                  </div>
                  
                  {/* Question text */}
                  <p className="text-gray-700 text-sm sm:text-base line-clamp-2 leading-relaxed mb-3">
                    {answer.questionText || 'Question details not available'}
                  </p>
                  
                  {/* Bottom info bar */}
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      {answer.timeSpent && (
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                          {Math.floor(answer.timeSpent / 60)}:{(answer.timeSpent % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                      <span className="text-gray-600 flex items-center gap-1 whitespace-nowrap">
                        <BarChart className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                        STAR Analysis
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:text-purple-600 transform group-hover:translate-x-1 transition-all duration-200 ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}