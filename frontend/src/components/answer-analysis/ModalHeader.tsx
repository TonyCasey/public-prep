import { X, Loader2 } from 'lucide-react';
import aiHeadImage from '@assets/ai-head_1752847270527.png';

interface ModalHeaderProps {
  title?: string;
  competency?: string;
  overallScore?: number;
  isLoading?: boolean;
  evaluationStage?: number;
  onClose: () => void;
}

const evaluationStageMessages = [
  "Submitting your answer...",
  "Analyzing your answer structure...",
  "Evaluating STAR method compliance...",
  "Assessing competency alignment...",
  "Calculating performance scores...",
  "Preparing personalized feedback..."
];

export default function ModalHeader({ 
  title = "AI Answer Evaluation",
  competency,
  overallScore, 
  isLoading = false, 
  evaluationStage = 1, 
  onClose 
}: ModalHeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl z-10">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center p-1 border-2 border-purple-200 shadow-lg">
              <img 
                src={aiHeadImage} 
                alt="AI Interview Coach" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{title}</h2>
              <p className="text-sm text-gray-500">Your AI Interview Coach</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Overall Score when loaded */}
            {!isLoading && overallScore && (
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{overallScore}/10</div>
                <div className="text-xs text-gray-500">Overall Score</div>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Beautiful progress indicator on new line */}
      {isLoading && (
        <div className="px-6 pb-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 p-4 shadow-lg">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="text-white font-medium text-sm sm:text-base">
                {evaluationStageMessages[evaluationStage - 1] || "Analyzing your answer structure..."}
              </div>
            </div>
            
            {/* Subtle bottom border glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
        </div>
      )}
    </div>
  );
}