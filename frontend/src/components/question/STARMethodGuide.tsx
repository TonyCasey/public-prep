import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, Zap, Trophy, Star } from "lucide-react";

export default function STARMethodGuide() {
  const starMethod = [
    {
      letter: "S",
      title: "Situation",
      description: "Set the scene - describe the context",
      icon: Target,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-700",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50"
    },
    {
      letter: "T",
      title: "Task",
      description: "Explain your responsibility or objective",
      icon: Lightbulb,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50"
    },
    {
      letter: "A",
      title: "Action",
      description: "Detail the specific steps you took",
      icon: Zap,
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-700",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50"
    },
    {
      letter: "R",
      title: "Result",
      description: "Share the outcome and what you learned",
      icon: Trophy,
      color: "from-amber-500 to-amber-600",
      textColor: "text-amber-700",
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100/50"
    }
  ];

  return (
    <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute -top-3 -left-3 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full"></div>
      <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full"></div>
      
      <CardHeader className="bg-gradient-to-r from-indigo-100 via-purple-100/50 to-pink-100/50 relative border-b border-purple-200/50 pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 relative z-10">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-md">
            <Star className="w-4 h-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">STAR Method Guide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {starMethod.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className={`${item.bgColor} p-3 rounded-lg border-2 border-white/50 hover:border-purple-200 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 relative overflow-hidden`}
              >
                {/* Mini decorative element */}
                <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br ${item.color} rounded-full opacity-20`}></div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {item.letter}
                  </div>
                  <IconComponent className={`w-4 h-4 ${item.textColor}`} />
                </div>
                <h4 className={`font-bold text-sm ${item.textColor} mb-1`}>
                  {item.title}
                </h4>
                <p className="text-xs text-gray-700 font-medium leading-tight">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}