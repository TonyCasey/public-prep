// Google Tag Manager utilities
// Environment configuration for GTM ID
const GTM_ID = import.meta.env.VITE_GTM_ID;
const NODE_ENV = import.meta.env.NODE_ENV || import.meta.env.VITE_NODE_ENV || 'development';

// Enable GTM on production domains (contains .ie)
const isProductionDomain = typeof window !== 'undefined' && window.location.hostname.includes('.ie');
const isGTMEnabled = GTM_ID && isProductionDomain;

// Declare global dataLayer variable
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    gtmInitialized?: boolean;
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Initialize GTM dynamically
export const initializeGTM = () => {
  if (typeof window === 'undefined' || !isGTMEnabled || window.gtmInitialized) {
    // Show debug messages when not on production domain
    if (!isProductionDomain && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('GTM disabled - not on production domain (.ie)');
    }
    return;
  }

  try {
    // Initialize GTM script
    (function(w: any, d: Document, s: string, l: string, i: string) {
      w[l] = w[l] || [];
      w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s) as HTMLScriptElement;
      const dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode?.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);

    // Initialize noscript fallback
    const noscriptElement = document.getElementById('gtm-noscript');
    if (noscriptElement) {
      noscriptElement.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    }

    window.gtmInitialized = true;
    console.log('GTM initialized with ID:', GTM_ID, 'on domain:', window.location.hostname);
  } catch (error) {
    console.error('Failed to initialize GTM:', error);
  }
};

// GTM helper functions
export const gtm = {
  // Track page views
  pageView: (page_path: string, page_title?: string) => {
    if (typeof window !== 'undefined' && window.dataLayer && isGTMEnabled) {
      window.dataLayer.push({
        event: 'page_view',
        page_path,
        page_title: page_title || document.title,
        page_location: window.location.href
      });
    }
  },

  // Track custom events
  event: (event_name: string, parameters: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && window.dataLayer && isGTMEnabled) {
      window.dataLayer.push({
        event: event_name,
        ...parameters
      });
    }
  },

  // Track user interactions
  trackClick: (element_name: string, page_section?: string) => {
    gtm.event('click', {
      element_name,
      page_section
    });
  },

  // Track form submissions
  trackFormSubmit: (form_name: string, success: boolean = true) => {
    gtm.event('form_submit', {
      form_name,
      success
    });
  },

  // Track user authentication events
  trackAuth: (action: 'login' | 'logout' | 'register', method?: string) => {
    gtm.event(`user_${action}`, {
      method: method || 'email'
    });
  },

  // Track e-commerce events
  trackPurchase: (transaction_id: string, value: number, currency: string = 'EUR', items?: any[]) => {
    gtm.event('purchase', {
      transaction_id,
      value,
      currency,
      items
    });
  },

  // Track interview-specific events
  trackInterview: (action: 'start' | 'complete' | 'abandon', interview_type?: string, questions_answered?: number) => {
    gtm.event(`interview_${action}`, {
      interview_type,
      questions_answered
    });
  },

  // Track subscription events
  trackSubscription: (action: 'start' | 'complete' | 'upgrade' | 'cancel', plan?: string) => {
    gtm.event(`subscription_${action}`, {
      plan
    });
  }
};

// Get current GTM ID (returns null if disabled in development)
export const getGTMId = () => isGTMEnabled ? GTM_ID : null;

// Check if GTM is properly loaded
export const isGTMLoaded = () => {
  return typeof window !== 'undefined' && 
         window.dataLayer && 
         Array.isArray(window.dataLayer) &&
         window.gtmInitialized &&
         isGTMEnabled;
};