import { useMemo } from "react";
import type { Interview } from "@shared/schema";

export function useSessionStats(sessions: Interview[]) {
  return useMemo(() => {
    const completedSessions = sessions.filter(s => s.completedAt);
    
    // Calculate total interviews
    const totalInterviews = sessions.length;
    
    // Calculate average score
    const averageScore = completedSessions.length > 0 
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + ((s as any).averageScore || 0), 0) / completedSessions.length
        )
      : 0;
    
    // Calculate pass rate
    const passedSessions = completedSessions.filter(s => ((s as any).averageScore || 0) >= 60);
    const passRate = completedSessions.length > 0 
      ? Math.round((passedSessions.length / completedSessions.length) * 100)
      : 0;
    
    // Find highest score
    const highestScore = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => (s as any).averageScore || 0))
      : 0;
    
    // Calculate improvement trend
    const calculateTrend = () => {
      if (completedSessions.length < 2) return 0;
      
      const sortedCompleted = [...completedSessions].sort((a, b) => {
        const dateA = new Date(a.completedAt || new Date()).getTime();
        const dateB = new Date(b.completedAt || new Date()).getTime();
        return dateB - dateA;
      });
      
      const lastScore = (sortedCompleted[0] as any).averageScore || 0;
      const olderScores = sortedCompleted.slice(1).map(s => (s as any).averageScore || 0);
      const olderAverage = olderScores.length > 0 
        ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length 
        : 0;
      
      return lastScore - olderAverage;
    };
    
    const improvementTrend = calculateTrend();
    
    // Calculate practice streak
    const calculateStreak = () => {
      if (sessions.length === 0) return { streak: 0, weekCount: 0 };
      
      const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = new Date((a as any).createdAt || new Date()).getTime();
        const dateB = new Date((b as any).createdAt || new Date()).getTime();
        return dateB - dateA;
      });
      
      // Calculate week count (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekCount = sortedSessions.filter(s => {
        const sessionDate = new Date((s as any).createdAt || new Date());
        return sessionDate >= oneWeekAgo;
      }).length;
      
      // Calculate consecutive day streak
      const practiceDays = new Set<string>();
      sortedSessions.forEach(session => {
        const date = new Date((session as any).createdAt || new Date());
        const dateStr = date.toISOString().split('T')[0];
        practiceDays.add(dateStr);
      });
      
      const sortedDays = Array.from(practiceDays).sort().reverse();
      let streak = 0;
      
      if (sortedDays.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastPracticeDate = new Date(sortedDays[0]);
        const daysSinceLastPractice = Math.floor(
          (today.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastPractice <= 1) {
          streak = 1;
          for (let i = 1; i < sortedDays.length; i++) {
            const currentDate = new Date(sortedDays[i]);
            const prevDate = new Date(sortedDays[i - 1]);
            const dayDiff = Math.floor(
              (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (dayDiff === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }
      
      return { streak, weekCount };
    };
    
    const { streak, weekCount } = calculateStreak();
    
    return {
      totalInterviews,
      averageScore,
      passRate,
      highestScore,
      improvementTrend,
      streak,
      weekCount,
      completedSessions,
      inProgressSessions: sessions.filter(s => s.isActive && !s.completedAt)
    };
  }, [sessions]);
}