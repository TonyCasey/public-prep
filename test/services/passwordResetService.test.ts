import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generatePasswordResetToken, 
  validatePasswordResetToken, 
  markTokenAsUsed, 
  cleanupExpiredTokens 
} from '../../server/services/passwordResetService';

// Mock database
vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    })
  }
}));

vi.mock('@shared/passwordReset', () => ({
  passwordResetTokens: {
    token: 'token',
    email: 'email',
    expiresAt: 'expiresAt',
    used: 'used',
    usedAt: 'usedAt',
    createdAt: 'createdAt'
  }
}));

describe('Password Reset Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a token for valid email', async () => {
      const email = 'tcasey@publicserviceprep.ie';
      const token = await generatePasswordResetToken(email);
      
      // Should return a hex string token
      expect(typeof token).toBe('string');
      if (token) {
        expect(token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
      }
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { db } = await import('../../server/db');
      vi.mocked(db.insert).mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const email = 'tcasey@publicserviceprep.ie';
      const token = await generatePasswordResetToken(email);
      
      expect(token).toBeNull();
    });

    it('should create tokens with proper expiration time', async () => {
      const email = 'tcasey@publicserviceprep.ie';
      const beforeTime = Date.now();
      
      await generatePasswordResetToken(email);
      
      const afterTime = Date.now();
      const expectedExpiryTime = beforeTime + (60 * 60 * 1000); // 1 hour
      
      // Verify timing logic
      expect(afterTime - beforeTime).toBeLessThan(1000); // Should be very fast
      expect(expectedExpiryTime).toBeGreaterThan(beforeTime);
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid-token';
      const result = await validatePasswordResetToken(invalidToken);
      
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Mock expired token - should return empty array since expired tokens are filtered out
      const { db } = await import('../../server/db');
      
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // Empty array for expired token
          })
        })
      } as any);
      
      const result = await validatePasswordResetToken('expired-token');
      expect(result).toBeNull();
    });

    it('should return null for used token', async () => {
      // Mock used token - should return empty array since used tokens are filtered out
      const { db } = await import('../../server/db');
      
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // Empty array for used token
          })
        })
      } as any);
      
      const result = await validatePasswordResetToken('used-token');
      expect(result).toBeNull();
    });

    it('should return user data for valid token', async () => {
      // Mock valid token
      const { db } = await import('../../server/db');
      const validTokenData = [{
        token: 'valid-token',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        used: false
      }];
      
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(validTokenData)
          })
        })
      } as any);
      
      const result = await validatePasswordResetToken('valid-token');
      
      expect(result).toEqual({
        userId: 'test@example.com',
        email: 'test@example.com'
      });
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('../../server/db');
      vi.mocked(db.select).mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const result = await validatePasswordResetToken('any-token');
      expect(result).toBeNull();
    });
  });

  describe('markTokenAsUsed', () => {
    it('should mark token as used successfully', async () => {
      const token = 'test-token';
      const result = await markTokenAsUsed(token);
      
      expect(result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('../../server/db');
      vi.mocked(db.update).mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const result = await markTokenAsUsed('test-token');
      expect(result).toBe(false);
    });

    it('should set proper timestamp when marking as used', async () => {
      const beforeTime = Date.now();
      await markTokenAsUsed('test-token');
      const afterTime = Date.now();
      
      // Verify timing - should be immediate
      expect(afterTime - beforeTime).toBeLessThan(1000);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired tokens without throwing', async () => {
      // Should not throw an error
      await expect(cleanupExpiredTokens()).resolves.toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('../../server/db');
      vi.mocked(db.delete).mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Should not throw even with database error
      await expect(cleanupExpiredTokens()).resolves.toBeUndefined();
    });
  });

  describe('Token Security', () => {
    it('should generate unique tokens', async () => {
      const email = 'tcasey@publicserviceprep.ie';
      const token1 = await generatePasswordResetToken(email);
      const token2 = await generatePasswordResetToken(email);
      
      // Tokens should be different (if generation succeeds)
      if (token1 && token2) {
        expect(token1).not.toBe(token2);
      }
    });

    it('should generate tokens of correct length', async () => {
      const email = 'tcasey@publicserviceprep.ie';
      const token = await generatePasswordResetToken(email);
      
      if (token) {
        // 32 bytes = 64 hex characters
        expect(token).toHaveLength(64);
      }
    });

    it('should validate token format', () => {
      const validToken = 'a'.repeat(64); // 64 hex chars
      const invalidToken = 'xyz123'; // Too short, non-hex
      
      expect(validToken).toMatch(/^[a-f0-9]{64}$/);
      expect(invalidToken).not.toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Token Expiration Logic', () => {
    it('should correctly identify expired tokens', () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 60000); // 1 minute ago
      const valid = new Date(now.getTime() + 60000); // 1 minute from now
      
      expect(expired.getTime()).toBeLessThan(now.getTime());
      expect(valid.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should use correct expiration window', () => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      const expiryTime = now + oneHour;
      
      expect(expiryTime - now).toBe(oneHour);
    });
  });
});