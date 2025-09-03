import { CheckCircle, Target, TrendingUp } from "lucide-react";
import logoPath from "@assets/logo_1753796611014.png";
import profileImagePath from "@assets/me_1752840229490.png";
import { Link, useLocation } from "wouter";

interface AuthLayoutProps {
  children: React.ReactNode;
  showHero?: boolean;
}

export default function AuthLayout({
  children,
  showHero = true,
}: AuthLayoutProps) {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 floating"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 floating"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-28 h-28 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 floating"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Left Column - Forms */}
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-purple-50 order-1 lg:order-1 relative z-10">
        <div className="w-full max-w-md space-y-6 lg:space-y-8 auth-slide-in">
          <div className="text-center">
            <Link href="/">
              <img
                src={logoPath}
                alt="Public Prep Logo"
                className="w-40 h-auto mx-auto mb-6 cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-300 floating"
              />
            </Link>
          </div>

          {children}
        </div>
      </div>

      {showHero && (
        /* Right Column - Hero */
        <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white order-2 lg:order-2 min-h-[300px] lg:min-h-0 relative overflow-hidden">
          {/* Hero Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl"></div>

          <div className="max-w-lg space-y-4 sm:space-y-6 lg:space-y-8 relative z-10 auth-fade-in">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                Master Public Sector Interviews.
                <span className="block bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                  Get Higher Scores.
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-purple-100 leading-relaxed">
                AI-powered interview questions tailored to your CV and the job
                specification.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6 hidden sm:block">
              <div className="flex items-start gap-3 sm:gap-4 group">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 flex-shrink-0 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Target className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-yellow-200 transition-colors duration-300">
                    Real-World Scoring
                  </h3>
                  <p className="text-purple-100 text-base leading-relaxed">
                    Get scored on the same criteria used in actual interviews
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 group">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 flex-shrink-0 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <TrendingUp className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-yellow-200 transition-colors duration-300">
                    Track Your Progress
                  </h3>
                  <p className="text-purple-100 text-base leading-relaxed">
                    Monitor improvement across all competencies
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 group">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 flex-shrink-0 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <CheckCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-yellow-200 transition-colors duration-300">
                    Build Confidence
                  </h3>
                  <p className="text-purple-100 text-base leading-relaxed">
                    Master interview skills with realistic practice questions
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 sm:pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-200 mb-1">
                  Unbiased
                </div>
                <div className="text-xs sm:text-sm text-purple-200">
                  AI Feedback
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-200 mb-1">
                  Real
                </div>
                <div className="text-xs sm:text-sm text-purple-200">
                  Questions
                </div>
              </div>
            </div>

            {/* Personal Branding Section */}
            <div className="pt-6 sm:pt-8 border-t border-white/20">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                <div className="text-center mb-4">
                  <img
                    src={profileImagePath}
                    alt="Tony Casey, Creator of Public Prep"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto shadow-lg border-4 border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => setLocation("/about")}
                  />
                </div>
                <blockquote className="text-white text-sm sm:text-base italic leading-relaxed text-center mb-3">
                  "Practice, practice, practice"
                </blockquote>
                <p className="text-purple-200 text-center text-xs sm:text-sm mb-3">
                  - Tony Casey, Creator
                </p>
                <div className="text-center">
                  <button
                    onClick={() => setLocation("/about")}
                    className="text-purple-200 hover:text-white font-medium underline underline-offset-4 transition-colors text-xs sm:text-sm"
                  >
                    Learn more about my story →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
