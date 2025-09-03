interface STARMethodAnalysisProps {
  starMethodAnalysis?: {
    situation?: number;
    task?: number;
    action?: number;
    result?: number;
  };
  isLoading: boolean;
}

const starMethodGuide = [
  { 
    letter: 'S', 
    title: 'Situation', 
    description: 'Set the context for your story', 
    color: 'from-blue-500 to-blue-600',
    icon: '🎯'
  },
  { 
    letter: 'T', 
    title: 'Task', 
    description: 'Describe your responsibility', 
    color: 'from-green-500 to-green-600',
    icon: '📋'
  },
  { 
    letter: 'A', 
    title: 'Action', 
    description: 'Explain what you did', 
    color: 'from-amber-500 to-amber-600',
    icon: '⚡'
  },
  { 
    letter: 'R', 
    title: 'Result', 
    description: 'Share the outcome', 
    color: 'from-purple-500 to-purple-600',
    icon: '🏆'
  }
];

export default function STARMethodAnalysis({ starMethodAnalysis, isLoading }: STARMethodAnalysisProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {starMethodGuide.map((item, index) => {
          if (isLoading) {
            return (
              <div key={item.letter} className="p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full mx-auto mb-2 sm:mb-3"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              </div>
            );
          }

          const scores = [starMethodAnalysis?.situation, starMethodAnalysis?.task, starMethodAnalysis?.action, starMethodAnalysis?.result];
          const score = scores[index] || 0;

          // Dynamic color based on score
          let scoreColor = 'from-red-500 to-red-600';
          if (score >= 8) scoreColor = 'from-green-500 to-green-600';
          else if (score >= 6) scoreColor = 'from-amber-500 to-amber-600';
          else if (score >= 4) scoreColor = 'from-orange-500 to-orange-600';

          return (
            <div key={item.letter} className="p-3 sm:p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${scoreColor} rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-2xl mx-auto mb-2 sm:mb-3 shadow-lg`}>
                  {score}
                </div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-lg mb-1">{item.title}</h4>
                <p className="text-xs text-gray-600 hidden sm:block">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}