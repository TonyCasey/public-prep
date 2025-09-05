import React, { useState, useEffect } from 'react';
import { Loader2, FileCheck, Bot, Target, CheckCircle } from 'lucide-react';

interface LoadingAnimationProps {
  isVisible: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ isVisible }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: FileCheck,
      title: "Analyzing Your CV",
      description: "Extracting key competencies and experience",
      duration: 3000
    },
    {
      icon: Target,
      title: "Understanding Requirements", 
      description: "Matching your profile to job specifications",
      duration: 3000
    },
    {
      icon: Bot,
      title: "Crafting Questions",
      description: "Generating personalized interview questions",
      duration: 3000
    },
    {
      icon: CheckCircle,
      title: "Preparing Interview",
      description: "Setting up your personalized interview experience",
      duration: 3000
    }
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000); // Move to next step every 4 seconds

    return () => clearInterval(timer);
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* Progress Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-500 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 shadow-md scale-105'
                  : isCompleted
                  ? 'bg-green-50 border-l-4 border-green-500'
                  : 'bg-gray-50 border-l-4 border-gray-200'
              }`}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isActive
                    ? 'bg-orange-500 text-white animate-pulse'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold transition-colors duration-300 ${
                    isActive
                      ? 'text-orange-800'
                      : isCompleted
                      ? 'text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm transition-colors duration-300 ${
                    isActive
                      ? 'text-orange-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.description}
                </p>
              </div>
              
              {isCompleted && (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Overall Progress Bar */}
      <div className="mt-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Creating your interview...</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;