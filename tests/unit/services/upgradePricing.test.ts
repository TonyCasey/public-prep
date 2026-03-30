import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock subscription pricing logic
interface SubscriptionStatus {
  subscriptionStatus: 'free' | 'starter' | 'premium';
  starterInterviewsUsed?: number;
}

interface PriceInfo {
  price: number;
  label: string;
  description: string;
}

// Function to test pricing logic (mirroring frontend)
function getPremiumPrice(subscription?: SubscriptionStatus): PriceInfo {
  if (subscription?.subscriptionStatus === 'starter') {
    return { 
      price: 100, 
      label: 'Upgrade for €100', 
      description: 'Upgrade from Starter • Lifetime access' 
    };
  }
  return { 
    price: 149, 
    label: 'Get Lifetime Access - €149', 
    description: 'One-time payment • Lifetime access' 
  };
}

// Function to check interview limits
function checkInterviewLimit(subscription?: SubscriptionStatus): { allowed: boolean; message?: string } {
  if (subscription?.subscriptionStatus === 'starter') {
    const used = subscription.starterInterviewsUsed || 0;
    if (used >= 1) {
      return {
        allowed: false,
        message: "You've used your 1 practice interview in the starter package. Upgrade to premium for unlimited access and advanced features."
      };
    }
  }
  return { allowed: true };
}

describe('Upgrade Pricing Logic', () => {
  describe('getPremiumPrice', () => {
    it('should return full price for free users', () => {
      const result = getPremiumPrice({ subscriptionStatus: 'free' });
      
      expect(result.price).toBe(149);
      expect(result.label).toBe('Get Lifetime Access - €149');
      expect(result.description).toBe('One-time payment • Lifetime access');
    });

    it('should return upgrade price for starter users', () => {
      const result = getPremiumPrice({ subscriptionStatus: 'starter' });
      
      expect(result.price).toBe(100);
      expect(result.label).toBe('Upgrade for €100');
      expect(result.description).toBe('Upgrade from Starter • Lifetime access');
    });

    it('should return full price for premium users', () => {
      const result = getPremiumPrice({ subscriptionStatus: 'premium' });
      
      expect(result.price).toBe(149);
      expect(result.label).toBe('Get Lifetime Access - €149');
      expect(result.description).toBe('One-time payment • Lifetime access');
    });

    it('should handle undefined subscription', () => {
      const result = getPremiumPrice(undefined);
      
      expect(result.price).toBe(149);
      expect(result.label).toBe('Get Lifetime Access - €149');
    });
  });

  describe('checkInterviewLimit', () => {
    it('should allow free users to create interviews', () => {
      const result = checkInterviewLimit({ subscriptionStatus: 'free' });
      
      expect(result.allowed).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should allow starter users with 0 interviews used', () => {
      const result = checkInterviewLimit({ 
        subscriptionStatus: 'starter', 
        starterInterviewsUsed: 0 
      });
      
      expect(result.allowed).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should block starter users who have used 1 interview', () => {
      const result = checkInterviewLimit({ 
        subscriptionStatus: 'starter', 
        starterInterviewsUsed: 1 
      });
      
      expect(result.allowed).toBe(false);
      expect(result.message).toBe(
        "You've used your 1 practice interview in the starter package. Upgrade to premium for unlimited access and advanced features."
      );
    });

    it('should allow premium users unlimited interviews', () => {
      const result = checkInterviewLimit({ 
        subscriptionStatus: 'premium',
        starterInterviewsUsed: 10 // This should be ignored
      });
      
      expect(result.allowed).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should handle starter users with undefined starterInterviewsUsed', () => {
      const result = checkInterviewLimit({ subscriptionStatus: 'starter' });
      
      expect(result.allowed).toBe(true); // 0 interviews used
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription status changes correctly', () => {
      // User starts as free
      let subscription: SubscriptionStatus = { subscriptionStatus: 'free' };
      expect(getPremiumPrice(subscription).price).toBe(149);
      expect(checkInterviewLimit(subscription).allowed).toBe(true);

      // User buys starter
      subscription = { subscriptionStatus: 'starter', starterInterviewsUsed: 0 };
      expect(getPremiumPrice(subscription).price).toBe(100); // Upgrade price
      expect(checkInterviewLimit(subscription).allowed).toBe(true);

      // User uses their 1 interview
      subscription.starterInterviewsUsed = 1;
      expect(checkInterviewLimit(subscription).allowed).toBe(false);
      expect(getPremiumPrice(subscription).price).toBe(100); // Still upgrade price

      // User upgrades to premium
      subscription = { subscriptionStatus: 'premium' };
      expect(checkInterviewLimit(subscription).allowed).toBe(true);
      expect(getPremiumPrice(subscription).price).toBe(149); // Full price (not relevant)
    });
  });
});

describe('Subscription Analytics', () => {
  it('should calculate correct usage percentage for starter users', () => {
    const subscription = { 
      subscriptionStatus: 'starter' as const, 
      starterInterviewsUsed: 1 
    };
    
    const usagePercentage = ((subscription.starterInterviewsUsed || 0) / 1) * 100;
    expect(usagePercentage).toBe(100);
  });

  it('should calculate correct usage display', () => {
    const subscription = { 
      subscriptionStatus: 'starter' as const, 
      starterInterviewsUsed: 0 
    };
    
    const usageDisplay = `${subscription.starterInterviewsUsed || 0}/1`;
    expect(usageDisplay).toBe('0/1');
  });
});