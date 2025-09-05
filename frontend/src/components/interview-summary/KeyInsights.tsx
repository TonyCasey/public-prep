import { TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KeyInsightsProps {
  competencyScores: Record<string, { total: number; count: number; scores: number[] }>;
}

export default function KeyInsights({ competencyScores }: KeyInsightsProps) {
  const sortedCompetencies = Object.entries(competencyScores).sort((a, b) => 
    (b[1].total / b[1].count) - (a[1].total / a[1].count)
  );
  
  const strongest = sortedCompetencies[0]?.[0] || 'N/A';
  const weakest = sortedCompetencies[sortedCompetencies.length - 1]?.[0] || 'N/A';

  return (
    <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Key Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Strongest Competency</p>
              <p className="text-sm text-gray-600">{strongest}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">Area for Improvement</p>
              <p className="text-sm text-gray-600">{weakest}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}