import { useGTMEvents } from '@/hooks/use-gtm-tracking';
import { Button } from '@/components/ui/button';

// Example component showing how to track button clicks
export function ExampleTrackedButton() {
  const { trackClick } = useGTMEvents();

  const handleClick = () => {
    // Track the click event
    trackClick('start_interview_button', 'dashboard');
    
    // Your existing button logic here
    console.log('Starting interview...');
  };

  return (
    <Button onClick={handleClick}>
      Start Interview Practice
    </Button>
  );
}

// Example component for tracking form submissions
export function ExampleTrackedForm() {
  const { trackFormSubmit } = useGTMEvents();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Your form submission logic here
      console.log('Submitting form...');
      
      // Track successful form submission
      trackFormSubmit('contact_form', true);
    } catch (error) {
      // Track failed form submission
      trackFormSubmit('contact_form', false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" />
      <Button type="submit">Submit</Button>
    </form>
  );
}

// Example component for tracking authentication events
export function ExampleAuthTracking() {
  const { trackAuth } = useGTMEvents();

  const handleLogin = () => {
    // Your login logic here
    console.log('Logging in...');
    
    // Track login event
    trackAuth('login', 'email');
  };

  const handleRegister = () => {
    // Your registration logic here
    console.log('Registering...');
    
    // Track registration event
    trackAuth('register', 'email');
  };

  return (
    <div>
      <Button onClick={handleLogin}>Login</Button>
      <Button onClick={handleRegister}>Register</Button>
    </div>
  );
}

// Example component for tracking interview events
export function ExampleInterviewTracking() {
  const { trackInterview } = useGTMEvents();

  const handleStartInterview = () => {
    // Track interview start
    trackInterview('start', 'competency_based');
  };

  const handleCompleteInterview = (questionsAnswered: number) => {
    // Track interview completion
    trackInterview('complete', 'competency_based', questionsAnswered);
  };

  const handleAbandonInterview = (questionsAnswered: number) => {
    // Track interview abandonment
    trackInterview('abandon', 'competency_based', questionsAnswered);
  };

  return (
    <div>
      <Button onClick={handleStartInterview}>Start Interview</Button>
      <Button onClick={() => handleCompleteInterview(10)}>Complete Interview</Button>
      <Button onClick={() => handleAbandonInterview(5)}>Abandon Interview</Button>
    </div>
  );
}

// Example component for tracking purchases
export function ExamplePurchaseTracking() {
  const { trackPurchase, trackSubscription } = useGTMEvents();

  const handlePurchase = () => {
    // Track purchase event
    trackPurchase('txn_123456', 49.00, 'EUR', [
      {
        item_id: 'starter_package',
        item_name: 'Interview Confidence Starter',
        category: 'subscription',
        quantity: 1,
        price: 49.00
      }
    ]);

    // Also track subscription start
    trackSubscription('start', 'starter');
  };

  return (
    <Button onClick={handlePurchase}>Purchase Starter Package</Button>
  );
}

// Example component for tracking custom events
export function ExampleCustomTracking() {
  const { trackCustomEvent } = useGTMEvents();

  const handleCustomEvent = () => {
    // Track any custom event
    trackCustomEvent('cv_upload', {
      file_type: 'pdf',
      file_size: '2.5MB',
      analysis_type: 'competency'
    });
  };

  return (
    <Button onClick={handleCustomEvent}>Upload CV for Analysis</Button>
  );
}