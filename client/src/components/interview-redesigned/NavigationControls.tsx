import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import type { InterviewEvent } from "@/pages/interview-redesigned";

interface NavigationControlsProps {
  currentIndex: number;
  totalQuestions: number;
  canGoBack: boolean;
  canGoForward: boolean;
  hasAnsweredCurrentQuestion: boolean;
  onEvent: (event: InterviewEvent) => void;
}

export default function NavigationControls({
  currentIndex,
  totalQuestions,
  canGoBack,
  canGoForward,
  hasAnsweredCurrentQuestion,
  onEvent
}: NavigationControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <Button
        onClick={() => onEvent({ type: 'PREVIOUS_QUESTION' })}
        variant="outline"
        disabled={!canGoBack}
        size="sm"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>
      
      <div className="text-sm text-gray-600 font-medium">
        Question {currentIndex + 1} of {totalQuestions}
      </div>
      
      <Button
        onClick={() => onEvent({ type: 'NEXT_QUESTION' })}
        disabled={!canGoForward || !hasAnsweredCurrentQuestion}
        size="sm"
        variant={hasAnsweredCurrentQuestion ? "default" : "outline"}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}