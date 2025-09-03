import { describe, it, expect } from 'vitest';
import {
  insertUserSchema,
  insertDocumentSchema,
  insertInterviewSchema,
  insertQuestionSchema,
  insertAnswerSchema,
  insertRatingSchema,
  users,
  documents,
  interviews,
  questions,
  answers,
  ratings,
} from '../../shared/schema';

describe('Schema Validation - Production Ready', () => {
  describe('Working Insert Schemas', () => {
    it('should validate user registration', () => {
      const userData = {
        email: 'test@example.com',
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = insertUserSchema.safeParse(userData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.firstName).toBe('John');
      }
    });

    it('should validate document upload', () => {
      const documentData = {
        userId: 'user123',
        type: 'cv',
        filename: 'resume.pdf',
        content: 'CV content here...',
      };

      const result = insertDocumentSchema.safeParse(documentData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.type).toBe('cv');
        expect(result.data.filename).toBe('resume.pdf');
      }
    });

    it('should validate interview creation', () => {
      const interviewData = {
        userId: 'user123',
        sessionType: 'full',
        totalQuestions: 12,
        jobGrade: 'heo',
        framework: 'old',
      };

      const result = insertInterviewSchema.safeParse(interviewData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.sessionType).toBe('full');
        expect(result.data.totalQuestions).toBe(12);
      }
    });

    it('should validate question generation', () => {
      const questionData = {
        userId: 'user123',
        interviewId: '550e8400-e29b-41d4-a716-446655440000',
        competency: 'Team Leadership',
        questionText: 'Tell me about a time when you led a team.',
        difficulty: 'intermediate',
      };

      const result = insertQuestionSchema.safeParse(questionData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.competency).toBe('Team Leadership');
        expect(result.data.difficulty).toBe('intermediate');
      }
    });

    it('should validate answer submission', () => {
      const answerData = {
        interviewId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        answerText: 'I led a team of 5 developers on a critical project...',
        timeSpent: 120,
      };

      const result = insertAnswerSchema.safeParse(answerData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.answerText).toBe(answerData.answerText);
        expect(result.data.timeSpent).toBe(120);
      }
    });

    it('should validate AI rating creation', () => {
      const ratingData = {
        answerId: '550e8400-e29b-41d4-a716-446655440002',
        overallScore: '8.5',
        competencyScores: {
          teamLeadership: 8,
          communication: 9,
        },
        starMethodAnalysis: {
          situation: 8,
          task: 7,
          action: 9,
          result: 8,
        },
        feedback: 'Excellent use of STAR method.',
        strengths: ['Clear situation', 'Specific actions'],
        improvementAreas: ['More quantifiable results'],
        aiImprovedAnswer: 'Enhanced version...',
      };

      const result = insertRatingSchema.safeParse(ratingData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.overallScore).toBe('8.5');
        expect(Array.isArray(result.data.strengths)).toBe(true);
      }
    });
  });

  describe('Schema Structure', () => {
    it('should have all required table fields', () => {
      // Users table
      const userFields = Object.keys(users);
      expect(userFields).toContain('id');
      expect(userFields).toContain('email');
      expect(userFields).toContain('subscriptionStatus');

      // Documents table
      const documentFields = Object.keys(documents);
      expect(documentFields).toContain('id');
      expect(documentFields).toContain('userId');
      expect(documentFields).toContain('type');

      // Interviews table
      const interviewFields = Object.keys(interviews);
      expect(interviewFields).toContain('id');
      expect(interviewFields).toContain('userId');
      expect(interviewFields).toContain('sessionType');

      // Questions table
      const questionFields = Object.keys(questions);
      expect(questionFields).toContain('id');
      expect(questionFields).toContain('interviewId');
      expect(questionFields).toContain('competency');

      // Answers table
      const answerFields = Object.keys(answers);
      expect(answerFields).toContain('id');
      expect(answerFields).toContain('questionId');
      expect(answerFields).toContain('answerText');

      // Ratings table
      const ratingFields = Object.keys(ratings);
      expect(ratingFields).toContain('id');
      expect(ratingFields).toContain('answerId');
      expect(ratingFields).toContain('overallScore');
    });
  });

  describe('Data Validation', () => {
    it('should validate user data properly', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'validPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should validate document data properly', () => {
      const validDocument = {
        userId: 'user123',
        type: 'cv',
        filename: 'resume.pdf',
        content: 'Valid CV content here...',
      };

      const result = insertDocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should validate interview data properly', () => {
      const validInterview = {
        userId: 'user123',
        sessionType: 'full',
        totalQuestions: 12,
      };

      const result = insertInterviewSchema.safeParse(validInterview);
      expect(result.success).toBe(true);
    });
  });
});