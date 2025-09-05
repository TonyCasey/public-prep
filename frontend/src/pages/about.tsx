import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Target,
  Users,
  Award,
  Heart,
  Code,
  Lightbulb,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import logoHeaderPath from "@assets/logo-header.png";
import profileImagePath from "@assets/me_1752840229490.png";

export default function About() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={logoHeaderPath}
              alt="Public Prep"
              className="h-12 w-auto hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <img
              src={profileImagePath}
              alt="About the Creator"
              className="w-48 h-48 rounded-full mx-auto shadow-2xl border-4 border-white"
            />
            <div className="absolute -bottom-4 -right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg">
              <Heart className="w-6 h-6" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              About Tony Casey
            </span>
          </h1>

          <div className="max-w-3xl mx-auto">
            <blockquote className="text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed mb-8">
              "The missing piece in interview preparation"
            </blockquote>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              After working with an excellent interview coach who gave me
              invaluable strategic advice, I realized there was still a gap in
              my preparation. I needed somewhere to practice my STAR method
              answers repeatedly without taking up more of my coach's valuable
              time.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Target className="w-7 h-7 text-purple-600" />
                The Problem I Faced
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Even with professional coaching guidance, I found myself wanting
                unlimited practice opportunities. The STAR method made sense
                conceptually, but I needed to rehearse my examples until they
                became natural and confident.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  The insight: Great coaches provide strategy, confidence, and
                  personalized guidance. But candidates also need a safe space
                  for unlimited practice between coaching sessions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Lightbulb className="w-7 h-7 text-green-600" />
                So I Built the Practice Platform I Wished Existed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Public Prep fills the gap between coaching sessions - giving
                candidates unlimited practice opportunities so they can arrive
                at their next coaching session more prepared and confident.
              </p>
              <p>
                The platform combines AI technology with deep knowledge of the
                Irish public service competency framework to provide instant
                practice feedback.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-medium text-green-800 dark:text-green-300">
                  Result: Candidates can practice relentlessly, then use their
                  coaching time for strategic guidance and confidence building
                  rather than basic STAR method repetition.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What This Platform Offers */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 mb-16">
          <CardHeader>
            <CardTitle className="text-3xl text-center mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                What This Platform Offers
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <BookOpen className="w-6 h-6" />,
                  title: "Unlimited Practice Opportunities",
                  description:
                    "Real competency-based questions used in Irish public service interviews - practice as much as you need",
                },
                {
                  icon: <Award className="w-6 h-6" />,
                  title: "STAR Method Development",
                  description:
                    "Detailed feedback on structuring answers using Situation, Task, Action, Result",
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Competency Framework Alignment",
                  description:
                    "Aligned with both traditional and new 4-area capability frameworks",
                },
                {
                  icon: <Code className="w-6 h-6" />,
                  title: "AI-Powered Practice Feedback",
                  description:
                    "Instant analysis to help you refine answers between coaching sessions",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                >
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mission Statement */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">My Vision</h2>
            <p className="text-xl leading-relaxed mb-8 text-purple-100">
              PublicPrep.ie enhances rather than replaces professional coaching.
              Coaches provide irreplaceable human insight, strategy, and
              confidence building. This platform handles the repetitive
              practice, freeing coaches to focus on what they do best.
            </p>
            <p className="text-lg leading-relaxed mb-8 text-purple-200">
              Together, we can help every candidate walk into their interview
              with both strategic preparation AND well-rehearsed, confident
              answers.
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">
                The Perfect Combination:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-purple-100">
                    Professional coaching for strategy, confidence, and
                    personalized guidance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-purple-100">
                    AI practice platform for unlimited repetition and feedback
                  </span>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-purple-100">
                    Better outcomes for candidates who get the best of both
                    worlds
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                { number: "Unbiased", label: "AI Feedback" },
                { number: "Real", label: "Practice Questions" },
                { number: "24/7", label: "Available" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
                >
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-purple-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Partnership Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 mb-16">
          <CardHeader>
            <CardTitle className="text-3xl text-center mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                For Career Coaches & Recruitment Professionals
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              If you work with public service candidates, I'd love to explore
              how this platform could complement your valuable work. Many
              coaches are already partnering with us to provide their clients
              with comprehensive preparation.
            </p>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-6">
              <p className="text-indigo-800 dark:text-indigo-300 font-medium">
                Partner with us to give your clients the complete preparation
                experience they deserve.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <br></br>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Start Your Interview Preparation Now...
          </Button>
        </div>
      </div>
    </div>
  );
}
