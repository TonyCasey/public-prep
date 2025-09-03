import { useState, useEffect, useRef } from "react";
import {
  Brain,
  FileText,
  MessageSquare,
  Target,
  CheckCircle,
  Sparkles,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";

interface LoadingAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function LoadingAnimation({
  isVisible,
  onComplete,
}: LoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [, navigate] = useLocation();

  const steps = [
    {
      icon: FileText,
      title: "Analyzing Your CV",
      description: "AI is reading through your experience and qualifications",
      duration: 2000,
      color: "blue",
    },
    {
      icon: Brain,
      title: "Understanding Requirements",
      description: "Matching your profile to job requirements",
      duration: 2000,
      color: "purple",
    },
    {
      icon: Target,
      title: "Crafting Questions",
      description: "Generating personalized interview questions",
      duration: 4000,
      color: "green",
    },
    {
      icon: MessageSquare,
      title: "Preparing Interview",
      description: "Setting up your personalized interview experience",
      duration: 2000,
      color: "orange",
    },
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    // Reset state when starting
    setCurrentStep(0);
    setCompletedSteps([]);

    let timeouts: NodeJS.Timeout[] = [];

    const runStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) return;

      // Set step as active
      setCurrentStep(stepIndex);

      // Auto-scroll to active step
      setTimeout(() => {
        if (stepRefs.current[stepIndex] && containerRef.current) {
          stepRefs.current[stepIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);

      // After duration, mark as completed and move to next
      const timeout = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIndex]);

        // Check if this is the last step
        if (stepIndex === steps.length - 1) {
          // This is the final step - handle completion immediately
          const completionTimeout = setTimeout(() => {
            console.log("Mobile Debug: LoadingAnimation completed all steps");

            // Check for pending navigation and redirect immediately
            const pendingInterviewId = sessionStorage.getItem(
              "pendingNavigationInterviewId",
            );
            console.log(
              "LoadingAnimation completion: Checking for pendingInterviewId:",
              pendingInterviewId,
            );

            if (pendingInterviewId) {
              console.log(
                "LoadingAnimation: Found session ID, redirecting to:",
                `/app/interview/${pendingInterviewId}`,
              );
              sessionStorage.removeItem("pendingNavigationInterviewId");

              // Close modal and redirect immediately
              if (onComplete) {
                onComplete();
              }

              // Force redirect to the interview
              console.log("LoadingAnimation: Executing redirect...");
              window.location.href = `/app/interview/${pendingInterviewId}`;
            } else {
              console.log(
                "LoadingAnimation: No session ID found, just closing modal",
              );
              // No redirect needed, just close modal
              if (onComplete) {
                onComplete();
              }
            }
          }, 500); // Shorter delay - 500ms only

          timeouts.push(completionTimeout);
        } else {
          // Move to next step after small delay for visual clarity
          const nextTimeout = setTimeout(() => {
            runStep(stepIndex + 1);
          }, 300);

          timeouts.push(nextTimeout);
        }
      }, steps[stepIndex].duration);

      timeouts.push(timeout);
    };

    // Start the first step
    runStep(0);

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-3">
      <div
        ref={containerRef}
        className="bg-white rounded-xl p-4 sm:p-6 max-w-md sm:max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl scroll-smooth"
      >
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 animate-pulse">
            <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            Creating Your Interview
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            AI is preparing personalized questions just for you
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-2 sm:space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = completedSteps.includes(index);
            const colorClasses = {
              blue: "from-blue-500 to-blue-600",
              purple: "from-purple-500 to-purple-600",
              green: "from-green-500 to-green-600",
              orange: "from-orange-500 to-orange-600",
            }[step.color];

            return (
              <div
                key={index}
                ref={(el) => (stepRefs.current[index] = el)}
                className={`flex items-center p-2 sm:p-3 rounded-lg border transition-all duration-500 ${
                  isCompleted
                    ? "border-green-300 bg-green-50"
                    : isActive
                      ? step.color === "blue"
                        ? "border-blue-300 bg-blue-50 shadow-md scale-105"
                        : step.color === "purple"
                          ? "border-purple-300 bg-purple-50 shadow-md scale-105"
                          : step.color === "green"
                            ? "border-green-300 bg-green-50 shadow-md scale-105"
                            : "border-orange-300 bg-orange-50 shadow-md scale-105"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 transition-all duration-500 ${
                    isCompleted
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : isActive
                        ? `bg-gradient-to-br ${colorClasses} animate-pulse`
                        : "bg-gray-200"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-white" : "text-gray-500"}`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm sm:text-base font-semibold transition-colors ${
                      isCompleted
                        ? "text-green-900"
                        : isActive
                          ? step.color === "blue"
                            ? "text-blue-900"
                            : step.color === "purple"
                              ? "text-purple-900"
                              : step.color === "green"
                                ? "text-green-900"
                                : "text-orange-900"
                          : "text-gray-700"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm transition-colors ${
                      isCompleted
                        ? "text-green-700"
                        : isActive
                          ? step.color === "blue"
                            ? "text-blue-700"
                            : step.color === "purple"
                              ? "text-purple-700"
                              : step.color === "green"
                                ? "text-green-700"
                                : "text-orange-700"
                          : "text-gray-500"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Loading Spinner for Active Step */}
                {isActive && (
                  <div className="ml-2 flex-shrink-0">
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full animate-spin border-t-transparent ${
                        step.color === "blue"
                          ? "border-blue-500"
                          : step.color === "purple"
                            ? "border-purple-500"
                            : step.color === "green"
                              ? "border-green-500"
                              : "border-orange-500"
                      }`}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 sm:mt-4 text-center">
          <div className="flex items-center justify-center text-xs text-gray-500 mb-1 sm:mb-2">
            <Clock className="w-3 h-3 mr-1" />
            This usually takes 10-15 seconds
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${((completedSteps.length + (currentStep < steps.length ? 0.5 : 0)) / steps.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
