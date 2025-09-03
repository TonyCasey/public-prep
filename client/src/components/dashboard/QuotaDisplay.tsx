import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crown } from "lucide-react";
import { differenceInDays } from "date-fns";

interface QuotaDisplayProps {
  subscription: {
    status: string;
    planType?: string;
    expiresAt?: string;
  };
  interviewsCompleted: number;
  onUpgradeClick: () => void;
}

export default function QuotaDisplay({ 
  subscription, 
  interviewsCompleted,
  onUpgradeClick 
}: QuotaDisplayProps) {
  if (subscription.status === 'premium') {
    return null; // Premium users don't see quota
  }

  const isStarter = subscription.status === 'starter';
  const daysRemaining = subscription.expiresAt 
    ? differenceInDays(new Date(subscription.expiresAt), new Date())
    : 0;

  if (subscription.status === 'free') {
    return (
      <Card className="border-orange-200 bg-orange-50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">
                Free Trial Used
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                You've completed your free trial interview. Upgrade to continue preparing.
              </p>
              <Button 
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isStarter) {
    const interviewsRemaining = Math.max(0, 1 - interviewsCompleted);
    
    return (
      <Card className="border-blue-200 bg-blue-50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Starter Package
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                {interviewsRemaining > 0 
                  ? `${interviewsRemaining} interview remaining • ${daysRemaining} days left`
                  : `Interview limit reached • ${daysRemaining} days left`
                }
              </p>
              {interviewsRemaining === 0 && (
                <Button 
                  onClick={onUpgradeClick}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}