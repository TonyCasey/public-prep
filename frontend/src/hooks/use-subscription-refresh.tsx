import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook to refresh user subscription data
 * Use this after payment completion or subscription changes
 */
export function useSubscriptionRefresh() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const refreshSubscription = async () => {
    console.log('🔄 Refreshing user subscription data...');
    
    // Force refetch of user data by removing from cache and refetching
    queryClient.removeQueries({ queryKey: ["/api/user"] });
    
    // Immediately refetch fresh data from server with force invalidation
    const freshData = await queryClient.fetchQuery({ 
      queryKey: ["/api/user"],
      queryFn: async () => {
        console.log('🌐 Making direct API call to /api/user...');
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const userData = await response.json();
        console.log('🎯 Fresh user data received:', {
          id: userData.id,
          email: userData.email,
          subscriptionStatus: userData.subscriptionStatus
        });
        return userData;
      },
      staleTime: 0, // Force fresh data
    });
    
    console.log('✅ User subscription data refreshed with:', freshData);
    return freshData;
  };

  return { refreshSubscription };
}