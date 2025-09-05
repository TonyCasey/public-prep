import { memo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Sparkles } from "lucide-react";
import arrowPath from "@assets/arrow.png";
import WebSpeechStreamingRecorder from "@/components/question/WebSpeechStreamingRecorder";

interface SampleQuestionCardProps {
  question: {
    text: string;
    competency: string;
    difficulty: string;
  };
  sampleAnswer: string;
  setSampleAnswer: (value: string) => void;
  evaluateSampleAnswer: () => void;
  isEvaluating: boolean;
  isAnswerLongEnough: boolean;
}

const SampleQuestionCard = memo(({ 
  question, 
  sampleAnswer, 
  setSampleAnswer, 
  evaluateSampleAnswer, 
  isEvaluating,
  isAnswerLongEnough 
}: SampleQuestionCardProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Arrow image replaced with Lucide icon

  const handleVoiceTranscript = (transcript: string) => {
    console.log('SampleQuestionCard - Voice transcript received:', transcript);
    console.log('SampleQuestionCard - Current answer before update:', sampleAnswer);
    setSampleAnswer(transcript);
    
    // Force update on mobile
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      console.log('Mobile detected - forcing textarea update in SampleQuestionCard');
      // Use setTimeout to ensure state update happens
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = transcript;
          textareaRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 10);
    }
  };

  const handleRecordingChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  // Auto-scroll to bottom when sampleAnswer changes
  useEffect(() => {
    if (textareaRef.current && sampleAnswer) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [sampleAnswer]);
  
  // Vimeo hosting configuration - brand-neutral video
  const vimeoVideoId = "1102484177";
  const vimeoEmbedUrl = `https://player.vimeo.com/video/${vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479`;
  const useExternalVideo = true; // Using Vimeo embed

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden mb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10"></div>
      <Card className="relative border-0 shadow-none bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Video Column - 1/4 width */}
          <div className="lg:col-span-1 p-6 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <div className="aspect-[9/16] rounded-lg overflow-hidden shadow-md bg-gray-100 w-full max-w-xs">
              {useExternalVideo ? (
                // Vimeo embed with portrait aspect ratio
                <div className="relative w-full h-full">
                  <iframe
                    src={vimeoEmbedUrl}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    title="Home Page Portrait"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                // Local video fallback
                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-lg font-semibold rounded">
                  Demo Video Placeholder
                </div>
              )}
            </div>
          </div>

          {/* Sample Question Content - 3/4 width */}
          <div className="lg:col-span-3">
            <CardHeader className="pb-6 pt-8 px-8">
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-200 leading-relaxed text-center">
                {question.text}
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="relative">
                {/* Arrow pointing to textarea */}
                {!sampleAnswer && (
                  <div className="hidden sm:block absolute left-[40px] -top-[40px] pointer-events-none z-10 transition-opacity duration-300">
                    <img
                      src={arrowPath}
                      alt="Arrow pointing to text input"
                      className="w-[8vw] h-[8vw] min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px] opacity-80"
                    />
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  placeholder="type or record your answer.."
                  className={`min-h-[180px] sm:min-h-[220px] max-h-[300px] sm:max-h-[400px] border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 transition-all duration-200 focus:shadow-lg focus:shadow-purple-500/10 resize-none overflow-y-auto placeholder:text-base sm:placeholder:text-lg md:placeholder:text-xl lg:placeholder:text-2xl placeholder:font-bold placeholder:text-purple-400 placeholder:text-center ${
                    sampleAnswer
                      ? "text-sm sm:text-base md:text-lg lg:text-xl text-left leading-relaxed"
                      : "text-base sm:text-lg text-center"
                  }`}
                  value={sampleAnswer}
                  onChange={(e) => setSampleAnswer(e.target.value)}
                />
                {sampleAnswer.length > 0 && sampleAnswer.length < 100 && (
                  <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-xs sm:text-sm text-gray-400 bg-white/80 rounded px-2 py-1 shadow-sm">
                    {sampleAnswer.length} characters
                  </div>
                )}
              </div>

              {/* Voice Recorder Section */}
              <div className="mt-4 sm:mt-6">
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg p-4 sm:p-6 mx-0">
                  <WebSpeechStreamingRecorder
                    onTranscriptUpdate={handleVoiceTranscript}
                    onRecordingChange={handleRecordingChange}
                    isDisabled={isEvaluating}
                    buttonSize="lg"
                    buttonVariant="default"
                    eventType="sample-question"
                  />
                </div>
              </div>

              {/* Character Counter Progress */}
              {sampleAnswer.trim().length > 0 && (
                <div className="mt-3 sm:mt-4 text-center px-2">
                  <span className={`text-xs sm:text-sm font-medium ${
                    sampleAnswer.trim().length >= 100 
                      ? 'text-green-600 animate-bounce' 
                      : sampleAnswer.trim().length >= 50 
                      ? 'text-orange-600' 
                      : 'text-gray-500'
                  }`}>
                    {sampleAnswer.trim().length >= 100 
                      ? '✓ Ready for AI feedback!' 
                      : `${sampleAnswer.trim().length}/100 characters needed for AI feedback`
                    }
                  </span>
                </div>
              )}

              <div className="flex justify-center mt-4 sm:mt-6 px-2">
                <Button
                  size="lg"
                  onClick={evaluateSampleAnswer}
                  disabled={isEvaluating || !isAnswerLongEnough}
                  className="w-full sm:w-auto relative group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl active:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed px-4 py-3 text-sm min-h-[52px] sm:px-8 sm:py-4 sm:text-base sm:min-h-[56px] md:px-10 md:text-lg md:min-h-[60px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <span className="relative flex items-center">
                    {isEvaluating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Analyzing Your Answer...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                        Get AI Scoring & Feedback
                      </>
                    )}
                  </span>
                </Button>
              </div>
              {!sampleAnswer.trim() && (
                <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 animate-pulse px-2">
                  ✨ Scored using Irish Public Service Competency Framework
                </p>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
});

SampleQuestionCard.displayName = "SampleQuestionCard";

export default SampleQuestionCard;