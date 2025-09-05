import { useQuery } from "@tanstack/react-query";
import { Frown, Meh, Smile } from "lucide-react";

export default function ConfidenceMeter() {
  // Get user progress data to calculate interviewer confidence
  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
    refetchInterval: false, // Disabled excessive polling
  });

  // Calculate interviewer confidence based on practice performance
  const calculateConfidence = () => {
    if (!userProgress || !Array.isArray(userProgress) || userProgress.length === 0) {
      return 30; // Start with low confidence before any practice
    }

    const validProgress = userProgress.filter(p => p.averageScore > 0);
    if (validProgress.length === 0) return 30;

    const totalScores = validProgress.reduce((sum, progress) => sum + (progress.averageScore || 0), 0);
    const averageScore = totalScores / validProgress.length;
    
    // Convert score to confidence with some randomness for realism
    const baseConfidence = Math.round(averageScore * 0.85 + 15); // Scale to 15-100 range
    return Math.min(95, Math.max(25, baseConfidence));
  };

  const confidence = calculateConfidence();

  // Calculate individual smiley values based on confidence
  const getSmileyValues = (confidence: number) => {
    if (confidence <= 33) {
      // Sad dominates
      return {
        sad: Math.max(50, confidence * 3), // At least 50%, up to 100%
        neutral: Math.max(0, (33 - confidence) * 1.5),
        happy: 0
      };
    } else if (confidence <= 66) {
      // Neutral dominates
      const adjustedConfidence = confidence - 33;
      return {
        sad: Math.max(0, 33 - adjustedConfidence),
        neutral: Math.max(50, adjustedConfidence * 3),
        happy: Math.max(0, adjustedConfidence * 1.5)
      };
    } else {
      // Happy dominates
      const adjustedConfidence = confidence - 66;
      return {
        sad: 0,
        neutral: Math.max(0, 33 - adjustedConfidence),
        happy: Math.max(50, adjustedConfidence * 3)
      };
    }
  };

  const smileyValues = getSmileyValues(confidence);

  return (
    <div className="space-y-4">
      {/* Three Smiley Faces with Progress Bars */}
      <div className="grid grid-cols-3 gap-4">
        {/* Sad Face */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Frown className="w-8 h-8 text-red-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${smileyValues.sad}%` }}
            />
          </div>
          <span className="text-xs text-red-600 font-medium">Skeptical</span>
        </div>

        {/* Neutral Face */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Meh className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${smileyValues.neutral}%` }}
            />
          </div>
          <span className="text-xs text-yellow-600 font-medium">Neutral</span>
        </div>

        {/* Happy Face */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Smile className="w-8 h-8 text-green-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${smileyValues.happy}%` }}
            />
          </div>
          <span className="text-xs text-green-600 font-medium">Confident</span>
        </div>
      </div>

      {/* Overall Confidence Display */}
      <div className="text-center pt-2 border-t border-gray-200">
        <div className="text-sm text-muted-foreground">
          Overall: {confidence}% Confidence
        </div>
      </div>

      {/* Celebration Effects */}
      {confidence >= 85 && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-1 text-green-600 animate-bounce">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-medium">Excellent!</span>
            <span className="text-lg">🎉</span>
          </div>
        </div>
      )}
    </div>
  );
}