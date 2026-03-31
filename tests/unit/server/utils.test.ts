import { describe, it, expect } from 'vitest';

describe('Server Utility Functions', () => {
  describe('String Utilities', () => {
    it('should sanitize text input', () => {
      const sanitizeText = (input: string) => {
        return input
          .trim()
          .replace(/[<>]/g, '')
          .replace(/script/gi, '')
          .substring(0, 1000);
      };

      const testCases = [
        { input: '  hello world  ', expected: 'hello world' },
        { input: '<script>alert("xss")</script>', expected: 'alert("xss")/' },
        { input: 'Normal text here', expected: 'Normal text here' },
        { input: 'a'.repeat(1500), expected: 'a'.repeat(1000) }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeText(input);
        expect(result).toBe(expected);
        expect(result.length).toBeLessThanOrEqual(1000);
      });
    });

    it('should generate slugs from text', () => {
      const generateSlug = (text: string) => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      };

      const testCases = [
        { input: 'Hello World', expected: 'hello-world' },
        { input: 'Test! Article@ Title#', expected: 'test-article-title' },
        { input: '  Multiple   Spaces  ', expected: 'multiple-spaces' },
        { input: 'Already-slugified', expected: 'already-slugified' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = generateSlug(input);
        expect(result).toBe(expected);
        expect(result).toMatch(/^[a-z0-9-]*$/);
      });
    });

    it('should truncate text with ellipsis', () => {
      const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
      };

      const testCases = [
        { text: 'Short text', length: 20, expected: 'Short text' },
        { text: 'This is a very long text that needs truncation', length: 20, expected: 'This is a very lo...' },
        { text: 'Exactly twenty chars', length: 20, expected: 'Exactly twenty chars' }
      ];

      testCases.forEach(({ text, length, expected }) => {
        const result = truncateText(text, length);
        expect(result).toBe(expected);
        expect(result.length).toBeLessThanOrEqual(length);
      });
    });
  });

  describe('Date Utilities', () => {
    it('should format relative time', () => {
      const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
      };

      const now = new Date();
      const testCases = [
        { date: new Date(now.getTime() - 30000), expected: 'just now' },
        { date: new Date(now.getTime() - 300000), expected: '5 minutes ago' },
        { date: new Date(now.getTime() - 3600000), expected: '1 hour ago' },
        { date: new Date(now.getTime() - 86400000), expected: '1 day ago' }
      ];

      testCases.forEach(({ date, expected }) => {
        const result = formatRelativeTime(date);
        expect(result).toBe(expected);
      });
    });

    it('should validate date ranges', () => {
      const isValidDateRange = (startDate: Date, endDate: Date) => {
        return startDate < endDate && 
               startDate instanceof Date && 
               endDate instanceof Date &&
               !isNaN(startDate.getTime()) &&
               !isNaN(endDate.getTime());
      };

      const validRanges = [
        { start: new Date('2025-01-01'), end: new Date('2025-01-02') },
        { start: new Date('2025-01-01T10:00:00'), end: new Date('2025-01-01T11:00:00') }
      ];

      const invalidRanges = [
        { start: new Date('2025-01-02'), end: new Date('2025-01-01') },
        { start: new Date('invalid'), end: new Date('2025-01-01') }
      ];

      validRanges.forEach(({ start, end }) => {
        expect(isValidDateRange(start, end)).toBe(true);
      });

      invalidRanges.forEach(({ start, end }) => {
        expect(isValidDateRange(start, end)).toBe(false);
      });
    });
  });

  describe('Array Utilities', () => {
    it('should chunk arrays into smaller arrays', () => {
      const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      };

      const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const chunks2 = chunkArray(testArray, 2);
      expect(chunks2).toEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]);
      
      const chunks3 = chunkArray(testArray, 3);
      expect(chunks3).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
      
      const chunksLarge = chunkArray(testArray, 20);
      expect(chunksLarge).toEqual([testArray]);
    });

    it('should deduplicate arrays', () => {
      const deduplicate = <T>(array: T[]): T[] => {
        return Array.from(new Set(array));
      };

      const testCases = [
        { input: [1, 2, 2, 3, 3, 3], expected: [1, 2, 3] },
        { input: ['a', 'b', 'a', 'c'], expected: ['a', 'b', 'c'] },
        { input: [1, 2, 3], expected: [1, 2, 3] },
        { input: [], expected: [] }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = deduplicate(input);
        expect(result).toEqual(expected);
        expect(result.length).toBeLessThanOrEqual(input.length);
      });
    });

    it('should find intersection of arrays', () => {
      const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
        return arr1.filter(item => arr2.includes(item));
      };

      const testCases = [
        { arr1: [1, 2, 3], arr2: [2, 3, 4], expected: [2, 3] },
        { arr1: ['a', 'b', 'c'], arr2: ['b', 'c', 'd'], expected: ['b', 'c'] },
        { arr1: [1, 2, 3], arr2: [4, 5, 6], expected: [] },
        { arr1: [], arr2: [1, 2, 3], expected: [] }
      ];

      testCases.forEach(({ arr1, arr2, expected }) => {
        const result = intersection(arr1, arr2);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('Object Utilities', () => {
    it('should pick specific properties from objects', () => {
      const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        const picked = {} as Pick<T, K>;
        keys.forEach(key => {
          if (key in obj) {
            picked[key] = obj[key];
          }
        });
        return picked;
      };

      const testObject = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        age: 30
      };

      const result = pick(testObject, ['id', 'name', 'email']);
      expect(result).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('age');
    });

    it('should omit specific properties from objects', () => {
      const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach(key => {
          delete result[key];
        });
        return result;
      };

      const testObject = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        createdAt: new Date()
      };

      const result = omit(testObject, ['password', 'createdAt']);
      expect(result).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('createdAt');
    });

    it('should deeply merge objects', () => {
      const deepMerge = (target: any, source: any): any => {
        if (typeof target !== 'object' || typeof source !== 'object') {
          return source;
        }
        
        const result = { ...target };
        
        Object.keys(source).forEach(key => {
          if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
        });
        
        return result;
      };

      const target = {
        a: 1,
        b: { x: 1, y: 2 },
        c: [1, 2, 3]
      };

      const source = {
        b: { y: 3, z: 4 },
        c: [4, 5, 6],
        d: 'new'
      };

      const result = deepMerge(target, source);
      expect(result).toEqual({
        a: 1,
        b: { x: 1, y: 3, z: 4 },
        c: [4, 5, 6],
        d: 'new'
      });
    });
  });

  describe('Validation Utilities', () => {
    it('should validate UUIDs', () => {
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      const validUUIDs = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '123e4567-e89b-12d3-a456-426614174000'
      ];

      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        'f47ac10b-58cc-4372-a567',
        '123e4567-e89b-12d3-a456-42661417400g'
      ];

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });

    it('should validate email addresses', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'test+tag@example.co.uk',
        'valid@subdomain.example.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'test@',
        ''
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should validate JSON strings', () => {
      const isValidJSON = (str: string): boolean => {
        try {
          JSON.parse(str);
          return true;
        } catch {
          return false;
        }
      };

      const validJSON = [
        '{"name": "John", "age": 30}',
        '[1, 2, 3]',
        '"simple string"',
        'true',
        'null',
        '42'
      ];

      const invalidJSON = [
        '{name: "John"}', // Missing quotes
        '[1, 2, 3,]', // Trailing comma
        'undefined',
        '{broken json',
        ''
      ];

      validJSON.forEach(json => {
        expect(isValidJSON(json)).toBe(true);
      });

      invalidJSON.forEach(json => {
        expect(isValidJSON(json)).toBe(false);
      });
    });
  });

  describe('Async Utilities', () => {
    it('should implement retry logic', async () => {
      const retry = async <T>(
        fn: () => Promise<T>, 
        maxAttempts: number = 3, 
        delay: number = 100
      ): Promise<T> => {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error as Error;
            if (attempt === maxAttempts) break;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        throw lastError!;
      };

      let attemptCount = 0;
      const flakyFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retry(flakyFunction, 3, 1);
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should implement timeout for promises', async () => {
      const withTimeout = <T>(
        promise: Promise<T>, 
        timeoutMs: number
      ): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]);
      };

      // Test successful completion
      const quickPromise = new Promise(resolve => 
        setTimeout(() => resolve('quick'), 50)
      );
      const result = await withTimeout(quickPromise, 100);
      expect(result).toBe('quick');

      // Test timeout
      const slowPromise = new Promise(resolve => 
        setTimeout(() => resolve('slow'), 200)
      );
      
      await expect(withTimeout(slowPromise, 100)).rejects.toThrow('Timeout');
    });
  });

  describe('Error Utilities', () => {
    it('should create standardized error responses', () => {
      const createErrorResponse = (
        message: string, 
        code: string = 'UNKNOWN_ERROR', 
        details?: any
      ) => {
        return {
          success: false,
          error: {
            message,
            code,
            timestamp: new Date().toISOString(),
            ...(details && { details })
          }
        };
      };

      const error1 = createErrorResponse('User not found', 'USER_NOT_FOUND');
      expect(error1.success).toBe(false);
      expect(error1.error.message).toBe('User not found');
      expect(error1.error.code).toBe('USER_NOT_FOUND');
      expect(error1.error.timestamp).toBeTruthy();

      const error2 = createErrorResponse('Validation failed', 'VALIDATION_ERROR', { field: 'email' });
      expect(error2.error.details).toEqual({ field: 'email' });
    });

    it('should extract error messages safely', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message;
        }
        if (typeof error === 'string') {
          return error;
        }
        if (error && typeof error === 'object' && 'message' in error) {
          return String(error.message);
        }
        return 'An unknown error occurred';
      };

      const testCases = [
        { error: new Error('Test error'), expected: 'Test error' },
        { error: 'String error', expected: 'String error' },
        { error: { message: 'Object error' }, expected: 'Object error' },
        { error: null, expected: 'An unknown error occurred' },
        { error: undefined, expected: 'An unknown error occurred' },
        { error: 42, expected: 'An unknown error occurred' }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = getErrorMessage(error);
        expect(result).toBe(expected);
      });
    });
  });
});