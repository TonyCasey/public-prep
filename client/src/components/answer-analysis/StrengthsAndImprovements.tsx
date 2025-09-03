import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrengthsAndImprovementsProps {
  strengths?: string;
  improvementAreas?: string;
}

export default function StrengthsAndImprovements({ strengths, improvementAreas }: StrengthsAndImprovementsProps) {
  if (!strengths && !improvementAreas) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
      {/* Always show Strengths card */}
      <Card className="border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {strengths ? (
            <ul className="space-y-2">
              {strengths.split(' • ').filter(s => s.trim()).map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{strength.trim()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500 italic">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
              <span>No specific strengths identified in this response</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Always show Improvements card */}
      <Card className="border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {improvementAreas ? (
            <ul className="space-y-2">
              {improvementAreas.split(' • ').filter(s => s.trim()).map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{improvement.trim()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500 italic">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
              <span>No specific improvements identified</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}