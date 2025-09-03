import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

/**
 * Provider-agnostic CRM tracking hook
 * Works with any configured CRM provider (HubSpot, Monday.com, etc.)
 */
export function useCRMTracking() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Track page views automatically
  useEffect(() => {
    if (user?.email) {
      // Send page view to backend for CRM tracking
      fetch('/api/crm/track-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: location,
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.debug('CRM page tracking failed:', err);
      });
    }
  }, [location, user?.email]);

  // Track specific feature usage
  const trackFeature = (feature: string, metadata?: any) => {
    if (user?.email) {
      fetch('/api/crm/track-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature,
          metadata,
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.debug('CRM feature tracking failed:', err);
      });
    }
  };

  return {
    trackFeature
  };
}