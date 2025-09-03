import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeedbackSectionProps {
  feedback?: string;
}

export default function FeedbackSection({ feedback }: FeedbackSectionProps) {
  if (!feedback) return null;

  const formatFeedback = (text: string) => {
    // Check if feedback already has paragraph breaks
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // If it's just one long paragraph, try to split it intelligently
    if (paragraphs.length === 1) {
      // Split on common transition phrases and sentence patterns
      const sentences = text
        .replace(/\. However,/g, '.\n\nHowever,')
        .replace(/\. While/g, '.\n\nWhile')
        .replace(/\. The answer/g, '.\n\nThe answer')
        .replace(/\. Your answer/g, '.\n\nYour answer')
        .replace(/\. Consider/g, '.\n\nConsider')
        .replace(/\. To improve/g, '.\n\nTo improve')
        .replace(/\. For example/g, '.\n\nFor example')
        .replace(/\. Additionally/g, '.\n\nAdditionally')
        .split('\n\n')
        .filter(p => p.trim());
      
      return sentences;
    }
    
    return paragraphs;
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          AI Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {formatFeedback(feedback).map((paragraph, idx) => (
            <p key={idx} className="text-gray-700 leading-relaxed">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}