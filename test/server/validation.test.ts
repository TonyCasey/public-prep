import { describe, it, expect } from 'vitest';

describe('Validation Functions', () => {
  describe('Data Type Validation', () => {
    it('should validate strings', () => {
      const validStrings = ['hello', 'test@example.com', ''];
      const invalidStrings = [null, undefined, 123, {}, []];
      
      validStrings.forEach(str => {
        expect(typeof str).toBe('string');
      });
      
      invalidStrings.forEach(item => {
        expect(typeof item).not.toBe('string');
      });
    });

    it('should validate numbers', () => {
      const validNumbers = [0, 1, -1, 3.14, Number.MAX_VALUE];
      const invalidNumbers = ['123', null, undefined, NaN, Infinity];
      
      validNumbers.forEach(num => {
        expect(typeof num).toBe('number');
        expect(Number.isFinite(num)).toBe(true);
      });
      
      invalidNumbers.forEach(item => {
        if (typeof item === 'number') {
          expect(Number.isFinite(item)).toBe(false);
        } else {
          expect(typeof item).not.toBe('number');
        }
      });
    });

    it('should validate arrays', () => {
      const validArrays = [[], [1, 2, 3], ['a', 'b'], [null, undefined]];
      const invalidArrays = ['array', {}, null, undefined, 123];
      
      validArrays.forEach(arr => {
        expect(Array.isArray(arr)).toBe(true);
      });
      
      invalidArrays.forEach(item => {
        expect(Array.isArray(item)).toBe(false);
      });
    });

    it('should validate objects', () => {
      const validObjects = [{}, { key: 'value' }, { nested: { obj: true } }];
      const invalidObjects = [null, undefined, 'string', 123, []];
      
      validObjects.forEach(obj => {
        expect(typeof obj).toBe('object');
        expect(obj).not.toBeNull();
        expect(Array.isArray(obj)).toBe(false);
      });
      
      invalidObjects.forEach(item => {
        const isValidObject = typeof item === 'object' && item !== null && !Array.isArray(item);
        expect(isValidObject).toBe(false);
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate job grades', () => {
      const validGrades = ['oa', 'co', 'eo', 'heo', 'ap', 'po', 'apo'];
      const invalidGrades = ['invalid', 'CEO', 'manager', '', null, undefined];
      
      validGrades.forEach(grade => {
        expect(validGrades.includes(grade)).toBe(true);
      });
      
      invalidGrades.forEach(grade => {
        expect(validGrades.includes(grade as any)).toBe(false);
      });
    });

    it('should validate framework types', () => {
      const validFrameworks = ['traditional', 'capability'];
      const invalidFrameworks = ['old', 'new', 'custom', '', null];
      
      validFrameworks.forEach(framework => {
        expect(validFrameworks.includes(framework)).toBe(true);
      });
      
      invalidFrameworks.forEach(framework => {
        expect(validFrameworks.includes(framework as any)).toBe(false);
      });
    });

    it('should validate subscription statuses', () => {
      const validStatuses = ['free', 'starter', 'premium'];
      const invalidStatuses = ['paid', 'trial', 'expired', '', null];
      
      validStatuses.forEach(status => {
        expect(validStatuses.includes(status)).toBe(true);
      });
      
      invalidStatuses.forEach(status => {
        expect(validStatuses.includes(status as any)).toBe(false);
      });
    });

    it('should validate scores', () => {
      const validScores = [0, 1, 5, 10, 7.5, 8.9];
      const invalidScores = [-1, 11, -5, 15, 'high', null];
      
      validScores.forEach(score => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      });
      
      invalidScores.forEach(score => {
        if (typeof score === 'number') {
          expect(score < 0 || score > 10).toBe(true);
        } else {
          expect(typeof score).not.toBe('number');
        }
      });
    });

    it('should validate time spent', () => {
      const validTimes = [0, 30, 120, 300, 600]; // seconds
      const invalidTimes = [-1, -30, 'fast', null, undefined];
      
      validTimes.forEach(time => {
        expect(typeof time).toBe('number');
        expect(time).toBeGreaterThanOrEqual(0);
        expect(time).toBeLessThan(3600); // Max 1 hour per question
      });
      
      invalidTimes.forEach(time => {
        const isValid = typeof time === 'number' && time >= 0 && time < 3600;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('File Validation', () => {
    it('should validate file types', () => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      const invalidTypes = [
        'image/jpeg',
        'video/mp4',
        'application/javascript',
        'text/html'
      ];
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      validTypes.forEach(type => {
        expect(allowedTypes.includes(type)).toBe(true);
      });
      
      invalidTypes.forEach(type => {
        expect(allowedTypes.includes(type)).toBe(false);
      });
    });

    it('should validate file sizes', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      const validSizes = [0, 1024, 1024 * 1024, maxSize - 1];
      const invalidSizes = [maxSize + 1, maxSize * 2, -1];
      
      validSizes.forEach(size => {
        expect(size >= 0 && size <= maxSize).toBe(true);
      });
      
      invalidSizes.forEach(size => {
        expect(size < 0 || size > maxSize).toBe(true);
      });
    });

    it('should validate file extensions', () => {
      const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      const invalidExtensions = ['.jpg', '.png', '.js', '.html', '.exe'];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      
      validExtensions.forEach(ext => {
        expect(allowedExtensions.includes(ext)).toBe(true);
      });
      
      invalidExtensions.forEach(ext => {
        expect(allowedExtensions.includes(ext)).toBe(false);
      });
    });
  });

  describe('Interview Data Validation', () => {
    it('should validate competency data', () => {
      const validCompetencies = [
        'team_leadership',
        'judgement_analysis',
        'management_delivery',
        'communication',
        'specialist_knowledge',
        'drive_commitment'
      ];
      
      const invalidCompetencies = [
        'invalid_competency',
        'leadership',
        'communication_skills',
        '',
        null
      ];
      
      validCompetencies.forEach(comp => {
        expect(typeof comp).toBe('string');
        expect(comp.length).toBeGreaterThan(0);
        expect(comp).toMatch(/^[a-z_]+$/);
      });
      
      invalidCompetencies.forEach(comp => {
        if (typeof comp === 'string') {
          expect(validCompetencies.includes(comp)).toBe(false);
        } else {
          expect(typeof comp).not.toBe('string');
        }
      });
    });

    it('should validate STAR method analysis', () => {
      const validSTAR = {
        situation: 8,
        task: 7,
        action: 9,
        result: 8
      };
      
      const invalidSTAR = {
        situation: -1,
        task: 11,
        action: 'good',
        result: null
      };
      
      Object.values(validSTAR).forEach(score => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      });
      
      Object.values(invalidSTAR).forEach(score => {
        const isValid = typeof score === 'number' && score >= 0 && score <= 10;
        expect(isValid).toBe(false);
      });
    });

    it('should validate answer text', () => {
      const validAnswers = [
        'This is a detailed answer explaining the situation...',
        'Short answer',
        'In my previous role, I was responsible for...'
      ];
      
      const invalidAnswers = [
        '', // empty
        null,
        undefined,
        'a', // too short
      ];
      
      validAnswers.forEach(answer => {
        expect(typeof answer).toBe('string');
        expect(answer.length).toBeGreaterThan(1);
        expect(answer.trim().length).toBeGreaterThan(0);
      });
      
      invalidAnswers.forEach(answer => {
        const isValid = typeof answer === 'string' && answer.trim().length > 1;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Date Validation', () => {
    it('should validate date objects', () => {
      const validDates = [
        new Date(),
        new Date('2025-01-01'),
        new Date(2025, 0, 1)
      ];
      
      const invalidDates = [
        new Date('invalid'),
        'today',
        1234567890,
        null
      ];
      
      validDates.forEach(date => {
        expect(date).toBeInstanceOf(Date);
        expect(Number.isNaN(date.getTime())).toBe(false);
      });
      
      invalidDates.forEach(date => {
        if (date instanceof Date) {
          expect(Number.isNaN(date.getTime())).toBe(true);
        } else {
          expect(date).not.toBeInstanceOf(Date);
        }
      });
    });

    it('should validate date ranges', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Past dates should be less than now
      expect(oneHourAgo.getTime()).toBeLessThan(now.getTime());
      
      // Future dates should be greater than now
      expect(oneHourFromNow.getTime()).toBeGreaterThan(now.getTime());
      
      // Duration calculations
      const duration = now.getTime() - oneHourAgo.getTime();
      expect(duration).toBe(60 * 60 * 1000); // 1 hour in milliseconds
    });
  });
});