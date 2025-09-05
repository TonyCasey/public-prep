import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  showAnswerAnalysisModal,
  updateAnswerAnalysisModal,
  showAnswerAnalysisError,
} from "@/hooks/use-answer-analysis-modal";
import GlobalAnswerAnalysisModal from "@/components/modals/GlobalAnswerAnalysisModal";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Clock,
  Shield,
  ArrowDown,
  MessageSquare,
  Target,
  ArrowRight,
  User,
} from "lucide-react";
import logoHeaderPath from "@assets/logo_1753796611014.png";
import profileImagePath from "@assets/me_1752840229490.png";
import { toast } from "@/hooks/use-toast";

// Lazy load heavy components for better performance
const FeatureBoxes = lazy(() => import("@/components/FeatureBoxes"));
const SampleQuestionCard = lazy(
  () => import("@/components/SampleQuestionCard"),
);


// Memoized static objects to prevent re-creation
const SAMPLE_QUESTION = {
  text: "Tell me about a time when you had to lead a team through a challenging project or situation. What was your approach and what was the outcome?",
  competency: "Team Leadership",
  difficulty: "medium" as const,
};

export default function Home() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const isAnswerLongEnough = sampleAnswer.trim().length >= 100;

  const question = useMemo(() => SAMPLE_QUESTION, []);

  // Listen for voice transcript events from sample questions
  useEffect(() => {
    console.log('Home - Setting up voice transcript event listener');
    
    const handleVoiceTranscriptEvent = (event: CustomEvent) => {
      const { transcript, eventType } = event.detail;
      console.log('Home - Received voice transcript event:', { transcript, eventType });
      
      // Only handle sample question events, not interview question events
      if (eventType === 'sample-question') {
        console.log('Home - Processing sample question transcript:', transcript);
        setSampleAnswer(transcript);
      } else {
        console.log('Home - Ignoring non-sample-question event:', eventType);
      }
    };

    window.addEventListener('voiceTranscriptUpdate', handleVoiceTranscriptEvent as EventListener);
    
    return () => {
      console.log('Home - Removing voice transcript event listener');
      window.removeEventListener('voiceTranscriptUpdate', handleVoiceTranscriptEvent as EventListener);
    };
  }, []);

  const [evaluationStage, setEvaluationStage] = useState(0);

  const evaluateSampleAnswer = async () => {
    // Frontend security validation
    const trimmedAnswer = sampleAnswer.trim();

    if (!trimmedAnswer) {
      toast({
        title: "Please enter an answer",
        description:
          "Type or record your answer in the text box above to get AI feedback.",
        variant: "default",
      });
      return;
    }

    // Security checks
    if (trimmedAnswer.length < 100) {
      toast({
        title: "Answer too short",
        description:
          "Please provide a more detailed answer (minimum 100 characters).",
        variant: "destructive",
      });
      return;
    }

    if (trimmedAnswer.length > 5000) {
      toast({
        title: "Answer too long",
        description: "Please keep your answer under 5000 characters.",
        variant: "destructive",
      });
      return;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // XSS attempts
      /\bhttps?:\/\//g, // URLs
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedAnswer)) {
        toast({
          title: "Invalid content",
          description:
            "Please remove any links or script content from your answer.",
          variant: "destructive",
        });
        return;
      }
    }

    // Start evaluation process
    setIsEvaluating(true);
    setEvaluationStage(1);

    // Show modal immediately with loading state and basic info
    showAnswerAnalysisModal({
      questionText: question.text,
      competency: question.competency,
      userAnswer: trimmedAnswer,
      evaluationStage: 1,
      isLoading: true,
    });

    // Simulate realistic evaluation stages with modal updates
    const stages = [
      { stage: 2, delay: 1000 },
      { stage: 3, delay: 3000 },
      { stage: 4, delay: 6000 },
      { stage: 5, delay: 10000 },
    ];

    stages.forEach(({ stage, delay }) => {
      setTimeout(() => {
        setEvaluationStage(stage);
        updateAnswerAnalysisModal({ evaluationStage: stage });
      }, delay);
    });

    try {
      // Make actual API call to evaluate the sample answer
      const response = await fetch("/api/sample/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionText: question.text,
          answerText: trimmedAnswer,
          competency: question.competency.toLowerCase().replace(/\s+/g, "_"), // Convert "Team Leadership" to "team_leadership"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 503) {
          // OpenAI overload error - show in modal
          showAnswerAnalysisError(
            errorData.message ||
              "OpenAI seems to be busy at the moment. Please try again in a few minutes.",
            true,
            {
              questionText: question.text,
              competency: question.competency,
              userAnswer: trimmedAnswer,
            },
          );
          setIsEvaluating(false);
          return;
        }

        if (response.status === 429) {
          // Rate limiting error
          toast({
            title: "Too many requests",
            description:
              errorData.error ||
              "Please wait a few minutes before trying again.",
            variant: "destructive",
          });
          setIsEvaluating(false);
          return;
        }
        throw new Error("Failed to evaluate answer");
      }

      const apiResult = await response.json();

      // Update modal with final results progressively
      setTimeout(() => {
        updateAnswerAnalysisModal({
          overallScore: apiResult.overallScore || 0,
          competencyScores: {
            [question.competency]: apiResult.overallScore || 0,
          },
        });
      }, 1400);

      setTimeout(() => {
        updateAnswerAnalysisModal({
          starMethodAnalysis: apiResult.starMethodAnalysis || {
            situation: 0,
            task: 0,
            action: 0,
            result: 0,
          },
        });
      }, 1800);

      setTimeout(() => {
        updateAnswerAnalysisModal({
          strengths: apiResult.strengths || [],
          improvementAreas: apiResult.improvementAreas || [],
        });
      }, 2200);

      setTimeout(() => {
        updateAnswerAnalysisModal({
          feedback: apiResult.feedback || "",
        });
      }, 2600);

      setTimeout(() => {
        updateAnswerAnalysisModal({
          improvedAnswer: apiResult.improvedAnswer,
          isLoading: false,
          evaluationStage: 0,
        });
      }, 3000);

      // Complete evaluation
      setIsEvaluating(false);
      setEvaluationStage(0);
    } catch (error) {
      console.error("Sample evaluation error:", error);

      // Show error toast
      toast({
        title: "Evaluation failed",
        description:
          "Unable to evaluate at the moment. Please check your connection and try again.",
        variant: "destructive",
      });

      // Clear loading states on error
      setIsEvaluating(false);
      setEvaluationStage(0);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-pink-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-indigo-200/30 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Unified Layout - Logo Left, Button Right for all screen sizes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={logoHeaderPath}
                  alt="Public Prep"
                  className="h-24 w-auto hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() => navigate("/")}
                />
              </div>
              <nav className="flex items-center space-x-2 sm:space-x-8">
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  {user ? "Dashboard" : "Get Started"}
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center pt-20 pb-16">
              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                  Practice Questions for
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Public Sector Interviews <br />
                  in Ireland
                </span>
              </h1>
            </div>

            {/* Sample Question Section */}
            <div className="mb-16">
              <Suspense
                fallback={
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
                        <div className="h-32 bg-gray-200 rounded w-full mb-4"></div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                }
              >
                <SampleQuestionCard
                  question={question}
                  sampleAnswer={sampleAnswer}
                  setSampleAnswer={setSampleAnswer}
                  evaluateSampleAnswer={evaluateSampleAnswer}
                  isEvaluating={isEvaluating}
                  isAnswerLongEnough={isAnswerLongEnough}
                />
              </Suspense>
            </div>

            {/* What to Expect Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  What to Expect in Your Interview
                </span>
              </h2>

              <div className="max-w-4xl mx-auto">
                <Card className="border-0 shadow-2xl bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
                  <CardHeader className="pt-8 pb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                      Irish Public Service Interview Format
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600 dark:text-gray-400 text-lg">
                      Structured competency-based interviews following
                      standardized format
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl mb-3">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            3 Interviewers
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Panel of experienced public service professionals
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl mb-3">
                          <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            2 Questions Each
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Each interviewer asks 2 competency-based questions
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl mb-3">
                          <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            STAR Method
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Structure answers using Situation, Task, Action,
                            Result
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-xl">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <Shield className="h-5 w-5 text-blue-600 mr-2" />
                        Interview Process
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                            1
                          </div>
                          <span>
                            <strong>Welcome & Introduction:</strong> Brief
                            overview and introductions (5 minutes)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                            2
                          </div>
                          <span>
                            <strong>Competency Questions:</strong> 6 questions
                            testing different competencies (45-50 minutes)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                            3
                          </div>
                          <span>
                            <strong>Your Questions:</strong> Opportunity to ask
                            about the role and organization (5-10 minutes)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Features Grid */}
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl"
                    >
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="h-16 bg-gray-200 rounded mb-4"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <FeatureBoxes />
            </Suspense>

            {/* Grades and Frameworks */}
            <div className="mb-16">
              <h2 className="text-4xl font-bold mb-12 text-center">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Supporting All Public Service Grades & Both Frameworks
                </span>
              </h2>

              {/* Grades */}
              <div className="mb-12">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3 max-w-4xl mx-auto">
                  {[
                    {
                      code: "OA",
                      name: "Officer Admin",
                      color: "from-blue-400 to-blue-500",
                    },
                    {
                      code: "CO",
                      name: "Clerical Officer",
                      color: "from-cyan-400 to-cyan-500",
                    },
                    {
                      code: "EO",
                      name: "Executive Officer",
                      color: "from-teal-400 to-teal-500",
                    },
                    {
                      code: "HEO",
                      name: "Higher Exec Officer",
                      color: "from-indigo-400 to-indigo-500",
                    },
                    {
                      code: "AP",
                      name: "Admin Principal",
                      color: "from-purple-400 to-purple-500",
                    },
                    {
                      code: "PO",
                      name: "Principal Officer",
                      color: "from-pink-400 to-pink-500",
                    },
                    {
                      code: "APO",
                      name: "Asst Principal Officer",
                      color: "from-rose-400 to-rose-500",
                    },
                  ].map((grade) => (
                    <div key={grade.code} className="text-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`bg-gradient-to-r ${grade.color} p-3 rounded-full mb-2 shadow-lg`}
                        >
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div
                          className={`bg-gradient-to-r ${grade.color} text-white px-2 py-1 rounded-lg font-bold text-sm`}
                        >
                          {grade.code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frameworks */}
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-700">
                      Traditional 6-Competency Framework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Team Leadership
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Judgement, Analysis & Decision Making
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Management & Delivery of Results
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Interpersonal & Communication Skills
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Specialist Knowledge & Self Development
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Drive & Commitment
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-700">
                      New 4-Area Capability Framework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Building Future Readiness
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Leading and Empowering
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Evidence Informed Delivery
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Communicating and Collaborating
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Your competitive advantage
                </h2>
                <p className="text-lg lg:text-xl text-purple-100 mb-8">
                  Unbiased AI Feedback • Real Practice Questions • 24/7
                  Available
                </p>
                <Button
                  onClick={handleGetStarted}
                  className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {user ? "Go to Dashboard" : "Start Your Interview Prep"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Personal Branding Section */}
              <div className="pt-8 border-t border-white/20">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-center mb-4">
                    <img
                      src={profileImagePath}
                      alt="Tony Casey, Creator of Public Prep"
                      className="w-20 h-20 rounded-full mx-auto shadow-lg border-4 border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => navigate("/about")}
                    />
                  </div>
                  <blockquote className="text-white text-base italic leading-relaxed text-center mb-3">
                    "Practice, practice, practice"
                  </blockquote>
                  <p className="text-purple-200 text-center text-sm mb-3">
                    - Tony Casey, Creator
                  </p>
                  <div className="text-center">
                    <button
                      onClick={() => navigate("/about")}
                      className="text-purple-200 hover:text-white font-medium underline underline-offset-4 transition-colors text-sm"
                    >
                      Learn more about my story →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom padding for CTA section */}
        <div className="pb-20"></div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={logoHeaderPath}
                  alt="Public Prep Logo"
                  className="h-24 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-4">
                Helping candidates excel in Ireland's Public Service interviews with AI-powered preparation tools.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate("/")} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => navigate("/privacy")} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate("/terms")} className="hover:text-white transition-colors">Terms & Conditions</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate("/contact")} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><span className="text-gray-500">support@publicprep.ie</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Public Prep. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Global Answer Analysis Modal */}
      <GlobalAnswerAnalysisModal />
    </div>
  );
}
