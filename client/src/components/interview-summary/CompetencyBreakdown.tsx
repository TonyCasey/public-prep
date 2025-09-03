import { BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CompetencyBreakdownProps {
  competencyScores: Record<string, { total: number; count: number; scores: number[] }>;
}

const competencyColors: Record<string, { bg: string, border: string }> = {
  'Team Leadership': { bg: 'bg-blue-500', border: 'border-blue-600' },
  'Judgement, Analysis & Decision Making': { bg: 'bg-purple-500', border: 'border-purple-600' },
  'Management & Delivery of Results': { bg: 'bg-green-500', border: 'border-green-600' },
  'Interpersonal & Communication Skills': { bg: 'bg-orange-500', border: 'border-orange-600' },
  'Specialist Knowledge, Expertise & Self Development': { bg: 'bg-red-500', border: 'border-red-600' },
  'Specialist Knowledge, Expertise and Self Development': { bg: 'bg-red-500', border: 'border-red-600' },
  'Drive & Commitment': { bg: 'bg-indigo-500', border: 'border-indigo-600' }
};

export default function CompetencyBreakdown({ competencyScores }: CompetencyBreakdownProps) {
  return (
    <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Competency Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(competencyScores).map(([competency, data]) => {
            // Scores are out of 10, convert to percentage
            const avgScore = Math.round((data.total / data.count) * 10);
            const colors = competencyColors[competency] || { bg: 'bg-gray-500', border: 'border-gray-600' };
            
            return (
              <div key={competency} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">{competency}</span>
                    <p className="text-sm text-gray-500">{data.count} questions answered</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Beautiful circular percentage badge */}
                    <div className={`w-16 h-16 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-lg transform transition-transform hover:scale-110`}>
                      <span className="text-white font-bold text-lg">{avgScore}%</span>
                    </div>
                  </div>
                </div>
                <Progress value={avgScore} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}