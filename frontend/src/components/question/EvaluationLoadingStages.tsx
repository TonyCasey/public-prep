import { CheckCircle } from "lucide-react";

interface EvaluationLoadingStagesProps {
  stage: number;
}

const stages = [
  "Analyzing your answer structure...",
  "Evaluating STAR method usage...",
  "Checking competency alignment...",
  "Calculating performance scores...",
  "Preparing personalized feedback..."
];

export default function EvaluationLoadingStages({ stage }: EvaluationLoadingStagesProps) {
  return (
    <div className="space-y-3">
      {stages.map((text, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 transition-all duration-500 ${
            index < stage ? 'opacity-100' : index === stage ? 'opacity-100 animate-pulse' : 'opacity-30'
          }`}
        >
          {index < stage ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
              index === stage ? 'border-purple-500 animate-spin' : 'border-gray-300'
            }`}>
              {index === stage && (
                <div className="w-2 h-2 bg-purple-500 rounded-full m-auto mt-0.5" />
              )}
            </div>
          )}
          <span className={`text-sm ${index <= stage ? 'text-gray-900' : 'text-gray-500'}`}>
            {text}
          </span>
        </div>
      ))}
    </div>
  );
}