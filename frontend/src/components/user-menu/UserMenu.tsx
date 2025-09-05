import { useState } from "react";
import { User, Settings, LogOut, ChevronDown, CreditCard, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
// Import child components
import UserProfile from "./UserProfile";
import UserPreferences from "./UserPreferences";
import PlanDetails from "./PlanDetails";
import UpgradePlans from "./UpgradePlans";

interface UserMenuProps {
  onOpenProfile?: () => void;
  onOpenPreferences?: () => void;
}

export default function UserMenu({ onOpenProfile, onOpenPreferences }: UserMenuProps) {
  const { user, logoutMutation } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showMyPlan, setShowMyPlan] = useState(false);

  // Use user session data instead of separate subscription query
  const subscription = user;

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (planType: 'starter' | 'premium' | 'upgrade' = 'premium') => {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', { planType });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('UserMenu checkout session created:', data);
      if (data.url) {
        console.log('UserMenu redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('UserMenu no URL received:', data);
      }
    },
    onError: (error) => {
      console.error('UserMenu checkout session error:', error);
      console.error('UserMenu error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    },
  });

  const createBillingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/billing-portal');
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      console.error('Billing portal error:', error);
    },
  });

  const handleUpgrade = (planType: 'starter' | 'premium' | 'upgrade' = 'premium') => {
    console.log('UserMenu handleUpgrade clicked:', planType);
    console.log('Mutation isPending:', createCheckoutSessionMutation.isPending);
    // Subscription data available
    createCheckoutSessionMutation.mutate(planType);
  };

  const handleViewReceipt = () => {
    createBillingPortalMutation.mutate();
  };

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email || "User";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-auto px-3">
            <Avatar className="h-9 w-9 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 p-[2px]">
              <div className="h-full w-full rounded-full bg-white p-[1px]">
                <AvatarImage 
                  src={user?.profileImageUrl || undefined} 
                  alt={getUserDisplayName()} 
                  className="rounded-full"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 text-white font-semibold">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </div>
            </Avatar>
            <span className="ml-2 hidden md:inline-block font-medium text-gray-700">
              {user?.firstName || user?.email?.split('@')[0] || 'User'}
            </span>
            <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfile(true)} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowMyPlan(true)} className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>My Plan</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPreferences(true)} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <UserProfile 
        user={user}
        showProfile={showProfile}
        onClose={() => setShowProfile(false)}
        getInitials={getInitials}
        getUserDisplayName={getUserDisplayName}
      />

      {/* Preferences Dialog */}
      <UserPreferences 
        showPreferences={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* My Plan Dialog */}
      {showMyPlan && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-2 pt-4 sm:pt-2">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-4 sm:p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">My Plan</h2>
                    <p className="text-emerald-100 text-sm">Your subscription details</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMyPlan(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
              {/* Current Plan */}
              <PlanDetails 
                subscription={subscription}
                onUpgrade={handleUpgrade}
                onViewReceipt={handleViewReceipt}
                isUpgradeLoading={createCheckoutSessionMutation.isPending}
                isBillingLoading={createBillingPortalMutation.isPending}
              />

              {/* Upgrade Options for Free Users */}
              {subscription?.subscriptionStatus !== 'premium' && subscription?.subscriptionStatus !== 'starter' && (
                <UpgradePlans 
                  onUpgrade={handleUpgrade}
                  isUpgradeLoading={createCheckoutSessionMutation.isPending}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}