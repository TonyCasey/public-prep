import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Clock, Target, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { Interview } from "@shared/schema";
import type { InterviewEvent } from "@/pages/interview-redesigned";

interface InterviewHeaderProps {
  interview: Interview;
  answeredCount: number;
  totalQuestions: number;
  progressPercentage: number;
  onEvent: (event: InterviewEvent) => void;
}

export default function InterviewHeader({
  interview,
  answeredCount,
  totalQuestions,
  progressPercentage,
  onEvent
}: InterviewHeaderProps) {
  const [, navigate] = useLocation();
  
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
  const gradeColor = gradeColors[interview.jobGrade as keyof typeof gradeColors] || 'from-indigo-400 to-indigo-500';
  const isCompleted = !!interview.completedAt;
  
  return (
    <div className="space-y-3">
      {/* Back Button */}
      <Button
        onClick={() => navigate('/app')}
        variant="ghost"
        size="sm"
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      
      {/* Compact Header Card */}
      <Card className="bg-gradient-to-br from-purple-50 via-pink-50/30 to-blue-50/30 border-purple-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Side - Interview Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-800">
                  {interview.jobTitle || 'Public Service Interview'}
                </h2>
                {interview.jobGrade && (
                  <Badge className={`bg-gradient-to-r ${gradeColor} text-white`}>
                    {interview.jobGrade.toUpperCase()}
                  </Badge>
                )}
                {interview.framework && (
                  <Badge variant="secondary" className="bg-white/80">
                    {interview.framework === 'new' ? 'New Framework' : 'Traditional'}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {interview.jobTitle}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(interview.startedAt || new Date()), 'dd MMM yyyy')}
                </span>
                {interview.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {interview.duration} min
                  </span>
                )}
              </div>
            </div>
            
            {/* Right Side - Progress */}
            <div className="sm:text-right">
              <div className="flex items-center gap-2 mb-1">
                {isCompleted && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              
              {/* Compact Progress Bar */}
              <div className="w-32 sm:w-40">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}