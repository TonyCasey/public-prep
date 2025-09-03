import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCRMTracking } from "@/hooks/use-crm-tracking";
// Remove usePaymentModal import - using props instead

import type { Interview } from "@shared/schema";

// Import child components
import LoadingDashboard from "./LoadingDashboard";
import EmptyDashboard from "./EmptyDashboard";
import DashboardStats from "./DashboardStats";
import QuotaDisplay from "./QuotaDisplay";
import AchievementBadges from "./AchievementBadges";
import InterviewListItemCard from "./InterviewListItemCard";
import OnboardingTour from "../OnboardingTour";

interface DashboardProps {
  onStartNewInterview?: () => void;
  onViewInterview?: (interviewId: string) => void;
  showPlanChoiceModal?: () => void;
  subscription?: any; // Optional - for display purposes only
}

export default function Dashboard({
  onStartNewInterview,
  onViewInterview,
  showPlanChoiceModal,
  subscription,
}: DashboardProps) {
  const [deleteInterviewId, setDeleteInterviewId] = useState<string | null>(
    null,
  );
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [, setLocation] = useLocation();
  const { trackFeature } = useCRMTracking();

  // Fetch data
  const { data: interviews = [], isLoading: sessionsLoading } = useQuery<
    Interview[]
  >({
    queryKey: ["/api/interviews"],
  });

  // Remove duplicate subscription query - let parent handle it
  // const { data: subscription } = useQuery({
  //   queryKey: ["/api/user/subscription"],
  //   staleTime: 30 * 1000,
  // });

  // Calculate statistics
  const stats = {
    totalInterviews: interviews.length,
    passRate: interviews.length > 0 ? (interviews.filter(i => (i as any).averageScore >= 60).length / interviews.length) * 100 : 0,
    averageScore: interviews.length > 0 ? interviews.reduce((sum, i) => sum + ((i as any).averageScore || 0), 0) / interviews.length : 0,
    highestScore: interviews.length > 0 ? Math.max(...interviews.map(i => (i as any).averageScore || 0)) : 0
  };

  // Delete interview mutation
  const deleteInterviewMutation = useMutation({
    mutationFn: async (interviewId: string) => {
      return apiRequest("DELETE", `/api/interviews/${interviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      setDeleteInterviewId(null);
    },
    onError: () => {
      setDeleteInterviewId(null);
    },
  });

  const handleNewInterview = () => {
    trackFeature("interview_create_attempt");
    onStartNewInterview?.();
  };

  const handleViewInterview = (interviewId: string) => {
    onViewInterview?.(interviewId);
  };

  const handleResumeInterview = (interviewId: string) => {
    setLocation(`/app/interview/${interviewId}`);
  };

  const handleDeleteInterview = (interviewId: string) => {
    setDeleteInterviewId(interviewId);
  };

  const confirmDelete = () => {
    if (deleteInterviewId) {
      deleteInterviewMutation.mutate(deleteInterviewId);
    }
  };

  if (sessionsLoading) {
    return <LoadingDashboard />;
  }

  if (interviews.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyDashboard onStartInterview={handleNewInterview} />
      </div>
    );
  }

  const sortedInterviews = [...interviews].sort((a, b) => {
    const dateA = new Date((a as any).createdAt || new Date()).getTime();
    const dateB = new Date((b as any).createdAt || new Date()).getTime();
    return dateB - dateA;
  });

  return (
    <>
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Interview Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {/* Quota badges */}
            {subscription?.subscriptionStatus === "starter" && (
              <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-200 whitespace-nowrap">
                <span className="font-medium">
                  {Math.max(0, 1 - interviews.length)} of 1 interview remaining
                </span>
              </div>
            )}
            {subscription?.subscriptionStatus === "free" && (
              <div className="text-xs sm:text-sm text-gray-600 bg-orange-50 px-2 sm:px-3 py-1 rounded-full border border-orange-200 whitespace-nowrap">
                <span className="font-medium">
                  Free trial - upgrade to practice
                </span>
              </div>
            )}
            <Button
              onClick={() => {
                const subscriptionStatus = subscription?.subscriptionStatus;
                
                switch (true) {
                  // Free users (undefined status) with 1+ interviews should see upgrade modal
                  case (!subscriptionStatus && interviews.length >= 1):
                  // Starter users with 1+ interviews should see upgrade modal  
                  case (subscriptionStatus === "starter" && interviews.length >= 1):
                    trackFeature("subscription_limit_reached");
                    showPlanChoiceModal?.();
                    break;
                  // Premium users or users with no interviews can proceed
                  default:
                    handleNewInterview();
                    break;
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Interview
            </Button>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats
          stats={{
            totalInterviews: stats.totalInterviews,
            passRate: stats.passRate,
            averageScore: stats.averageScore,
            highestScore: stats.highestScore,
          }}
        />

        {/* Quota Display */}
        <QuotaDisplay
          subscription={{
            status: subscription?.subscriptionStatus || "free",
            planType: subscription?.planType,
            expiresAt: subscription?.expiresAt,
          }}
          interviewsCompleted={interviews.length}
          onUpgradeClick={() => showPlanChoiceModal?.()}
        />

        {/* Interview List */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Interviews
          </h2>
          <div className="space-y-4">
            {sortedInterviews.map((session, index) => (
              <InterviewListItemCard
                key={session.id}
                interview={session}
                index={index}
                totalSessions={sortedInterviews.length}
                onView={handleViewInterview}
                onResume={handleResumeInterview}
                onDelete={handleDeleteInterview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteInterviewId}
        onOpenChange={() => setDeleteInterviewId(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this interview session and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </>
  );
}

