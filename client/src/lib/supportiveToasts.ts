import { toast } from "@/hooks/use-toast";

/**
 * Supportive toast messages that provide emotional encouragement
 * throughout the interview preparation journey
 */

export const supportiveToasts = {
  // Document Upload Success
  cvUploadSuccess: () => toast({
    title: "CV uploaded successfully! 🎉",
    description: "Great! Your experience is now being analyzed. You're one step closer to interview success!",
  }),

  jobSpecUploadSuccess: () => toast({
    title: "Job Specification uploaded successfully! 🎯", 
    description: "Perfect! Job requirements loaded. Your practice questions will be perfectly tailored!",
  }),

  // Analysis Complete
  analysisComplete: () => toast({
    title: "Analysis complete! ✨",
    description: "Excellent! Your strengths have been identified and we're ready to create your personalized practice session!",
  }),

  // Question Generation
  questionsGenerated: () => toast({
    title: "Practice questions ready! 🚀",
    description: "Your personalized interview questions are prepared. Time to shine in practice mode!",
  }),

  // Practice Session Start
  practiceSessionStart: () => toast({
    title: "Practice session started! 💪", 
    description: "Take your time, breathe, and remember - every practice makes you stronger!",
  }),

  // Answer Submission
  answerSubmitted: () => toast({
    title: "Great answer submitted! 👏",
    description: "Well done! Each response builds your confidence and improves your skills.",
  }),

  // Voice Input Success
  voiceRecordingStart: () => toast({
    title: "Voice recording active! 🎙️",
    description: "Speak naturally and clearly. This is excellent practice for the real interview!",
  }),

  // Progress Milestones
  firstQuestionComplete: () => toast({
    title: "First question completed! 🌟",
    description: "Fantastic start! You're building momentum with each answer.",
  }),

  halfwayMilestone: () => toast({
    title: "Halfway there! 🎯",
    description: "You're doing brilliantly! Keep up the excellent work.",
  }),

  sessionComplete: () => toast({
    title: "Session completed! 🏆",
    description: "Outstanding work! You've grown stronger and more confident today.",
  }),

  // Confidence Building
  confidenceBoost: () => toast({
    title: "Confidence is building! 📈",
    description: "You're getting better with every practice. Keep believing in yourself!",
  }),

  // Encouragement for Struggles
  keepGoing: () => toast({
    title: "You've got this! 💪",
    description: "Every challenge makes you stronger. Take a breath and continue when ready.",
  }),

  // File Operations
  fileRemoved: (fileType: string) => toast({
    title: `${fileType} removed successfully ✓`,
    description: "File cleared. Feel free to upload a new one whenever you're ready!",
  }),

  // Error Recovery
  errorRecovery: () => toast({
    title: "Don't worry, we've got you covered! 🤝",
    description: "Technical hiccups happen. Let's try that again - you're doing great!",
  }),

  // Success Celebrations
  majorMilestone: () => toast({
    title: "Major milestone achieved! 🎊",
    description: "This is a huge step forward in your interview preparation journey!",
  })
};

/**
 * Context-aware supportive messages based on user progress
 */
export const getContextualEncouragement = (context: {
  answerLength?: number;
  sessionProgress?: number;
  confidenceLevel?: number;
  isFirstTime?: boolean;
}) => {
  const { answerLength = 0, sessionProgress = 0, confidenceLevel = 0, isFirstTime = false } = context;

  // First-time user encouragement
  if (isFirstTime) {
    return toast({
      title: "Welcome to your interview prep journey! 🌟",
      description: "You're taking a big step toward success. We're here to support you every step of the way!",
    });
  }

  // Answer length encouragement
  if (answerLength > 0 && answerLength < 50) {
    return toast({
      title: "Good start! ✨",
      description: "Take your time to expand on your thoughts. More detail helps showcase your experience!",
    });
  }

  if (answerLength >= 200) {
    return toast({
      title: "Excellent detail! 🎯",
      description: "You're providing great examples. This level of detail will impress interviewers!",
    });
  }

  // Progress-based encouragement
  if (sessionProgress >= 75) {
    return toast({
      title: "Almost there! 🏁",
      description: "You're so close to completing this session. Your dedication is inspiring!",
    });
  }

  // Confidence-based encouragement
  if (confidenceLevel >= 80) {
    return toast({
      title: "Your confidence is shining! ⭐",
      description: "You're radiating the kind of confidence that gets people hired. Keep it up!",
    });
  }

  // Default positive reinforcement
  return toast({
    title: "You're doing great! 👍",
    description: "Every moment of practice is an investment in your future success.",
  });
};