import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, Calendar, Clock, Target, Award, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getGradeById } from "@/lib/gradeConfiguration";
import { Button } from "@/components/ui/button";
import type { Interview, Answer } from "@shared/schema";

// Import child components
import OverallPerformance from "./OverallPerformance";
import CompetencyBreakdown from "./CompetencyBreakdown";
import QuestionDetailsList from "./QuestionDetailsList";
import KeyInsights from "./KeyInsights";
import QuestionDetailsModal from "../QuestionDetailsModal";
import { UUID } from "crypto";

interface InterviewSummaryPanelProps {
  interviewId: UUID | null;
  onClose: () => void;
}

export default function InterviewSummaryPanel({
  interviewId: interviewId,
  onClose,
}: InterviewSummaryPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

  // Fetch interview details
  const { data: interview, isLoading: sessionLoading } = useQuery<Interview>({
    queryKey: [`/api/interview/${interviewId}`],
    enabled: !!interviewId,
  });

  // Fetch answers for the interview  with enriched question data
  const { data: answers = [], isLoading: answersLoading } = useQuery<
    (Answer & { competency: string; questionText: string })[]
  >({
    queryKey: [`/api/interview/${interviewId}/answers`],
    enabled: !!interviewId,
  });

  const isLoading = sessionLoading || answersLoading;

  // Handle animation timing
  useEffect(() => {
    if (interviewId) {
      setIsAnimating(true);
    }
  }, [interviewId]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  };

  const handleExport = async () => {
    if (!interviewId) return;

    try {
      const response = await fetch(`/api/interview/${interviewId}/export`);
      if (!response.ok) throw new Error("Failed to export report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-report-${interviewId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  if (!interviewId) return null;

  // Calculate competency scores
  const competencyScores = answers.reduce(
    (acc, answer) => {
      if (answer.competency) {
        if (!acc[answer.competency]) {
          acc[answer.competency] = { total: 0, count: 0, scores: [] };
        }
        // Note: scores need to be fetched from ratings table
        // For now, we'll use a placeholder
        const score = 0; // TODO: fetch from ratings
        acc[answer.competency].total += score;
        acc[answer.competency].count += 1;
        acc[answer.competency].scores.push(score);
      }
      return acc;
    },
    {} as Record<string, { total: number; count: number; scores: number[] }>,
  );

  // Calculate the actual average score from answers
  const calculateAverageScore = () => {
    if (!answers || answers.length === 0) return 0;
    const totalScore = 0; // TODO: fetch from ratings
    const avgScore = totalScore / answers.length;
    return Math.round(avgScore * 10); // Convert from /10 to percentage
  };

  const averageScore = calculateAverageScore() || interview?.averageScore || 0;

  // Get grade-specific passing score
  const gradeConfig = interview
    ? getGradeById(interview.jobGrade || "heo")
    : null;
  const passingScore = gradeConfig?.passingScore || 60;

  // Calculate duration by summing time spent on each answer
  const calculateDuration = () => {
    if (!answers || answers.length === 0) return null;

    // Sum up timeSpent from all answers (in seconds)
    const totalSeconds = answers.reduce((sum, answer) => {
      return sum + (answer.timeSpent || 0);
    }, 0);

    return totalSeconds;
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[80%] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              Interview Summary
            </h2>
            {interview && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  {interview.jobTitle || "HEO Interview"}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {interview.startedAt &&
                    format(new Date(interview.startedAt as any), "dd MMM yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {interview.startedAt &&
                    format(new Date(interview.startedAt as any), "HH:mm")}
                </span>
              </div>
            )}
          </div>

          {/* Passed Badge in Middle - hidden on mobile */}
          {interview &&
            interview.completedAt &&
            averageScore >= passingScore && (
              <div className="hidden sm:flex items-center mr-4">
                <div className="px-3 sm:px-6 py-2 sm:py-3 rounded-full flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-bold text-sm sm:text-lg">PASSED</span>
                </div>
              </div>
            )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="rounded-full p-1.5 sm:p-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : interview ? (
            <div className="space-y-6">
              {/* Overall Performance Card */}
              <OverallPerformance
                session={interview}
                averageScore={averageScore}
                answersCount={answers.length}
                duration={calculateDuration()}
                passingScore={passingScore}
              />

              {/* Competency Breakdown */}
              <CompetencyBreakdown competencyScores={competencyScores} />

              {/* Individual Questions */}
              <QuestionDetailsList
                answers={answers}
                onQuestionClick={setSelectedAnswer}
              />

              {/* Summary Stats */}
              <KeyInsights competencyScores={competencyScores} />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Session not found
            </div>
          )}
        </div>
      </div>
      {/* Question Details Modal */}
      <QuestionDetailsModal
        answer={selectedAnswer}
        open={!!selectedAnswer}
        onOpenChange={(open) => !open && setSelectedAnswer(null)}
      />
    </>,
    document.body,
  );
}
