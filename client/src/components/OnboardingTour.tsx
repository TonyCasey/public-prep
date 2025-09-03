import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, FileText, Mic, Brain, BarChart, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: number;
  title: string;
  description: string;
  target: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: "Welcome to Public Prep!",
    description: "Let's take a quick tour to help you get the most out of your interview preparation journey.",
    target: "welcome",
    icon: Award
  },
  {
    id: 2,
    title: "Upload Your Documents",
    description: "Start by uploading your CV and job specification. Our AI will analyze them to create personalized interview questions.",
    target: ".upload-section",
    icon: FileText
  },
  {
    id: 3,
    title: "Practice Real Interview Questions",
    description: "Answer questions tailored to your experience level and the specific role. Use voice or text input.",
    target: ".practice-section",
    icon: Mic
  },
  {
    id: 4,
    title: "Get AI-Powered Feedback",
    description: "Receive instant, detailed feedback on your answers with STAR method analysis and improvement suggestions.",
    target: ".feedback-section",
    icon: Brain
  },
  {
    id: 5,
    title: "Track Your Progress",
    description: "Monitor your performance across all competencies and see your improvement over time.",
    target: ".analytics-section",
    icon: BarChart
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
      setIsVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem('hasSeenOnboardingTour', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" />
      
      {/* Tour Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="relative max-w-md w-full bg-white shadow-2xl animate-slideInUp">
          <div className="p-6 space-y-4">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-4">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "w-8 bg-gradient-to-r from-purple-600 to-pink-600"
                      : index < currentStep
                      ? "bg-purple-400"
                      : "bg-gray-300"
                  )}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-500"
              >
                Skip Tour
              </Button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 rounded-full p-1"
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>,
    document.body
  );
}