import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, TrendingUp, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DashboardStatsProps {
  stats: {
    totalInterviews: number;
    passRate: number;
    averageScore: number;
    highestScore: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statsData = [
    {
      icon: Trophy,
      value: stats.totalInterviews.toString(),
      label: "Total Interviews",
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      progress: null
    },
    {
      icon: Target,
      value: `${Math.round(stats.passRate)}%`,
      label: "Pass Rate",
      color: "text-green-600", 
      bgColor: "bg-gradient-to-br from-green-50 to-green-100/50",
      progress: stats.passRate
    },
    {
      icon: TrendingUp,
      value: `${Math.round(stats.averageScore)}%`,
      label: "Average Score",
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50", 
      progress: stats.averageScore
    },
    {
      icon: Award,
      value: `${Math.round(stats.highestScore)}%`,
      label: "Highest Score",
      color: "text-yellow-600",
      bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100/50",
      progress: stats.highestScore
    }
  ];

  return (
    <Card className="border-gray-200 shadow-lg bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full"></div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full"></div>
      
      <CardContent className="pt-4 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={`${stat.bgColor} p-3 rounded-lg border-2 border-white/50 hover:border-gray-200 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 relative overflow-hidden`}
              >
                <div className="flex flex-col items-center text-center">
                  <IconComponent className={`w-6 h-6 ${stat.color} mb-2`} />
                  <span className={`text-xl font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </span>
                  <p className="text-xs text-gray-700 font-medium leading-tight">
                    {stat.label}
                  </p>
                  {stat.progress !== null && (
                    <Progress value={stat.progress} className="mt-2 h-1.5 w-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}