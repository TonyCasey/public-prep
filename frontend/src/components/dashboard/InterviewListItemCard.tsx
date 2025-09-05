import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Target, Eye, PlayCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { getGradeById } from "@/lib/gradeConfiguration";
import { toUUID, type Interview, type UUID } from "@shared/schema";

interface InterviewListItemCardProps {
  interview: Interview;
  index: number;
  totalSessions: number;
  onView: (interviewId: UUID) => void;
  onResume: (interviewId: UUID) => void;
  onDelete: (interviewId: UUID) => void;
}

export default function InterviewListItemCard({
  interview: interview,
  index,
  totalSessions,
  onView,
  onResume,
  onDelete,
}: InterviewListItemCardProps) {
  const grade = getGradeById(interview.jobGrade || "");
  const isCompleted = !!interview.completedAt;
  const interviewNumber = totalSessions - index;

  const handleCardClick = () => {
    const action = isCompleted ? onView : onResume;
    action(interview.id as UUID);
  };

  return (
    <Card
      className="cursor-pointer border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50/70 via-purple-50/60 to-pink-50/70 hover:from-blue-100 hover:via-purple-100/80 hover:to-pink-100/80 hover:border-purple-300"
      onClick={handleCardClick}
    >
      <CardContent className="p-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30"></div>
        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-25"></div>

        <div className="flex items-start justify-between mb-4 relative">
          <div className="space-y-1">
            <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Interview #{interviewNumber}
            </h3>
            <p className="text-sm text-gray-700 font-medium">
              {interview.jobTitle || "HEO Interview"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {grade && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-blue-200 font-medium uppercase text-xs px-2 py-1"
              >
                {grade.name}
              </Badge>
            )}
            {isCompleted && (interview as any).averageScore >= 60 && (
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                PASSED
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 border border-white/50 shadow-sm">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-gray-700 font-medium">
              {(() => {
                const dateValue = (interview as any).startedAt;
                if (!dateValue) return "Date not available";
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return "Invalid date";
                return format(date, "MMM d, yyyy");
              })()}
            </span>
          </div>

          {isCompleted && (interview as any).duration && (
            <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 border border-white/50 shadow-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 font-medium">
                {Math.floor((interview as any).duration / 60)}m duration
              </span>
            </div>
          )}

          {(interview as any).averageScore !== null && (
            <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 border border-white/50 shadow-sm">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700 font-medium">
                {(interview as any).averageScore}% score
              </span>
            </div>
          )}
        </div>

        <div
          className="mt-5 flex gap-3 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {isCompleted ? (
            <>
              <Button
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full hover:bg-blue-50 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80"
                onClick={() => onView(interview.id as UUID)}
              >
                <Eye className="w-5 h-5 text-blue-600" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80"
                onClick={() => onDelete(interview.id as UUID)}
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full hover:bg-green-50 hover:border-green-300 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80"
                onClick={() => onResume(interview.id as UUID)}
              >
                <PlayCircle className="w-5 h-5 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80"
                onClick={() => onDelete(interview.id as UUID)}
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
