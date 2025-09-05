import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lightbulb } from "lucide-react";
import { competencies } from "@/lib/competencies";

const competencyScores = {
  "team_leadership": 92,
  "judgement_analysis_decision_making": 85,
  "management_delivery_results": 78,
  "interpersonal_communication_skills": 88,
  "specialist_knowledge_expertise_self_development": 72,
  "drive_commitment": 81,
};

const sampleAnswer = {
  situation: "In my role as Senior Administrative Officer, our department underwent a digital transformation, requiring migration from paper-based processes to a new digital workflow system affecting 15 staff members.",
  task: "As team lead, I needed to ensure smooth transition while maintaining service delivery, managing staff concerns about job security, and achieving the 6-month implementation deadline.",
  action: "I developed a comprehensive change management approach: conducted individual consultations, established peer mentoring pairs, created weekly progress meetings, and implemented gradual system rollout with parallel testing phases.",
  result: "Implementation completed 2 weeks ahead of schedule with 100% staff adoption, 40% improvement in processing times, and zero service disruptions. Staff satisfaction increased from 60% to 85%.",
  overallScore: 9.0,
  scores: { situation: 9, task: 8, action: 9, result: 10 }
};

const interviewTips = [
  {
    number: 1,
    title: "Use Specific Examples",
    description: "Always provide concrete examples with measurable outcomes and timeframes.",
    color: "bg-primary"
  },
  {
    number: 2,
    title: "Address All Competencies", 
    description: "Ensure your answers demonstrate multiple competencies where possible.",
    color: "bg-secondary"
  },
  {
    number: 3,
    title: "Show Personal Impact",
    description: "Emphasize your individual contribution and leadership role in outcomes.",
    color: "bg-accent"
  },
  {
    number: 4,
    title: "Include Lessons Learned",
    description: "Demonstrate reflection and continuous improvement mindset.",
    color: "bg-purple-500"
  },
];

export default function CompetenciesTab() {
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);

  const getScoreStatus = (score: number) => {
    if (score >= 85) return { label: "Strong", variant: "default" as const, color: "text-green-600" };
    if (score >= 70) return { label: "Good", variant: "secondary" as const, color: "text-blue-600" };
    return { label: "Needs Focus", variant: "destructive" as const, color: "text-orange-600" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Competency Details */}
      <div className="space-y-6">
        {competencies.map((competency) => {
          const score = competencyScores[competency.id as keyof typeof competencyScores];
          const status = getScoreStatus(score);
          
          return (
            <Card key={competency.id} className="hover-lift confidence-boost transition-all duration-300 group hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">{competency.name}</CardTitle>
                  <Badge variant={status.variant} className="group-hover:scale-110 transition-transform duration-300">{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Key Performance Indicators:</h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    {competency.indicators.map((indicator, index) => (
                      <li key={index}>• {indicator}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Your Performance:</h4>
                  <div className="flex items-center space-x-3 group/progress">
                    <Progress value={score} className="flex-1 group-hover/progress:shadow-sm transition-all duration-300" />
                    <span className={`text-lg font-semibold ${status.color} group-hover/progress:scale-110 transition-transform duration-300`}>
                      {(score / 10).toFixed(1)}/10
                    </span>
                    {score >= 80 && (
                      <span className="text-xs opacity-0 group-hover/progress:opacity-100 transition-opacity duration-300 text-green-600">
                        Excellent! 🌟
                      </span>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full transition-all duration-300 hover:scale-105 group/btn"
                  variant={score < 80 ? "default" : "outline"}
                >
                  <span className="group-hover/btn:font-medium transition-all duration-200">
                    {score < 80 ? "Focus Practice:" : "Practice"} {competency.shortName} Questions
                  </span>
                  <span className="ml-2 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                    {score < 80 ? "🎯" : "✨"}
                  </span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sample Answers & Tips */}
      <div className="space-y-6">
        {/* Sample High-Scoring Answer */}
        <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">High-Scoring Answer Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg mb-4">
                <p className="text-sm font-medium text-purple-800">Question: Team Leadership</p>
                <p className="text-sm text-purple-700">
                  Describe a time when you had to lead a team through a significant change.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-green-800 mb-1">
                    SITUATION (Score: {sampleAnswer.scores.situation}/10)
                  </p>
                  <p className="text-sm text-neutral-700">"{sampleAnswer.situation}"</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    TASK (Score: {sampleAnswer.scores.task}/10)
                  </p>
                  <p className="text-sm text-neutral-700">"{sampleAnswer.task}"</p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-purple-800 mb-1">
                    ACTION (Score: {sampleAnswer.scores.action}/10)
                  </p>
                  <p className="text-sm text-neutral-700">"{sampleAnswer.action}"</p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-orange-800 mb-1">
                    RESULT (Score: {sampleAnswer.scores.result}/10)
                  </p>
                  <p className="text-sm text-neutral-700">"{sampleAnswer.result}"</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">Overall Score</span>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{sampleAnswer.overallScore}/10</span>
              </div>
              <p className="text-xs text-purple-700">
                Excellent use of STAR method with specific metrics and clear competency demonstration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interview Tips */}
        <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Interview Success Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviewTips.map((tip) => (
                <div key={tip.number} className="flex items-start space-x-3">
                  <div className={`w-6 h-6 ${tip.color} text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0`}>
                    {tip.number}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tip.title}</p>
                    <p className="text-xs text-neutral-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competency Quick Reference */}
        <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Quick Competency Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competencies.map((competency) => {
                const score = competencyScores[competency.id as keyof typeof competencyScores];
                const normalizedScore = score / 10;
                const status = getScoreStatus(score);
                
                return (
                  <div key={competency.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                    <span className="text-sm font-medium">{competency.shortName}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={score} className="w-16" />
                      <span className={`text-xs ${status.color}`}>
                        {normalizedScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
