import { Switch, Route } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// Toaster removed - toast system disabled to prevent modal interference
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
// Removed PaymentModalProvider - using event-based system instead
import { ProtectedRoute } from "@/lib/protected-route";
import { useCRMTracking } from "@/hooks/use-tracking";
import { useGTMTracking } from "@/hooks/use-gtm-tracking";
import { initializeGTM } from "@/lib/gtm";
import NotFound from "@/pages/not-found";

// Lazy load components for better initial bundle size
const Home = lazy(() => import("@/pages/home"));
const About = lazy(() => import("@/pages/about"));
const SocialPreview = lazy(() => import("@/pages/social-preview"));
const AuthPage = lazy(() => import("@/pages/Auth"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsConditions = lazy(() => import("@/pages/terms-conditions"));
const Contact = lazy(() => import("@/pages/contact"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const PaymentSuccess = lazy(() => import("@/pages/payment-success"));
const DashboardPage = lazy(() => import("@/pages/app/dashboard"));
const InterviewPageApp = lazy(() => import("@/pages/interview"));
const InterviewRedesignedPage = lazy(() => import("@/pages/interview-redesigned"));
import InterviewRedesignedTestPage from "@/pages/interview-redesigned-test";
import TestRoutePage from "@/pages/test-route";
const MobileDebug = lazy(() => import("@/pages/mobile-debug"));
const ProfessionalDemo = lazy(() => import("@/pages/professional-demo"));

// Loading fallback component
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function Router() {
  // Initialize GTM on app start
  useEffect(() => {
    initializeGTM();
  }, []);

  // Enable automatic CRM page view tracking
  useCRMTracking();
  
  // Enable automatic GTM page view tracking
  useGTMTracking();
  
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/social-preview" component={SocialPreview} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsConditions} />
        <Route path="/contact" component={Contact} />
        
        {/* Protected app routes */}
        <Route path="/app">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/interview/:interviewId/:questionId?">
          <ProtectedRoute>
            <InterviewPageApp />
          </ProtectedRoute>
        </Route>
        <Route path="/app/interview-redesigned/:interviewId/:questionId?">
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <InterviewRedesignedPage />
            </Suspense>
          </ProtectedRoute>
        </Route>
        <Route path="/app/interview-redesigned-test/:interviewId">
          <ProtectedRoute>
            <InterviewRedesignedTestPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/test">
          <ProtectedRoute>
            <TestRoutePage />
          </ProtectedRoute>
        </Route>
        <Route path="/test-public" component={TestRoutePage} />
        <Route path="/mobile-debug" component={MobileDebug} />
        <Route path="/professional-demo" component={ProfessionalDemo} />
        
        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {/* Toaster removed - toast system disabled */}
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
