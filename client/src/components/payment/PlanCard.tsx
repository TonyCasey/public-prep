import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

interface PlanCardProps {
  planType: 'starter' | 'premium';
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonColor: string;
  borderColor: string;
  headerGradient: string;
  isCurrentPlan: boolean;
  isDisabled: boolean;
  isProcessing: boolean;
  onSelect: () => void;
}

export default function PlanCard({
  planType,
  title,
  price,
  description,
  features,
  buttonText,
  buttonColor,
  borderColor,
  headerGradient,
  isCurrentPlan,
  isDisabled,
  isProcessing,
  onSelect
}: PlanCardProps) {
  return (
    <Card className={`border-2 shadow-lg relative ${
      isDisabled ? 'border-gray-200 opacity-75' : borderColor
    }`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className={`${
            planType === 'starter' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          } text-white px-3 py-1 text-sm`}>
            Current Plan
          </Badge>
        </div>
      )}
      <CardHeader className={`rounded-t-lg py-3 sm:py-4 ${
        isDisabled ? 'bg-gray-50' : headerGradient
      }`}>
        <div className="text-center">
          <CardTitle className={`text-base sm:text-lg font-bold ${
            planType === 'starter' ? 'text-blue-800' : 'text-purple-800'
          } leading-tight`}>
            {title}
          </CardTitle>
          <div className={`text-xl sm:text-2xl font-bold mt-1 ${
            planType === 'starter' ? 'text-blue-600' : 'text-purple-600'
          }`}>
            {price}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="py-2 sm:py-3 px-1 sm:px-2">
        <ul className="space-y-1 sm:space-y-2 mb-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 ${
                planType === 'starter' ? 'text-blue-500' : 'text-purple-500'
              }`} />
              <span className="text-xs sm:text-sm leading-tight">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={onSelect}
          disabled={isDisabled || isProcessing}
          className={`w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold ${buttonColor}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">Loading...</span>
            </>
          ) : (
            buttonText
          )}
        </Button>
      </CardContent>
    </Card>
  );
}