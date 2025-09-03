import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { gtm } from '@/lib/gtm';

// Hook to automatically track page views when routes change
export function useGTMTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Track page view when location changes
    const trackPageView = () => {
      // Clean up the path for better tracking
      const cleanPath = location || '/';
      
      // Get page title based on current route
      const getPageTitle = (path: string): string => {
        const routes: Record<string, string> = {
          '/': 'Home - Public Prep',
          '/about': 'About - Public Prep',
          '/auth': 'Login - Public Prep',
          '/app': 'Dashboard - Public Prep',
          '/privacy': 'Privacy Policy - Public Prep',
          '/terms': 'Terms & Conditions - Public Prep',
          '/contact': 'Contact - Public Prep',
          '/payment-success': 'Payment Success - Public Prep',
          '/reset-password': 'Reset Password - Public Prep'
        };

        // Handle dynamic routes
        if (path.startsWith('/app/interview/')) {
          return 'Interview Practice - Public Prep';
        }

        return routes[path] || `${path} - Public Prep`;
      };

      const pageTitle = getPageTitle(cleanPath);
      
      // Track the page view
      gtm.pageView(cleanPath, pageTitle);
    };

    // Small delay to ensure GTM is loaded
    const timer = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timer);
  }, [location]);
}

// Enhanced tracking hooks for specific events
export function useGTMEvents() {
  return {
    trackClick: gtm.trackClick,
    trackFormSubmit: gtm.trackFormSubmit,
    trackAuth: gtm.trackAuth,
    trackPurchase: gtm.trackPurchase,
    trackInterview: gtm.trackInterview,
    trackSubscription: gtm.trackSubscription,
    trackCustomEvent: gtm.event
  };
}