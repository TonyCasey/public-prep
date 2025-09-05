import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Pause, Play } from "lucide-react";
import Timer from "../Timer";

interface QuestionTimerCardProps {
  timeElapsed: number;
  onTimeUpdate: (time: number) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  isEvaluating: boolean;
  hasQuestion: boolean;
}

export default function QuestionTimerCard({
  timeElapsed,
  onTimeUpdate,
  isPaused,
  onPauseToggle,
  isEvaluating,
  hasQuestion
}: QuestionTimerCardProps) {
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 shadow-lg">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Time Elapsed</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/80 rounded-lg px-2 py-1 border border-purple-100 shadow-sm">
              <Timer
                initialTime={timeElapsed}
                isPaused={isPaused}
                onTimeChange={onTimeUpdate}
                countUp={true}
                className="text-sm font-bold text-purple-700"
              />
            </div>
            
            <Button
              onClick={onPauseToggle}
              size="sm"
              variant="outline"
              disabled={!hasQuestion || isEvaluating}
              className="bg-white/80 hover:bg-purple-50 border-purple-200 hover:border-purple-300 shadow-sm"
            >
              {isPaused ? <Play className="w-4 h-4 text-green-600" /> : <Pause className="w-4 h-4 text-purple-600" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}