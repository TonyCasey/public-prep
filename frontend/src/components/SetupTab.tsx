import { useState, useEffect } from "react";
import { Upload, FileUser, File, Brain, Sparkles, Eye, X, Trash2, Download, Target, CheckCircle, ArrowRight, BookOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Toast imports removed - toasts can interfere with modal behavior
import FileUpload from "./FileUpload";
import ConfidenceMeter from "./ConfidenceMeter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


interface SetupTabProps {
  onNavigateToTab?: (tab: string) => void;
}

export default function SetupTab({ onNavigateToTab }: SetupTabProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  // Toast functionality removed
  const queryClient = useQueryClient();

  // Get documents from API
  const { data: documents, isLoading: documentsLoading } = useQuery<{ id: number; type: string; filename: string; size: number; uploadedAt: string }[]>({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/documents');
      return response.json();
    }
  });

  // Check if both CV and job specification are uploaded
  const hasCv = documents?.some((doc: { type: string }) => doc.type === 'cv');
  const hasJobSpec = documents?.some((doc: { type: string }) => doc.type === 'job_spec');
  const hasBothDocuments = hasCv && hasJobSpec;
  const hasDocuments = documents && documents.length > 0;

  // Get analysis data from API
  const { data: analysis } = useQuery<{
    keyHighlights: string[];
    competencyStrengths: Record<string, number>;
    improvementAreas: string[];
    experienceLevel: string;
    publicSectorExperience: boolean;
  }>({
    queryKey: ['/api/documents/analysis'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/documents/analysis');
      return response.json();
    },
    enabled: hasDocuments // Enable when we have at least one document
  });

  const { data: questions } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/questions');
      return response.json();
    },
    enabled: false // Only fetch when needed
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cv/analyze');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/documents/analysis'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/documents/analysis'] });
      
      // Calculate compatibility score for celebration
      const avgCompetencyScore = Object.values(data.competencyStrengths as Record<string, number>).reduce((sum: number, score: number) => sum + score, 0) / Object.values(data.competencyStrengths as Record<string, number>).length;
      const experienceBonus = data.experienceLevel === 'senior' ? 15 : data.experienceLevel === 'mid' ? 10 : 5;
      const sectorBonus = data.publicSectorExperience ? 10 : 0;
      const compatibilityScore = Math.min(95, Math.round(avgCompetencyScore + experienceBonus + sectorBonus));
      
      // Celebratory toast with personalized messaging based on score
      let celebrationTitle = "";
      let celebrationDescription = "";
      
      if (compatibilityScore >= 85) {
        celebrationTitle = "🎉 Outstanding Match!";
        celebrationDescription = `Excellent! You scored ${compatibilityScore}% - you're a fantastic fit for this role. Your experience really shines through!`;
      } else if (compatibilityScore >= 75) {
        celebrationTitle = "🎯 Great Match!";
        celebrationDescription = `Well done! You scored ${compatibilityScore}% - you have strong qualifications for this position. Time to practice!`;
      } else if (compatibilityScore >= 65) {
        celebrationTitle = "✨ Good Potential!";
        celebrationDescription = `Nice! You scored ${compatibilityScore}% - solid foundation with room to highlight your strengths in the interview.`;
      } else {
        celebrationTitle = "💪 Let's Build Your Confidence!";
        celebrationDescription = `You scored ${compatibilityScore}% - perfect opportunity to practice and showcase your hidden potential!`;
      }
      
      console.log('CV Analysis completed:', celebrationTitle, celebrationDescription);
      
      // Trigger celebration animation
      setIsCelebrating(true);
      if (compatibilityScore >= 80) {
        setShowSparkles(true);
        setTimeout(() => setShowSparkles(false), 3000); // Show sparkles for 3 seconds
      }
      setTimeout(() => setIsCelebrating(false), 2000); // Celebration lasts 2 seconds
    },
    onError: (error: any) => {
      console.error("Analysis error:", error);
      
      // Show user-friendly error messages
      let userMessage = "We couldn't complete the analysis right now. Please try again in a moment.";
      
      let variant: "destructive" | "warning" = "destructive";
      
      if (error.message?.includes("rate_limit")) {
        userMessage = "Too many requests at the moment. Please wait a minute and try again.";
        variant = "warning";
      } else if (error.message?.includes("tokens")) {
        userMessage = "Your document is quite large. The analysis may take longer than usual.";
        variant = "warning";
      } else if (error.message?.includes("JSON")) {
        userMessage = "There was a processing error. Please try the analysis again.";
      }
      
      console.error('CV Analysis error:', userMessage);
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: number) => {
      const response = await apiRequest('DELETE', `/api/documents/${docId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      console.log("Document deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete failed:", error.message);
    },
  });

  const handleDeleteDocument = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(docId);
    }
  };

  // Check if we have documents uploaded (already defined above)

  // Update compatibility score from real AI analysis
  useEffect(() => {
    if (analysis) {
      // Calculate compatibility score from analysis data
      const avgCompetencyScore = analysis.competencyStrengths ? 
        Object.values(analysis.competencyStrengths).reduce((sum: number, score: number) => sum + score, 0) / 
        Object.values(analysis.competencyStrengths).length : 75;
      
      setCompatibilityScore(Math.round(avgCompetencyScore));
      setConfidenceLevel(analysis.publicSectorExperience ? 85 : 75);
    } else if (!hasDocuments) {
      setCompatibilityScore(null);
      setAnimatedScore(0);
      setConfidenceLevel(0);
    }
  }, [analysis, hasDocuments]);

  // Determine if we should show blurred state
  const shouldBlurPanel = (!analysis && hasDocuments) || analyzeMutation.isPending;
  const showAnalysisPrompt = !analysis && !analyzeMutation.isPending;

  // Animate the score counter
  useEffect(() => {
    if (compatibilityScore !== null && animatedScore < compatibilityScore) {
      const timer = setTimeout(() => {
        setAnimatedScore(prev => Math.min(prev + 1, compatibilityScore));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [compatibilityScore, animatedScore]);

  // Get compatibility color and message
  const getCompatibilityStatus = (score: number) => {
    if (score >= 85) return { color: 'text-green-600', bg: 'bg-green-100', message: 'Excellent Match', ring: 'ring-green-500' };
    if (score >= 75) return { color: 'text-blue-600', bg: 'bg-blue-100', message: 'Good Match', ring: 'ring-blue-500' };
    if (score >= 65) return { color: 'text-orange-600', bg: 'bg-orange-100', message: 'Moderate Match', ring: 'ring-orange-500' };
    return { color: 'text-red-600', bg: 'bg-red-100', message: 'Needs Improvement', ring: 'ring-red-500' };
  };

  // Get confidence meter properties
  const getConfidenceStatus = (confidence: number) => {
    if (confidence >= 80) return { 
      color: 'from-green-400 to-green-600', 
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      message: 'High Confidence',
      pulse: 'animate-pulse'
    };
    if (confidence >= 65) return { 
      color: 'from-blue-400 to-blue-600', 
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      message: 'Good Confidence',
      pulse: 'animate-pulse'
    };
    if (confidence >= 50) return { 
      color: 'from-yellow-400 to-orange-500', 
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      message: 'Moderate Confidence',
      pulse: 'animate-pulse'
    };
    return { 
      color: 'from-red-400 to-red-600', 
      bgColor: 'bg-red-500',
      textColor: 'text-red-600',
      message: 'Low Confidence',
      pulse: 'animate-pulse'
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Document Upload Section */}
      <Card className="h-fit border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center">
            <Upload className="mr-2 text-purple-600" />
            <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Document Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CV Upload */}
          {!documents?.find(d => d.type === 'cv') ? (
            <FileUpload
              type="cv"
              label="Upload your CV"
              description="Drag and drop your CV here, or click to browse"
              icon={FileUser}
              onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ['/api/documents'] })}
            />
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-3">
                <FileUser className="h-5 w-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-purple-800">
                    {documents.find((d: { type: string; filename: string }) => d.type === 'cv')?.filename}
                  </h4>
                  <p className="text-sm text-purple-600">
                    CV uploaded • {new Date(documents.find((d: { type: string; uploadedAt: string }) => d.type === 'cv')?.uploadedAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDocument(documents.find((d: { type: string; id: number }) => d.type === 'cv')?.id!)}
                disabled={deleteDocumentMutation.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Job Specification Upload */}
          {!documents?.find(d => d.type === 'job_spec') ? (
            <FileUpload
              type="job_spec"
              label="Upload Job Specification"
              description="Drag and drop job specification here, or click to browse"
              icon={File}
              onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ['/api/documents'] })}
            />
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-purple-800">
                    {documents.find((d: { type: string; filename: string }) => d.type === 'job_spec')?.filename}
                  </h4>
                  <p className="text-sm text-purple-600">
                    Job Specification uploaded • {new Date(documents.find((d: { type: string; uploadedAt: string }) => d.type === 'job_spec')?.uploadedAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDocument(documents.find((d: { type: string; id: number }) => d.type === 'job_spec')?.id!)}
                disabled={deleteDocumentMutation.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {documentsLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-neutral-600">Loading documents...</p>
            </div>
          )}

          {/* Analysis Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleAnalyze} 
              disabled={!hasDocuments || analyzeMutation.isPending}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xl border-4 border-blue-500 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-xl"
              size="lg"
            >
              {analyzeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  1. Start AI Analysis
                  <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </Button>
            {!hasDocuments && (
              <p className="text-sm text-neutral-500 text-center mt-2">
                Upload at least one document to enable analysis
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Combined AI Analysis & Document Compatibility */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 text-primary" />
            Your Match Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Loading overlay when analysis is running */}
            {analyzeMutation.isPending && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700">Running AI Analysis...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                </div>
              </div>
            )}

            {/* Analysis prompt overlay when no analysis exists */}
            {showAnalysisPrompt && hasDocuments && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="text-center p-6">
                  <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready for AI Analysis</h3>
                  <p className="text-gray-600 mb-4">Click the "Start AI Analysis" button below to get your personalized match score and insights.</p>
                </div>
              </div>
            )}

            {/* Blurred background content */}
            <div className={`${shouldBlurPanel ? 'blur-sm opacity-50' : ''} transition-all duration-500`}>
              {/* Compatibility Score Section */}
              <div className="text-center mb-8">
                <div className={`relative inline-flex items-center justify-center transition-all duration-500 ${isCelebrating ? 'scale-110' : 'scale-100'}`}>
                  {/* Celebration glow effect */}
                  {isCelebrating && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 animate-pulse blur-xl"></div>
                  )}
                  
                  {/* Sparkles for high scores */}
                  {showSparkles && (
                    <>
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
                      <Sparkles className="absolute -top-4 left-2 w-4 h-4 text-yellow-300 animate-ping" />
                      <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-500 animate-pulse" />
                      <Sparkles className="absolute top-0 right-8 w-3 h-3 text-yellow-200 animate-bounce delay-300" />
                    </>
                  )}
                  
                  {/* Animated circular progress */}
                  <svg className={`w-32 h-32 transform -rotate-90 transition-all duration-300 ${isCelebrating ? 'drop-shadow-2xl' : ''}`} viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-neutral-200"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={compatibilityScore ? getCompatibilityStatus(compatibilityScore).color : 'text-neutral-300'}
                      strokeDasharray={339.29} // 2 * π * 54
                      strokeDashoffset={339.29 - (339.29 * animatedScore) / 100}
                      style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                    />
                  </svg>
                  {/* Score text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold transition-all duration-300 ${isCelebrating ? 'text-4xl' : ''} ${compatibilityScore ? getCompatibilityStatus(compatibilityScore).color : 'text-neutral-400'}`}>
                        {animatedScore}%
                      </div>
                      <div className="text-sm text-neutral-500">Match</div>
                    </div>
                  </div>
                </div>
                
                {/* Status message */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${compatibilityScore ? getCompatibilityStatus(compatibilityScore).bg + ' ' + getCompatibilityStatus(compatibilityScore).color : 'bg-neutral-100 text-neutral-400'}`}>
                    {compatibilityScore ? getCompatibilityStatus(compatibilityScore).message : 'Awaiting Analysis'}
                  </span>
                </div>
                
                {/* Confidence Meter */}
                <div className="mt-6 mb-6">
                  <div className="text-center mb-3">
                    <span className="text-sm font-medium text-neutral-600">Confidence Meter</span>
                  </div>
                  <div className="relative">
                    {/* Background bar */}
                    <div className="w-full h-6 bg-neutral-200 rounded-full overflow-hidden">
                      {/* Animated confidence bar */}
                      <div 
                        className={`h-full bg-gradient-to-r ${confidenceLevel ? getConfidenceStatus(confidenceLevel).color : 'from-neutral-300 to-neutral-400'} ${confidenceLevel ? getConfidenceStatus(confidenceLevel).pulse : ''} transition-all duration-1000 ease-out`}
                        style={{ 
                          width: `${confidenceLevel}%`,
                          transition: 'width 2s ease-out'
                        }}
                      />
                    </div>
                    {/* Confidence text overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-medium ${confidenceLevel ? getConfidenceStatus(confidenceLevel).textColor : 'text-neutral-500'}`}>
                        {confidenceLevel}% {confidenceLevel ? getConfidenceStatus(confidenceLevel).message : 'Awaiting Analysis'}
                      </span>
                    </div>
                    {/* Pulsing indicator dot */}
                    {confidenceLevel > 0 && (
                      <div 
                        className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 ${getConfidenceStatus(confidenceLevel).bgColor} rounded-full ${getConfidenceStatus(confidenceLevel).pulse} shadow-lg`}
                        style={{ 
                          left: `calc(${confidenceLevel}% - 6px)`,
                          transition: 'left 2s ease-out'
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-green-600">
                      {analysis && analysis.competencyStrengths ? 
                        Math.round(Object.values(analysis.competencyStrengths).slice(0,2).reduce((sum: number, score: number) => sum + score, 0) / 2) : 0}%
                    </div>
                    <div className="text-xs text-neutral-500">Leadership Skills</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-blue-600">
                      {analysis ? (analysis.experienceLevel === 'senior' ? 90 : analysis.experienceLevel === 'mid' ? 75 : 60) : 0}%
                    </div>
                    <div className="text-xs text-neutral-500">Experience Level</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-orange-600">
                      {analysis ? (analysis.publicSectorExperience ? 95 : 70) : 0}%
                    </div>
                    <div className="text-xs text-neutral-500">Sector Match</div>
                  </div>
                </div>
              </div>

              {/* CV Analysis Section */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-700 mb-2">CV Key Highlights</h3>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  {analysis ? analysis.keyHighlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${index === 3 ? 'bg-accent' : 'bg-secondary'}`} />
                      <span className="text-sm">{highlight}</span>
                    </div>
                  )) : (
                    // Placeholder content for blurred state
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-300" />
                        <span className="text-sm text-neutral-400">Strong leadership experience in public sector</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-300" />
                        <span className="text-sm text-neutral-400">Strong track record in team management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-300" />
                        <span className="text-sm text-neutral-400">Excellent analytical and decision-making skills</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Competency Mapping */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-700 mb-2">Competency Strength Analysis</h3>
                <div className="space-y-3">
                  {analysis ? Object.entries(analysis.competencyStrengths).map(([competency, score]) => (
                    <div key={competency} className="flex items-center justify-between">
                      <span className="text-sm">{competency}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={score} className="w-24" />
                        <span className={`text-sm font-medium ${score >= 80 ? 'text-secondary' : score >= 65 ? 'text-primary' : 'text-accent'}`}>
                          {score}%
                        </span>
                      </div>
                    </div>
                  )) : (
                    // Placeholder content for blurred state
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Team Leadership</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={75} className="w-24" />
                          <span className="text-sm font-medium text-neutral-400">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Decision Making</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={80} className="w-24" />
                          <span className="text-sm font-medium text-neutral-400">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Communication</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={70} className="w-24" />
                          <span className="text-sm font-medium text-neutral-400">70%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>


            </div>

            {/* Practice Interview Button - appears when analysis is complete */}
            {analysis && compatibilityScore && (
              <div className="mt-6">
                <Button
                  onClick={() => onNavigateToTab?.('practice')}
                  className="w-full h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-xl"
                  size="lg"
                >
                  2. Start Interview
                  <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}

            {/* Overlay dialogue and progress states */}
            {(!hasBothDocuments || (hasBothDocuments && !analysis && !compatibilityScore)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
                  {!hasBothDocuments ? (
                    <>
                      <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-neutral-800 mb-2">Ready to see your score?</h3>
                      <p className="text-neutral-600 mb-6">
                        Upload...
                      </p>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-center space-x-2">
                          {hasCv ? (
                            <span className="text-green-600 text-sm font-medium">✓ CV uploaded</span>
                          ) : (
                            <span className="text-neutral-400 text-sm">○ CV required</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          {hasJobSpec ? (
                            <span className="text-green-600 text-sm font-medium">✓ Job specification uploaded</span>
                          ) : (
                            <span className="text-neutral-400 text-sm">○ Job specification required</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={!hasBothDocuments || analyzeMutation.isPending}
                        className={!hasBothDocuments ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {analyzeMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analyzing with AI...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 w-4 h-4" />
                            Start AI Analysis
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-neutral-800 mb-2">Analysis in Progress</h3>
                      <p className="text-neutral-600 mb-4">
                        Processing your documents and calculating compatibility score...
                      </p>
                      <div className="text-sm text-neutral-500">
                        This may take a few seconds
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Questions Preview */}
      {questions && (
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="mr-2 text-primary" />
                  Generated Questions Preview ({questions.questions?.length || 0} questions)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {questions.questions?.slice(0, 3).map((question: any, index: number) => (
                  <Card key={question.id} className="border border-neutral-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {question.competency}
                        </Badge>
                        <span className="text-xs text-neutral-400">Q{index + 1}</span>
                      </div>
                      <p className="text-sm text-neutral-700">{question.questionText}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">
                  Showing 3 of {questions.questions?.length || 0} questions
                </span>
                <Button onClick={() => onNavigateToTab?.('practice')}>
                  Start Practice Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}




    </div>
  );
}
