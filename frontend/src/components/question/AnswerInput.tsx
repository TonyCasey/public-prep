import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ChevronRight, Mic } from "lucide-react";
import WebSpeechStreamingRecorder from "./WebSpeechStreamingRecorder";

interface AnswerInputProps {
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  isPaused: boolean;
  isEvaluating: boolean;
  hasQuestionData: boolean;
  onNextQuestion?: () => void;
  canGoForward?: boolean;
  hasAnsweredCurrentQuestion?: boolean;
  currentQuestionIndex?: number;
  totalQuestions?: number;
}

export default function AnswerInput({
  answer,
  onAnswerChange,
  onSubmit,
  isPaused,
  isEvaluating,
  hasQuestionData,
  onNextQuestion,
  canGoForward = false,
  hasAnsweredCurrentQuestion = false,
  currentQuestionIndex = 0,
  totalQuestions = 12,
}: AnswerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const characterCount = answer.length;

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [answer]);

  // Listen for voice transcript events
  useEffect(() => {
    const handleVoiceTranscriptEvent = (event: CustomEvent) => {
      const { transcript, eventType, isPartial } = event.detail;
      // Only handle interview question events, not sample question events
      if (eventType === "interview-question") {
        console.log("AnswerInput - Received interview transcript event:", {
          transcript,
          eventType,
          isPartial,
        });

        // For partial updates, replace the text (it includes both final and interim)
        // For final updates, the transcript is already the complete text
        onAnswerChange(transcript);
      }
    };

    window.addEventListener(
      "voiceTranscriptUpdate",
      handleVoiceTranscriptEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "voiceTranscriptUpdate",
        handleVoiceTranscriptEvent as EventListener,
      );
    };
  }, [onAnswerChange]);

  const clearAnswer = () => {
    onAnswerChange("");
    textareaRef.current?.focus();
  };

  const handleVoiceTranscript = (transcript: string) => {
    console.log("AnswerInput - Voice transcript received:", transcript);
    console.log("AnswerInput - Current answer before update:", answer);
    // The transcript from WebSpeechStreamingRecorder already includes all text
    onAnswerChange(transcript);

    // Force update on mobile
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      console.log("Mobile detected - forcing textarea update");
      // Use setTimeout to ensure state update happens
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = transcript;
          textareaRef.current.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
        }
      }, 0);
    }
  };

  const handleRecordingChange = (isRecording: boolean) => {
    console.log("AnswerInput - Recording state changed:", isRecording);
  };

  return (
    <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20">
      <CardContent className="pt-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full"></div>

        <div className="space-y-4 relative">
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="answer"
              className="text-lg font-bold text-gray-800 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              Your Answer
            </label>
            <div className="bg-white/80 rounded-full px-3 py-1 border border-gray-200 shadow-sm">
              <span
                className={`text-sm font-medium ${characterCount > 1500 ? "text-red-600" : "text-gray-600"}`}
              >
                {characterCount} characters
              </span>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl border border-white/50 shadow-sm p-1">
            <Textarea
              ref={textareaRef}
              id="answer"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type or record your answer here using the STAR method..."
              className="min-h-[200px] resize-none border-0 bg-transparent focus:ring-0 text-base"
              disabled={isPaused && !isEvaluating}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/80 rounded-lg border border-white/50 shadow-sm p-2">
              <WebSpeechStreamingRecorder
                onTranscriptUpdate={handleVoiceTranscript}
                onRecordingChange={handleRecordingChange}
                isDisabled={isPaused || !hasQuestionData}
                buttonSize="default"
                buttonVariant="default"
                eventType="interview-question"
              />
            </div>

            <Button
              onClick={clearAnswer}
              variant="outline"
              size="default"
              disabled={!answer || isPaused}
              className="w-full h-12 bg-white/90 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Clear</span>
            </Button>
          </div>

          <Button
            onClick={onSubmit}
            disabled={!answer.trim() || isEvaluating || !hasQuestionData}
            className="w-full h-14 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
          >
            <span className="flex items-center justify-center space-x-2">
              {isEvaluating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </span>
          </Button>

          {/* Beautiful Navigation Controls */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
                Question Navigation
              </h3>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>
            
            <div className="flex justify-center">
              {/* Next Button - Full Width */}
              <Button
                onClick={onNextQuestion}
                disabled={!canGoForward || isEvaluating || !hasAnsweredCurrentQuestion}
                className="w-full h-12 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group text-sm sm:text-base"
                title={!hasAnsweredCurrentQuestion ? "Please answer the current question before proceeding" : "Continue to next question"}
              >
                <span className="font-medium">
                  {!hasAnsweredCurrentQuestion ? "Answer Question First" : "Next Question"}
                </span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
