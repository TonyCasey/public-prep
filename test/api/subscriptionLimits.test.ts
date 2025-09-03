import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock database storage for testing
interface User {
  id: string;
  email: string;
  subscriptionStatus: 'free' | 'starter' | 'premium';
  starterInterviewsUsed?: number;
  starterExpiresAt?: string;
}

interface Session {
  id: string;
  userId: string;
  jobTitle: string;
  grade: string;
}

// Mock storage implementation for testing
class MockStorage {
  private users = new Map<string, User>();
  private sessions = new Map<string, Session>();

  setUser(user: User) {
    this.users.set(user.id, user);
  }

  async getUserSubscription(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;
    
    return {
      subscriptionStatus: user.subscriptionStatus,
      starterInterviewsUsed: user.starterInterviewsUsed || 0,
      starterExpiresAt: user.starterExpiresAt
    };
  }

  async createSession(session: Session): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(session.userId);
    if (!user) return { success: false, error: 'User not found' };

    // Check subscription limits
    if (user.subscriptionStatus === 'starter') {
      const used = user.starterInterviewsUsed || 0;
      if (used >= 1) {
        return { 
          success: false, 
          error: "You've used your 1 practice interview in the starter package. Upgrade to premium for unlimited access and advanced features."
        };
      }
      
      // Increment usage
      user.starterInterviewsUsed = used + 1;
    }

    this.sessions.set(session.id, session);
    return { success: true };
  }

  clear() {
    this.users.clear();
    this.sessions.clear();
  }
}

describe('Subscription Limits API', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe('Free User Limits', () => {
    it('should allow free users to create interviews', async () => {
      storage.setUser({
        id: 'user1',
        email: 'free@example.com',
        subscriptionStatus: 'free'
      });

      const result = await storage.createSession({
        id: 'session1',
        userId: 'user1',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Starter User Limits', () => {
    it('should allow starter users to create their first interview', async () => {
      storage.setUser({
        id: 'user2',
        email: 'starter@example.com',
        subscriptionStatus: 'starter',
        starterInterviewsUsed: 0
      });

      const result = await storage.createSession({
        id: 'session2',
        userId: 'user2',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should block starter users from creating a second interview', async () => {
      storage.setUser({
        id: 'user3',
        email: 'starter@example.com',
        subscriptionStatus: 'starter',
        starterInterviewsUsed: 1
      });

      const result = await storage.createSession({
        id: 'session3',
        userId: 'user3',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "You've used your 1 practice interview in the starter package. Upgrade to premium for unlimited access and advanced features."
      );
    });

    it('should increment usage count after successful interview creation', async () => {
      const user = {
        id: 'user4',
        email: 'starter@example.com',
        subscriptionStatus: 'starter' as const,
        starterInterviewsUsed: 0
      };
      storage.setUser(user);

      // First interview should succeed
      const result1 = await storage.createSession({
        id: 'session4a',
        userId: 'user4',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result1.success).toBe(true);
      expect(user.starterInterviewsUsed).toBe(1);

      // Second interview should fail
      const result2 = await storage.createSession({
        id: 'session4b',
        userId: 'user4',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result2.success).toBe(false);
      expect(result2.error).toContain("You've used your 1 practice interview");
    });
  });

  describe('Premium User Limits', () => {
    it('should allow premium users unlimited interviews', async () => {
      storage.setUser({
        id: 'user5',
        email: 'premium@example.com',
        subscriptionStatus: 'premium'
      });

      // Create multiple sessions
      for (let i = 0; i < 10; i++) {
        const result = await storage.createSession({
          id: `session5-${i}`,
          userId: 'user5',
          jobTitle: 'HEO',
          grade: 'heo'
        });

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });
  });

  describe('Subscription Status Validation', () => {
    it('should handle users with undefined starterInterviewsUsed', async () => {
      storage.setUser({
        id: 'user6',
        email: 'starter@example.com',
        subscriptionStatus: 'starter'
        // starterInterviewsUsed is undefined
      });

      const result = await storage.createSession({
        id: 'session6',
        userId: 'user6',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result.success).toBe(true); // Should treat as 0 interviews used
    });

    it('should return correct subscription info', async () => {
      storage.setUser({
        id: 'user7',
        email: 'test@example.com',
        subscriptionStatus: 'starter',
        starterInterviewsUsed: 1,
        starterExpiresAt: '2024-08-01T00:00:00Z'
      });

      const subscription = await storage.getUserSubscription('user7');
      
      expect(subscription).toEqual({
        subscriptionStatus: 'starter',
        starterInterviewsUsed: 1,
        starterExpiresAt: '2024-08-01T00:00:00Z'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent users', async () => {
      const result = await storage.createSession({
        id: 'session-fail',
        userId: 'nonexistent',
        jobTitle: 'HEO',
        grade: 'heo'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return null for non-existent user subscription', async () => {
      const subscription = await storage.getUserSubscription('nonexistent');
      expect(subscription).toBeNull();
    });
  });
});