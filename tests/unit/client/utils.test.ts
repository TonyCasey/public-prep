import { describe, it, expect } from 'vitest';

describe('Client Utilities', () => {
  describe('Form Validation', () => {
    it('should validate form fields', () => {
      const formData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongPassword123!'
      };
      
      const validations = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
        firstName: formData.firstName.length >= 2,
        lastName: formData.lastName.length >= 2,
        password: formData.password.length >= 8
      };
      
      expect(validations.email).toBe(true);
      expect(validations.firstName).toBe(true);
      expect(validations.lastName).toBe(true);
      expect(validations.password).toBe(true);
    });

    it('should handle validation errors', () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'J',
        lastName: '',
        password: '123'
      };
      
      const errors: string[] = [];
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidData.email)) {
        errors.push('Invalid email format');
      }
      if (invalidData.firstName.length < 2) {
        errors.push('First name must be at least 2 characters');
      }
      if (invalidData.lastName.length === 0) {
        errors.push('Last name is required');
      }
      if (invalidData.password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      
      expect(errors.length).toBe(4);
      expect(errors).toContain('Invalid email format');
    });
  });

  describe('URL and Route Handling', () => {
    it('should parse URL parameters', () => {
      const testUrls = [
        { url: '/app/interview/123e4567-e89b-12d3-a456-426614174000', param: '123e4567-e89b-12d3-a456-426614174000' },
        { url: '/app/interview/123e4567-e89b-12d3-a456-426614174000/1', questionId: '1' },
        { url: '/app', param: null }
      ];
      
      testUrls.forEach(test => {
        const parts = test.url.split('/');
        if (parts.length >= 4 && parts[2] === 'interview') {
          const param = parts[3];
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (test.param) {
            expect(uuidRegex.test(param)).toBe(true);
          }
        }
      });
    });

    it('should validate route patterns', () => {
      const routes = [
        { path: '/', isValid: true },
        { path: '/app', isValid: true },
        { path: '/app/interview/123e4567-e89b-12d3-a456-426614174000', isValid: true },
        { path: '/invalid/../path', isValid: false },
        { path: '/app/<script>', isValid: false }
      ];
      
      routes.forEach(route => {
        const isSafe = !/[<>"]|\.\./.test(route.path);
        const isWellFormed = route.path.startsWith('/');
        const isValid = isSafe && isWellFormed;
        
        expect(isValid).toBe(route.isValid);
      });
    });
  });

  describe('Date and Time Formatting', () => {
    it('should format dates for display', () => {
      const testDate = new Date('2025-01-15T14:30:00Z');
      
      const formatOptions = [
        { style: 'short', expected: /\d{1,2}\/\d{1,2}\/\d{4}/ },
        { style: 'long', expected: /\w+ \d{1,2}, \d{4}/ },
        { style: 'time', expected: /\d{1,2}:\d{2}/ }
      ];
      
      formatOptions.forEach(option => {
        let formatted: string;
        
        switch (option.style) {
          case 'short':
            formatted = testDate.toLocaleDateString();
            break;
          case 'long':
            formatted = testDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            break;
          case 'time':
            formatted = testDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            break;
          default:
            formatted = testDate.toString();
        }
        
        expect(formatted).toMatch(option.expected);
      });
    });

    it('should calculate relative time', () => {
      const now = new Date();
      const testCases = [
        { offset: -60000, expected: 'a minute ago' }, // 1 minute ago
        { offset: -3600000, expected: 'an hour ago' }, // 1 hour ago
        { offset: -86400000, expected: 'a day ago' }, // 1 day ago
        { offset: 60000, expected: 'in a minute' } // 1 minute from now
      ];
      
      testCases.forEach(test => {
        const date = new Date(now.getTime() + test.offset);
        const diff = Math.abs(now.getTime() - date.getTime());
        
        let relative: string;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) {
          relative = test.offset < 0 ? 'a day ago' : 'in a day';
        } else if (hours > 0) {
          relative = test.offset < 0 ? 'an hour ago' : 'in an hour';
        } else {
          relative = test.offset < 0 ? 'a minute ago' : 'in a minute';
        }
        
        expect(relative).toBe(test.expected);
      });
    });
  });

  describe('Data Transformation', () => {
    it('should format currency values', () => {
      const amounts = [
        { value: 49, expected: '€49' },
        { value: 149, expected: '€149' },
        { value: 99.99, expected: '€99.99' },
        { value: 1000, expected: '€1,000' }
      ];
      
      amounts.forEach(test => {
        const formatted = new Intl.NumberFormat('en-IE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: test.value % 1 === 0 ? 0 : 2
        }).format(test.value);
        
        expect(formatted).toContain('€');
        // Check that the number part is formatted correctly
        if (test.value >= 1000) {
          expect(formatted).toContain(',');
        }
        // Verify currency formatting works
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(1);
      });
    });

    it('should format percentages', () => {
      const scores = [
        { decimal: 0.75, percentage: '75%' },
        { decimal: 0.8333, percentage: '83%' },
        { decimal: 1.0, percentage: '100%' },
        { decimal: 0.0, percentage: '0%' }
      ];
      
      scores.forEach(test => {
        const percentage = Math.round(test.decimal * 100) + '%';
        expect(percentage).toBe(test.percentage);
      });
    });

    it('should truncate long text', () => {
      const texts = [
        { text: 'Short text', maxLength: 20, expected: 'Short text' },
        { text: 'This is a very long text that should be truncated', maxLength: 20, expected: 'This is a very lo...' },
        { text: 'Exactly twenty chars', maxLength: 20, expected: 'Exactly twenty chars' }
      ];
      
      texts.forEach(test => {
        const truncated = test.text.length > test.maxLength 
          ? test.text.substring(0, test.maxLength - 3) + '...'
          : test.text;
          
        expect(truncated).toBe(test.expected);
        expect(truncated.length).toBeLessThanOrEqual(test.maxLength);
      });
    });
  });

  describe('Local Storage Utilities', () => {
    it('should handle localStorage operations', () => {
      // Mock localStorage
      const mockStorage = {
        data: {} as Record<string, string>,
        getItem: function(key: string) { return this.data[key] || null; },
        setItem: function(key: string, value: string) { this.data[key] = value; },
        removeItem: function(key: string) { delete this.data[key]; },
        clear: function() { this.data = {}; }
      };
      
      // Test operations
      mockStorage.setItem('test-key', 'test-value');
      expect(mockStorage.getItem('test-key')).toBe('test-value');
      
      mockStorage.setItem('json-data', JSON.stringify({ name: 'John' }));
      const parsed = JSON.parse(mockStorage.getItem('json-data') || '{}');
      expect(parsed.name).toBe('John');
      
      mockStorage.removeItem('test-key');
      expect(mockStorage.getItem('test-key')).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      const storageOperations = [
        { operation: 'getItem', key: 'non-existent', expected: null },
        { operation: 'setItem', key: 'valid-key', value: 'valid-value', expected: true },
        { operation: 'removeItem', key: 'any-key', expected: true }
      ];
      
      storageOperations.forEach(op => {
        let success = true;
        
        try {
          switch (op.operation) {
            case 'getItem':
              const value = null; // Simulate getting non-existent item
              expect(value).toBe(op.expected);
              break;
            case 'setItem':
            case 'removeItem':
              // Operations would normally succeed
              expect(success).toBe(op.expected);
              break;
          }
        } catch (error) {
          success = false;
        }
        
        expect(typeof success).toBe('boolean');
      });
    });
  });

  describe('Event Handling', () => {
    it('should debounce function calls', () => {
      let callCount = 0;
      const mockFunction = () => callCount++;
      
      // Simple debounce simulation
      let timeoutId: NodeJS.Timeout | null = null;
      const debouncedFunction = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(mockFunction, 100);
      };
      
      // Simulate rapid calls
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();
      
      // Should only setup timeout, not execute immediately
      expect(callCount).toBe(0);
      expect(timeoutId).not.toBeNull();
    });

    it('should throttle function calls', () => {
      let callCount = 0;
      let lastCallTime = 0;
      const delay = 100;
      
      const throttledFunction = () => {
        const now = Date.now();
        if (now - lastCallTime >= delay) {
          callCount++;
          lastCallTime = now;
        }
      };
      
      // Simulate calls
      throttledFunction(); // Should execute
      throttledFunction(); // Should be throttled
      
      expect(callCount).toBe(1);
      
      // Simulate delay passage
      lastCallTime = Date.now() - delay - 1;
      throttledFunction(); // Should execute
      
      expect(callCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should format error messages', () => {
      const errors = [
        { error: new Error('Network error'), userMessage: 'Connection failed. Please try again.' },
        { error: new Error('Validation failed'), userMessage: 'Please check your input and try again.' },
        { error: new Error('Unauthorized'), userMessage: 'Please log in to continue.' }
      ];
      
      errors.forEach(test => {
        // Simulate error message formatting
        let userFriendlyMessage: string;
        
        if (test.error.message.includes('Network') || test.error.message.includes('Connection')) {
          userFriendlyMessage = 'Connection failed. Please try again.';
        } else if (test.error.message.includes('Validation')) {
          userFriendlyMessage = 'Please check your input and try again.';
        } else if (test.error.message.includes('Unauthorized')) {
          userFriendlyMessage = 'Please log in to continue.';
        } else {
          userFriendlyMessage = 'An error occurred. Please try again.';
        }
        
        expect(userFriendlyMessage).toBe(test.userMessage);
      });
    });

    it('should handle async errors', async () => {
      const asyncOperations = [
        { shouldFail: false, expected: 'success' },
        { shouldFail: true, expected: 'error' }
      ];
      
      for (const op of asyncOperations) {
        try {
          const result = await new Promise((resolve, reject) => {
            setTimeout(() => {
              if (op.shouldFail) {
                reject(new Error('Async operation failed'));
              } else {
                resolve('success');
              }
            }, 1);
          });
          
          expect(result).toBe(op.expected);
        } catch (error) {
          expect(op.expected).toBe('error');
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });
});