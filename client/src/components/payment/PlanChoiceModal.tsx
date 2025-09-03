import { useState } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useSubscriptionRefresh } from "@/hooks/use-subscription-refresh";
import { CreditCard, Zap } from "lucide-react";
import PlanCard from "./PlanCard";

interface PlanChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: any; // Pass subscription data from parent
}

export default function PlanChoiceModal({ isOpen, onClose, subscription }: PlanChoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { refreshSubscription } = useSubscriptionRefresh();

  // Only log when modal is actually opened (not on every render)
  React.useEffect(() => {
    if (isOpen) {
      console.log('PlanChoiceModal opened with user subscription:', subscription?.subscription?.status || subscription?.subscriptionStatus);
    }
  }, [isOpen]);

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (planType: 'starter' | 'premium') => {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', { planType });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Checkout session error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }
    },
    onSuccess: (data) => {
      if (data && data.url) {
        // Close modal first, then redirect
        onClose();
        setIsProcessing(null);
        setErrorMessage(null);
        // Use timeout to ensure modal closes before redirect
        setTimeout(() => {
          window.location.href = data.url;
        }, 100);
      } else {
        console.error('No checkout URL received');
        setErrorMessage('Error creating checkout session. Please try again.');
        setIsProcessing(null);
      }
    },
    onError: (error: any) => {
      console.error('Checkout session creation failed:', error);
      setErrorMessage('Failed to create checkout session. Please try again.');
      setIsProcessing(null);
    },
  });

  const handleUpgrade = (planType: 'starter' | 'premium') => {
    const userSubscriptionStatus = subscription?.subscription?.status || subscription?.subscriptionStatus;
    
    // Don't allow upgrading to a plan user already has
    if ((planType === 'starter' && userSubscriptionStatus === 'starter') ||
        (planType === 'premium' && userSubscriptionStatus === 'premium')) {
      return;
    }
    
    // Clear any previous errors
    setErrorMessage(null);
    setIsProcessing(planType);
    createCheckoutSessionMutation.mutate(planType);
  };

  const isCurrentPlan = (planType: 'starter' | 'premium') => {
    const userSubscriptionStatus = subscription?.subscription?.status || subscription?.subscriptionStatus;
    return (planType === 'starter' && userSubscriptionStatus === 'starter') ||
           (planType === 'premium' && userSubscriptionStatus === 'premium');
  };

  const isPlanDisabled = (planType: 'starter' | 'premium') => {
    const userSubscriptionStatus = subscription?.subscription?.status || subscription?.subscriptionStatus;
    
    // Disable starter if user already has starter or premium
    if (planType === 'starter' && (userSubscriptionStatus === 'starter' || userSubscriptionStatus === 'premium')) {
      return true;
    }
    // Disable premium if user already has premium
    if (planType === 'premium' && userSubscriptionStatus === 'premium') {
      return true;
    }
    return false;
  };

  const getPremiumPrice = () => {
    const userSubscriptionStatus = subscription?.subscription?.status || subscription?.subscriptionStatus;
    
    // If user has starter plan, they pay upgrade price (€100)
    if (userSubscriptionStatus === 'starter') {
      return { price: 100, label: 'Upgrade for €100', description: 'Upgrade from Starter • Lifetime access' };
    }
    // Otherwise full price
    return { price: 149, label: 'Get Lifetime Access - €149', description: 'One-time payment • Lifetime access' };
  };

  const premiumPricing = getPremiumPrice();

  return (
    <Dialog open={isOpen}>
      <DialogPortal>
        <DialogOverlay className="z-[105]" />
        <DialogContent className="w-[85vw] max-w-[350px] sm:max-w-[400px] md:max-w-[700px] z-[110] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-2 sm:p-4" style={{ pointerEvents: 'auto' }}>
          {/* Required DialogTitle for accessibility */}
          <DialogTitle className="sr-only">Choose Your Plan</DialogTitle>
          
          {/* Custom Close Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-3 top-3 z-50 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            type="button"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            <span className="sr-only">Close</span>
          </button>
          
        <DialogHeader className="pb-3 px-1">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="w-5 h-5 text-yellow-500" />
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-sm">
            Invest in your career success with our comprehensive interview preparation tools
          </DialogDescription>
        </DialogHeader>

        <div className="pb-2 px-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
            {/* Starter Package */}
            <PlanCard
              planType="starter"
              title="Interview Confidence Starter"
              price="€49"
              description="One-time payment • 30-day access"
              features={[
                "1 full interview practice session",
                "AI-powered CV analysis",
                "STAR method evaluation",
                "Detailed performance feedback",
                "30-day access to results"
              ]}
              buttonText="Get Started €49"
              buttonColor="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              borderColor="border-blue-200"
              headerGradient="bg-gradient-to-r from-blue-50 to-indigo-50"
              isCurrentPlan={isCurrentPlan('starter')}
              isDisabled={isPlanDisabled('starter')}
              isProcessing={isProcessing === 'starter'}
              onSelect={() => handleUpgrade('starter')}
            />

            {/* Premium Package */}
            <PlanCard
              planType="premium"
              title="Lifetime Premium Access"
              price={`€${premiumPricing.price}`}
              description={premiumPricing.description}
              features={[
                "Unlimited interview sessions",
                "All competency frameworks",
                "Progress tracking over time",
                "Export interview reports",
                "Lifetime access - never expires"
              ]}
              buttonText={premiumPricing.label}
              buttonColor="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              borderColor="border-purple-200"
              headerGradient="bg-gradient-to-r from-purple-50 to-pink-50"
              isCurrentPlan={isCurrentPlan('premium')}
              isDisabled={isPlanDisabled('premium')}
              isProcessing={isProcessing === 'premium'}
              onSelect={() => handleUpgrade('premium')}
            />
          </div>

          {/* Trust Signals */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-3">
              <CreditCard className="w-3 h-3" />
              <span>Secure payment by Stripe</span>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 text-xs"
            >
              I'll keep struggling with free resources
            </Button>
          </div>
        </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}