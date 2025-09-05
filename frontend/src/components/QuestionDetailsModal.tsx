import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Star, X } from "lucide-react";
import type { Answer } from "@shared/schema";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface QuestionDetailsModalProps {
  answer: Answer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuestionDetailsModal({ answer, open, onOpenChange }: QuestionDetailsModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open && answer) {
      setIsAnimating(true);
    }
  }, [open, answer]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onOpenChange(false);
    }, 300);
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Slide-out Panel from Left */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 left-0 w-[600px] max-w-[90%] bg-white shadow-2xl z-[121] transition-transform duration-300 ease-out overflow-hidden border-r border-gray-200",
          isAnimating ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Question Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {answer && (
            <div className="space-y-6">
              {/* Question and Competency */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Question</h3>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {(answer as any).questionText || 'Question details not available'}
                </p>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {(answer as any).competency}
                </Badge>
              </div>
              
              {/* Score and Time */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {0}%
                        </p>
                      </div>
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${
                        false ? 'from-green-400 to-green-600' :
                        false ? 'from-blue-400 to-blue-600' :
                        false ? 'from-purple-400 to-purple-600' :
                        false ? 'from-orange-400 to-orange-600' :
                        'from-red-400 to-red-600'
                      } flex items-center justify-center shadow-lg`}>
                        <Star className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Time Spent</p>
                        <p className="text-3xl font-bold text-purple-700">
                          {answer.timeSpent ? 
                            `${Math.floor(answer.timeSpent / 60)}:${(answer.timeSpent % 60).toString().padStart(2, '0')}` 
                            : '0:00'}
                        </p>
                      </div>
                      <Clock className="w-16 h-16 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Your Answer */}
              <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-lg">Your Answer</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {answer.answerText || 'No answer provided'}
                  </p>
                </CardContent>
              </Card>
              
              {/* TODO: Fetch and display rating data (STAR analysis, feedback, etc.) from ratings table */}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}