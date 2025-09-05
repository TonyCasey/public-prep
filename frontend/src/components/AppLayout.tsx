import { Crown, Zap } from "lucide-react";
import logoPath from "@assets/logo-header.png";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu/UserMenu";
import PlanChoiceModal from "@/components/payment/PlanChoiceModal";
import GlobalAnswerAnalysisModal from "./modals/GlobalAnswerAnalysisModal";
import { useGlobalPaymentModal, triggerPaymentModal } from "@/hooks/use-payment-modal";


interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // Use auth hook for user session data (includes subscription info)
  const { user } = useAuth();
  
  // Global payment modal
  const { isOpen: isPaymentModalOpen, openModal: openPaymentModal, closeModal: closePaymentModal } = useGlobalPaymentModal();



  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (planType: 'starter' | 'premium' = 'premium') => {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', { planType });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Checkout session created:', data);
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Checkout session error:', error);
      alert('Failed to create checkout session. Please try again.');
    },
  });

  const handleUpgrade = () => {
    console.log('Upgrade button clicked - triggering payment modal event');
    triggerPaymentModal();
  };

  const isNonPremiumUser = user?.subscriptionStatus !== 'premium';

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header - Fixed positioning to prevent disappearing */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-32">
            <div className="flex items-center">
              <a href="/" className="hover:opacity-80 transition-opacity duration-200">
                <img 
                  src={logoPath} 
                  alt="Public Prep Logo" 
                  className="h-24 w-auto"
                />
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {/* Upgrade Button for Non-Premium Users */}
              {isNonPremiumUser && (
                <Button
                  onClick={handleUpgrade}
                  disabled={createCheckoutSessionMutation.isPending}
                  data-upgrade-button
                  className="hidden sm:flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 opacity-80 hover:opacity-90"
                  style={{ animation: 'gentle-pulse 3s ease-in-out infinite' }}
                >
                  <Crown className="w-4 h-4" />
                  <span className="text-sm">
                    {createCheckoutSessionMutation.isPending ? "Processing..." : "Upgrade"}
                  </span>
                </Button>
              )}
              
              {/* Mobile Upgrade Button */}
              {isNonPremiumUser && (
                <Button
                  onClick={handleUpgrade}
                  disabled={createCheckoutSessionMutation.isPending}
                  data-upgrade-button
                  size="sm"
                  className="sm:hidden flex items-center gap-1 h-9 px-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-md opacity-80 hover:opacity-90"
                  style={{ animation: 'gentle-pulse 3s ease-in-out infinite' }}
                >
                  <Crown className="w-3 h-3" />
                  <span className="text-xs">Upgrade</span>
                </Button>
              )}
              
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Flex-grow to fill available space */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer - Pushed to bottom */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={logoPath}
                  alt="Public Prep Logo"
                  className="h-24 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-4">
                Helping candidates excel in Ireland's Public Service interviews with AI-powered preparation tools.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><span className="text-gray-500">support@publicprep.ie</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Public Prep. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Global Plan Choice Modal */}
      <PlanChoiceModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        subscription={user}
      />

      {/* Global Answer Analysis Modal */}
      <GlobalAnswerAnalysisModal />
    </div>
  );
}