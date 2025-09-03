import { CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OverallPerformanceProps {
  session: any;
  averageScore: number;
  answersCount: number;
  duration: number | null;
  passingScore: number;
}

export function formatDuration(seconds: number | null) {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function OverallPerformance({ 
  session, 
  averageScore, 
  answersCount, 
  duration,
  passingScore 
}: OverallPerformanceProps) {
  return (
    <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Overall Performance</span>
          <Badge className="text-lg px-3 py-1">
            {session.completedAt ? 'Completed' : 'In Progress'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {averageScore}%
            </div>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {session.completedQuestions || answersCount}/{session.totalQuestions}
            </div>
            <p className="text-sm text-gray-600">Questions Answered</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {formatDuration(session.duration || duration)}
            </div>
            <p className="text-sm text-gray-600">Duration</p>
          </div>
        </div>
        
        {/* Pass/Fail Status */}
        <div className="mt-6 mb-6">
          <div className={cn(
            "p-4 rounded-lg border-2 flex items-center justify-between transition-all",
            averageScore >= passingScore 
              ? "bg-green-50 border-green-300" 
              : "bg-amber-50 border-amber-300"
          )}>
            <div className="flex items-center gap-3">
              {averageScore >= passingScore ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Interview Standard Met</p>
                    <p className="text-sm text-green-700">You've achieved the minimum {passingScore}% requirement</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Below Interview Standard</p>
                    <p className="text-sm text-amber-700">Minimum {passingScore}% required • Currently at {averageScore}%</p>
                  </div>
                </>
              )}
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full font-medium text-sm",
              averageScore >= passingScore 
                ? "bg-green-200 text-green-800" 
                : "bg-amber-200 text-amber-800"
            )}>
              {averageScore >= passingScore ? 'PASSED' : `${passingScore - averageScore}% TO PASS`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}