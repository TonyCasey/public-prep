import { useMemo, useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useSubscriptionRefresh } from "@/hooks/use-subscription-refresh";
import { CheckCircle, Zap, Star, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscriptionRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForceRefresh, setShowForceRefresh] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('🎉 PaymentSuccess page loaded successfully!');
    console.log('User data:', { user, subscriptionStatus: user?.subscriptionStatus });
    console.log('Current URL:', window.location.href);
    console.log('URL Search Params:', window.location.search);
  }, [user]);
  
  // Refresh subscription data when payment success page loads
  useEffect(() => {
    console.log('Refreshing subscription data...');
    // Refresh subscription after payment with a slight delay to allow webhook processing
    const refreshTimer = setTimeout(() => {
      refreshSubscription();
    }, 2000);

    // Retry refresh every 3 seconds if still processing, up to 10 attempts
    let retryCount = 0;
    const maxRetries = 10;
    
    const retryInterval = setInterval(() => {
      if (user?.subscriptionStatus && user.subscriptionStatus !== 'free' && user.subscriptionStatus !== undefined) {
        clearInterval(retryInterval);
        return;
      }
      
      if (retryCount < maxRetries) {
        console.log(`Retry ${retryCount + 1}/${maxRetries}: Refreshing subscription data...`);
        refreshSubscription();
        retryCount++;
      } else {
        console.log('Max retries reached, stopping refresh attempts');
        clearInterval(retryInterval);
      }
    }, 3000);

    // Show force refresh button after 15 seconds if still processing
    const forceRefreshTimer = setTimeout(() => {
      if (!user?.subscriptionStatus || user.subscriptionStatus === 'free') {
        setShowForceRefresh(true);
      }
    }, 15000);

    return () => {
      clearTimeout(refreshTimer);
      clearInterval(retryInterval);
      clearTimeout(forceRefreshTimer);
    };
  }, [refreshSubscription, user?.subscriptionStatus]);

  // LinkedIn conversion tracking
  useEffect(() => {
    // LinkedIn Partner ID
    (window as any)._linkedin_partner_id = "7548818";
    (window as any)._linkedin_data_partner_ids = (window as any)._linkedin_data_partner_ids || [];
    (window as any)._linkedin_data_partner_ids.push("7548818");

    // LinkedIn Insight Tag
    if (!(window as any).lintrk) {
      (window as any).lintrk = function(a: any, b: any) {
        (window as any).lintrk.q.push([a, b]);
      };
      (window as any).lintrk.q = [];
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Fallback noscript tracking pixel
    const noscriptImg = document.createElement('img');
    noscriptImg.height = 1;
    noscriptImg.width = 1;
    noscriptImg.style.display = 'none';
    noscriptImg.alt = '';
    noscriptImg.src = 'https://px.ads.linkedin.com/collect/?pid=7548818&fmt=gif';
    document.body.appendChild(noscriptImg);

    console.log('LinkedIn conversion tracking initialized');
  }, []);
  
  // Use user session data instead of separate subscription query
  const subscription = user;

  const handleGoToDashboard = () => {
    navigate("/app");
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscription();
      // Force a page reload as last resort
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Force refresh failed:', error);
      // Just reload the page
      window.location.reload();
    }
  };

  // Determine plan details based on subscription status
  const planDetails = useMemo(() => {
    console.log('🎯 Payment success page subscription check:', {
      subscriptionStatus: subscription?.subscriptionStatus,
      user: subscription
    });
    
    if (subscription?.subscriptionStatus === 'starter') {
      return {
        name: 'Interview Confidence Starter',
        price: '€49.00',
        badge: 'Starter Active',
        description: 'Perfect for your upcoming interview preparation',
        features: [
          '1 Full Practice Interview Session',
          'CV Analysis with AI Feedback',
          'STAR Method Coaching & Scoring',
          'All 6 Competency Areas Coverage',
          '30 Days Access Period'
        ],
        gridItems: [
          { title: '1 Interview', subtitle: '€49.00 paid' },
          { title: '30 Days Access', subtitle: 'Perfect preparation' },
          { title: 'AI Coaching', subtitle: 'Expert feedback' }
        ]
      };
    } else if (subscription?.subscriptionStatus === 'premium') {
      return {
        name: 'Lifetime Premium Access',
        price: '€149.00',
        badge: 'Premium Active',
        description: 'Unlimited access to master your interview skills',
        features: [
          'Unlimited AI-powered interview practice sessions',
          'Expert STAR method analysis and scoring',
          'CV analysis with competency matching',
          'Performance tracking across all competencies',
          'Export interview reports and progress analytics'
        ],
        gridItems: [
          { title: 'Lifetime Access', subtitle: 'Premium upgrade' },
          { title: 'Unlimited Practice', subtitle: 'All competencies' },
          { title: 'AI Coaching', subtitle: 'Expert feedback' }
        ]
      };
    } else {
      return {
        name: 'Processing Payment',
        price: 'Processing...',
        badge: 'Processing...',
        description: 'Your payment is being processed',
        features: ['Payment confirmation in progress'],
        gridItems: [
          { title: 'Processing', subtitle: 'Please wait...' },
          { title: 'Almost Ready', subtitle: 'Few seconds' },
          { title: 'Thank You', subtitle: 'For your patience' }
        ]
      };
    }
  }, [subscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Star className="w-4 h-4 text-yellow-800" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Payment Successful!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            {subscription?.subscriptionStatus === 'premium' ? (
              <>Congratulations on upgrading to <span className="font-semibold text-purple-600">{planDetails.name}</span>! {planDetails.description}</>
            ) : (
              <>Welcome to <span className="font-semibold text-purple-600">{planDetails.name}</span>! {planDetails.description}</>
            )}
          </p>

          {/* Subscription Status */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                {planDetails.badge}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {planDetails.gridItems.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="font-semibold text-purple-700">{item.title}</div>
                  <div className="text-gray-600">{item.subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What's Next */}
          <div className="text-left mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's included in your plan:</h3>
            <ul className="space-y-3">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleGoToDashboard}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg"
              disabled={planDetails.name === 'Processing Payment'}
            >
              Start Practicing Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {showForceRefresh && planDetails.name === 'Processing Payment' && (
              <Button 
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="h-12 border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Force Refresh
              </Button>
            )}
          </div>



          {/* Email confirmation notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              📧 A payment confirmation email has been sent to <strong>{user?.email}</strong>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{" "}
            <a href="mailto:support@publicprep.ie" className="text-purple-600 hover:underline">
              support@publicprep.ie
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}