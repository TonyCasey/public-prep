import { CheckCircle, Star, Zap, Check, Crown, Award, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanDetailsProps {
  subscription: any;
  onUpgrade: (planType: 'starter' | 'premium' | 'upgrade') => void;
  onViewReceipt: () => void;
  isUpgradeLoading: boolean;
  isBillingLoading: boolean;
}

export default function PlanDetails({ 
  subscription, 
  onUpgrade, 
  onViewReceipt,
  isUpgradeLoading,
  isBillingLoading
}: PlanDetailsProps) {
  const isPremium = subscription?.subscriptionStatus === 'premium';
  const isStarter = subscription?.subscriptionStatus === 'starter';
  const isFree = !isPremium && !isStarter;

  return (
    <>
      
      {isPremium ? (
        <div className="space-y-4">
          {/* Premium Features Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Premium Benefits Active</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-green-700">Unlimited Interviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-green-700">Lifetime Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-green-700">Advanced AI Coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="text-green-700">Priority Support</span>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Investment:</span>
              <span className="font-semibold text-green-600">€149.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-600">Active Forever</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Activated:</span>
              <span className="font-medium">
                {subscription?.updatedAt ? new Date(subscription.updatedAt).toLocaleDateString('en-IE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
            {subscription?.subscriptionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reference:</span>
                <span className="font-medium text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {subscription.subscriptionId.substring(0, 20)}...
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Receipt:</span>
              <div className="text-right">
                <button
                  onClick={onViewReceipt}
                  disabled={isBillingLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isBillingLoading ? 'Loading...' : 'View Receipt'}
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  Or email support@publicprep.ie
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isStarter ? (
        <div className="space-y-4">
          {/* Starter Usage Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Starter Package Active</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-blue-600" />
                <span className="text-blue-700">1 Full Interview</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-blue-600" />
                <span className="text-blue-700">CV Analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-blue-600" />
                <span className="text-blue-700">AI Feedback</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-blue-600" />
                <span className="text-blue-700">30 Days Access</span>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Investment:</span>
              <span className="font-semibold text-blue-600">€49.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-blue-600">Active</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Usage:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((subscription?.starterInterviewsUsed || 0) / 1) * 100}%` }}
                  ></div>
                </div>
                <span className="font-medium text-sm">{subscription?.starterInterviewsUsed || 0}/1</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Time Remaining:</span>
              <span className="font-medium text-amber-600">
                {subscription?.starterExpirationDate 
                  ? Math.max(0, Math.ceil((new Date(subscription.starterExpirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : 30
                } days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Activated:</span>
              <span className="font-medium">
                {subscription?.updatedAt ? new Date(subscription.updatedAt).toLocaleDateString('en-IE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
            {subscription?.subscriptionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reference:</span>
                <span className="font-medium text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {subscription.subscriptionId.substring(0, 20)}...
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Receipt:</span>
              <div className="text-right">
                <button
                  onClick={onViewReceipt}
                  disabled={isBillingLoading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isBillingLoading ? 'Loading...' : 'View Receipt'}
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  Or email support@publicprep.ie
                </p>
              </div>
            </div>
          </div>
          {/* Upgrade to Premium option for starter users */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-purple-700 font-bold">
                Upgrade Package to Lifetime
              </p>
            </div>
            <p className="text-xs text-purple-600 mb-4">
              Get unlimited interviews and lifetime access to all features with Premium.
            </p>
            <Button 
              onClick={() => onUpgrade('upgrade')}
              disabled={isUpgradeLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isUpgradeLoading ? "Processing..." : "Upgrade to Lifetime - €100"}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              ⚡ Instant access • 🔒 Secure payment • 💯 One-time fee
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Free Trial Features */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Free Trial Access</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-gray-600" />
                <span className="text-gray-700">1 Sample Interview</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-gray-600" />
                <span className="text-gray-700">Basic AI Feedback</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-gray-600" />
                <span className="text-gray-700">Grade Selection</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-gray-600" />
                <span className="text-gray-700">No Time Limit</span>
              </div>
            </div>
          </div>

          {/* Usage Summary */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Free Usage:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((subscription?.freeInterviewsUsed || 0) / 1) * 100}%` }}
                  ></div>
                </div>
                <span className="font-medium text-sm">{subscription?.freeInterviewsUsed || 0}/1</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Access Level:</span>
              <span className="font-medium text-gray-600">Trial</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}