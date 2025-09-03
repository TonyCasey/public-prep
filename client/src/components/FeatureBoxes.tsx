import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Target, Award } from "lucide-react";

const FeatureBoxes = memo(() => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
      <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transform hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <CardHeader className="pt-8">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Answer Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
            Get precise STAR method scoring based on the Irish Public Service
            competency framework - the same criteria used in real interviews.
          </p>
          <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 200 100" className="w-full h-full max-w-[180px]">
              <defs>
                <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <rect x="20" y="70" width="30" height="20" fill="url(#purple-gradient)" rx="2" />
              <rect x="60" y="60" width="30" height="30" fill="url(#purple-gradient)" rx="2" />
              <rect x="100" y="45" width="30" height="45" fill="url(#purple-gradient)" rx="2" />
              <rect x="140" y="30" width="30" height="60" fill="url(#purple-gradient)" rx="2" />
              <text x="100" y="20" textAnchor="middle" className="text-xs font-semibold" fill="#8b5cf6">STAR Score: 8.5/10</text>
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transform hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <CardHeader className="pt-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            CV Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
            AI analyzes your CV to identify competency strengths and generate
            personalized interview questions based on your experience.
          </p>
          <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 200 100" className="w-full h-full max-w-[180px]">
              <defs>
                <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <rect x="20" y="20" width="60" height="8" fill="#e5e7eb" rx="4" />
              <rect x="20" y="35" width="80" height="8" fill="#e5e7eb" rx="4" />
              <rect x="20" y="50" width="70" height="8" fill="#e5e7eb" rx="4" />
              <rect x="20" y="65" width="90" height="8" fill="#e5e7eb" rx="4" />
              <path d="M130 30 L150 50 L170 35" stroke="url(#blue-gradient)" strokeWidth="3" fill="none" />
              <circle cx="150" cy="50" r="4" fill="url(#blue-gradient)" />
              <text x="150" y="75" textAnchor="middle" className="text-xs font-semibold" fill="#3b82f6">AI Analysis</text>
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transform hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        <CardHeader className="pt-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            AI Coaching
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
            Receive detailed feedback on your interview answers with specific
            improvement suggestions and enhanced answer examples.
          </p>
          <div className="w-full h-32 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 200 100" className="w-full h-full max-w-[180px]">
              <defs>
                <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="40" r="20" fill="none" stroke="url(#green-gradient)" strokeWidth="3" />
              <circle cx="50" cy="40" r="25" fill="none" stroke="url(#green-gradient)" strokeWidth="1" opacity="0.3" />
              <path d="M42 40 L48 46 L58 34" stroke="url(#green-gradient)" strokeWidth="3" fill="none" />
              <rect x="90" y="25" width="80" height="6" fill="url(#green-gradient)" rx="3" />
              <rect x="90" y="40" width="60" height="6" fill="url(#green-gradient)" opacity="0.6" rx="3" />
              <rect x="90" y="55" width="70" height="6" fill="url(#green-gradient)" opacity="0.4" rx="3" />
              <text x="100" y="80" textAnchor="middle" className="text-xs font-semibold" fill="#10b981">Feedback</text>
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

FeatureBoxes.displayName = "FeatureBoxes";

export default FeatureBoxes;