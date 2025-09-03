import { useEffect, useState } from 'react';

export interface AnswerAnalysisData {
  overallScore?: number;
  competencyScores?: Record<string, number>;
  starMethodAnalysis?: {
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  feedback?: string;
  strengths?: string[];
  improvementAreas?: string[];
  improvedAnswer?: string;
  userAnswer?: string;
  questionText?: string;
  competency?: string;
  isLoading?: boolean;
  evaluationStage?: number;
  error?: string;
  userFriendlyError?: boolean;
  answerId?: string;
}

// Global function to show the modal initially with loading state
export function showAnswerAnalysisModal(initialData: Partial<AnswerAnalysisData> = {}) {
  const event = new CustomEvent('show-answer-analysis-modal', { 
    detail: { ...initialData, isLoading: true } 
  });
  window.dispatchEvent(event);
}

// Global function to update modal data progressively
export function updateAnswerAnalysisModal(data: Partial<AnswerAnalysisData>) {
  const event = new CustomEvent('update-answer-analysis-modal', { detail: data });
  window.dispatchEvent(event);
}

// Global function to complete the evaluation (backwards compatibility)
export function triggerAnswerAnalysisModal(data: AnswerAnalysisData) {
  const event = new CustomEvent('show-answer-analysis-modal', { 
    detail: { ...data, isLoading: false } 
  });
  window.dispatchEvent(event);
}

// Global function to show existing answer from database
export function showExistingAnswerModal(answerId: string) {
  const event = new CustomEvent('show-answer-analysis-modal', { 
    detail: { answerId, isLoading: true } 
  });
  window.dispatchEvent(event);
}

// Global function to show error in the modal
export function showAnswerAnalysisError(errorMessage: string, userFriendly: boolean = false, initialData: Partial<AnswerAnalysisData> = {}) {
  const event = new CustomEvent('show-answer-analysis-modal', { 
    detail: { 
      ...initialData, 
      error: errorMessage, 
      userFriendlyError: userFriendly,
      isLoading: false 
    } 
  });
  window.dispatchEvent(event);
}

export function useAnswerAnalysisModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnswerAnalysisData | null>(null);

  useEffect(() => {
    const handleShowModal = (event: CustomEvent<AnswerAnalysisData>) => {
      setAnalysisData(event.detail);
      setIsOpen(true);
    };

    const handleUpdateModal = (event: CustomEvent<Partial<AnswerAnalysisData>>) => {
      setAnalysisData(prev => prev ? { ...prev, ...event.detail } : null);
    };

    window.addEventListener('show-answer-analysis-modal', handleShowModal as EventListener);
    window.addEventListener('update-answer-analysis-modal', handleUpdateModal as EventListener);

    return () => {
      window.removeEventListener('show-answer-analysis-modal', handleShowModal as EventListener);
      window.removeEventListener('update-answer-analysis-modal', handleUpdateModal as EventListener);
    };
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    setAnalysisData(null);
  };

  return {
    isOpen,
    analysisData,
    closeModal
  };
}