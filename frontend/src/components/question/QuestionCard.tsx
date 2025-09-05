import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import { getCompetencyById } from "@/lib/competencies";
import type { Question } from "@shared/schema";

interface QuestionCardProps {
  question: Question | null;
  currentIndex: number;
  totalQuestions: number;
  framework?: string;
}

export default function QuestionCard({ 
  question, 
  currentIndex, 
  totalQuestions,
  framework 
}: QuestionCardProps) {
  if (!question) {
    return (
      <Card className="border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg">Loading Question...</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const competency = getCompetencyById(question.competency);
  const competencyName = competency?.name || question.competency
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Card className="border-purple-200 shadow-xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full"></div>
      <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full"></div>
      
      <CardHeader className="bg-gradient-to-r from-purple-100 via-pink-100/50 to-purple-100 relative border-b border-purple-200/50 pb-3">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-wrap items-center gap-1 flex-1 mr-2">
                <Badge variant="outline" className="bg-white/90 border-purple-200 shadow-sm font-medium text-xs px-1.5 py-0.5 whitespace-nowrap">
                  Question {currentIndex + 1} of {totalQuestions}
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md font-medium text-xs px-1.5 py-0.5 whitespace-nowrap">
                  {competencyName}
                </Badge>
                {framework && (
                  <Badge variant="secondary" className="bg-white/80 text-gray-700 border-gray-200 text-xs px-1.5 py-0.5 whitespace-nowrap">
                    {framework === 'new' ? 'New Framework' : 'Traditional'}
                  </Badge>
                )}
              </div>
              <div className="p-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex-shrink-0">
                <HelpCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">Interview Question</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-3 relative">
        <div className="bg-white/60 rounded-xl p-3 border border-white/50 shadow-sm">
          <p className="text-sm leading-relaxed text-gray-800 font-medium">{question.questionText}</p>
        </div>
      </CardContent>
    </Card>
  );
}