import { Award, Target, Flame, Trophy, Sparkles, Calendar } from "lucide-react";
import type { Interview } from "@shared/schema";

interface AchievementBadgesProps {
  sessions: Interview[];
  streak: number;
}

interface Badge {
  condition: boolean;
  icon: React.ElementType;
  label: string;
  gradient: string;
}

export default function AchievementBadges({ sessions, streak }: AchievementBadgesProps) {
  const completedSessions = sessions.filter(s => s.completedAt);
  
  const badges: Badge[] = [
    {
      condition: sessions.length >= 1,
      icon: Award,
      label: "First Steps",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      condition: sessions.length >= 5,
      icon: Target,
      label: "Practice Pro",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      condition: sessions.length >= 10,
      icon: Flame,
      label: "Interview Master",
      gradient: "from-orange-500 to-red-500"
    },
    {
      condition: completedSessions.some(s => ((s as any).averageScore || 0) >= 80),
      icon: Trophy,
      label: "High Achiever",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      condition: completedSessions.some(s => ((s as any).averageScore || 0) >= 90),
      icon: Sparkles,
      label: "Excellence",
      gradient: "from-yellow-500 to-amber-500"
    },
    {
      condition: streak >= 7,
      icon: Calendar,
      label: "Week Warrior",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const earnedBadges = badges.filter(badge => badge.condition);

  if (earnedBadges.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">
        Achievements
      </h2>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {earnedBadges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-r ${badge.gradient} text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 animate-fadeIn`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-semibold">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}