import { Check, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UpgradePlansProps {
  onUpgrade: (planType: 'starter' | 'premium') => void;
  isUpgradeLoading: boolean;
}

export default function UpgradePlans({ onUpgrade, isUpgradeLoading }: UpgradePlansProps) {
  return (
    <div className="space-y-4 mt-4">
      <h4 className="font-semibold text-gray-900 mb-3">Choose Your Plan</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Starter Plan */}
        <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-300 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-blue-700">
                Interview Confidence Starter
              </CardTitle>
              <Badge className="bg-blue-600 text-white">
                Popular
              </Badge>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              €49
              <span className="text-sm font-normal text-gray-500 ml-2">one-time</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-600 mb-4">
              Perfect for candidates with upcoming interviews
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>1 Full Practice Interview Session</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>30 Days Access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Complete CV Analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>AI-Powered Feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Interview Performance Report</span>
              </li>
            </ul>
            <Button 
              onClick={() => onUpgrade('starter')}
              disabled={isUpgradeLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              {isUpgradeLoading ? "Processing..." : "Get Starter"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative overflow-hidden border-2 border-purple-300 hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            BEST VALUE
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-purple-700">
                Lifetime Premium Access
              </CardTitle>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              €149
              <span className="text-sm font-normal text-gray-500 ml-2">lifetime</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-purple-600 mb-4">
              Everything you need to excel at public service interviews
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Unlimited Practice Interviews</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Lifetime Access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Advanced Analytics Dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Multiple CV Analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Priority Support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Future Updates Included</span>
              </li>
            </ul>
            <Button 
              onClick={() => onUpgrade('premium')}
              disabled={isUpgradeLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <Rocket className="w-4 h-4 mr-2" />
              {isUpgradeLoading ? "Processing..." : "Get Premium"}
            </Button>
            <p className="text-xs text-center text-gray-500">
              ⚡ Most popular choice • 💯 Best value
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}