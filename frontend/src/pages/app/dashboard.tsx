import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import InterviewModal from "@/components/interview/InterviewModal";
import InterviewSummaryPanel from "@/components/interview-summary/InterviewSummaryPanel";
import PlanChoiceModal from "@/components/payment/PlanChoiceModal";

export default function DashboardPage() {
  const [newInterviewOpen, setNewInterviewOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [showPlanChoiceModal, setShowPlanChoiceModal] = useState(false);
  
  // Use auth hook for user session data (includes subscription info)
  const { user } = useAuth();

  // Fetch interviews data for limit checking
  const { data: interviews = [] } = useQuery<Array<any>>({
    queryKey: ["/api/interviews"],
  });

  // Handle new interview creation with subscription limits - using user session data
  const handleStartNewInterview = () => {
    // Check subscription status for interview limits

    // Check if user has reached their limit and should see upgrade modal
    if ((!user?.subscriptionStatus || user?.subscriptionStatus === "free" || user?.subscriptionStatus === "starter") && interviews.length >= 1) {
      console.log('DashboardPage: User limit reached - showing payment modal');
      setShowPlanChoiceModal(true);
      return;
    }

    // Check if starter subscription expired
    if (user?.subscriptionStatus === "starter" && user?.starterExpiresAt) {
      const expiryDate = new Date(user.starterExpiresAt);
      const now = new Date();
      if (now > expiryDate) {
        // Starter subscription expired
        setShowPlanChoiceModal(true);
        return;
      }
    }

    console.log('✅ Proceeding with new interview creation');
    setNewInterviewOpen(true);
  };

  // Debug modal state changes
  const handleNewInterviewOpenChange = (open: boolean) => {
    console.log('DashboardPage: Modal state change requested:', open, 'current:', newInterviewOpen);
    
    // Log the call stack to see what's triggering the close
    if (!open) {
      console.log('MODAL CLOSING - Stack trace:');
      console.trace();
    }
    
    setNewInterviewOpen(open);
  };

  return (
    <AppLayout>
      <Dashboard 
        onStartNewInterview={handleStartNewInterview}
        onViewInterview={(interviewId) => setSelectedInterviewId(interviewId)}
        subscription={user}
        showPlanChoiceModal={() => setShowPlanChoiceModal(true)}
      />
      
      <InterviewModal 
        open={newInterviewOpen}
        onOpenChange={handleNewInterviewOpenChange}
      />
      
      <PlanChoiceModal
        isOpen={showPlanChoiceModal}
        onClose={() => setShowPlanChoiceModal(false)}
        subscription={user}
      />
      
      {selectedInterviewId && (
        <InterviewSummaryPanel
          interviewId={selectedInterviewId as `${string}-${string}-${string}-${string}-${string}`}
          onClose={() => setSelectedInterviewId(null)}
        />
      )}
    </AppLayout>
  );
}