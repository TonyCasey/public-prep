import { Lightbulb, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImprovedAnswerProps {
  improvedAnswer?: string;
  isSampleQuestion?: boolean;
}

export default function ImprovedAnswer({ improvedAnswer, isSampleQuestion = false }: ImprovedAnswerProps) {
  if (!improvedAnswer) return null;

  const parseAnswer = (text: string) => {
    return text.split('\n\n').map((paragraph: string, idx: number) => {
      const isHeading = paragraph.match(/^(Situation:|Task:|Action:|Result:)/);
      if (isHeading) {
        const [heading, ...content] = paragraph.split(':');
        return (
          <div key={idx}>
            <h4 className="font-semibold text-green-700 mb-1">{heading}:</h4>
            <p className="text-gray-700 leading-relaxed">{content.join(':').trim()}</p>
          </div>
        );
      }
      return <p key={idx} className="text-gray-700 leading-relaxed">{paragraph}</p>;
    });
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          AI Improvements
        </CardTitle>
        <p className="text-sm text-purple-700 mt-1">Here's how AI would improve your answer for a higher score:</p>
      </CardHeader>
      <CardContent className="pt-4 relative">
        <div className={cn("space-y-4", isSampleQuestion && "blur-sm")}>
          {parseAnswer(improvedAnswer)}
        </div>
        {isSampleQuestion && (
          <div className="absolute inset-0 flex items-start justify-center pt-4">
            <a 
              href="/auth?mode=signup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
            >
              <Star className="w-5 h-5" />
              Register to Unlock
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}