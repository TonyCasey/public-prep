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

describe('Production Schema Validation', () => {
  describe('Insert Schema Validation - Current Production', () => {
    it('should validate user insert schema', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.firstName).toBe('John');
      }
    });

    it('should validate document insert schema', () => {
      const validDocument = {
        userId: 'user123',
        type: 'cv',
        filename: 'resume.pdf',
        content: 'Document content here...',
      };

      const result = insertDocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.type).toBe('cv');
        expect(result.data.filename).toBe('resume.pdf');
      }
    });

    it('should validate interview insert schema', () => {
      const validInterview = {
        userId: 'user123',
        sessionType: 'full',
        totalQuestions: 12,
        jobGrade: 'heo',
        framework: 'old',
      };

      const result = insertInterviewSchema.safeParse(validInterview);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.sessionType).toBe('full');
        expect(result.data.totalQuestions).toBe(12);
      }
    });

    it('should validate question insert schema', () => {
      const validQuestion = {
        userId: 'user123',
        interviewId: '550e8400-e29b-41d4-a716-446655440000',
        competency: 'Team Leadership',
        questionText: 'Tell me about a time when you led a team.',
        difficulty: 'intermediate',
      };

      const result = insertQuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.competency).toBe('Team Leadership');
        expect(result.data.difficulty).toBe('intermediate');
      }
    });

    it('should validate answer insert schema', () => {
      const validAnswer = {
        interviewId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        answerText: 'I led a team of 5 developers on a critical project...',
        timeSpent: 120,
      };

      const result = insertAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.answerText).toBe(validAnswer.answerText);
        expect(result.data.timeSpent).toBe(120);
      }
    });

    it('should validate rating insert schema', () => {
      const validRating = {
        answerId: '550e8400-e29b-41d4-a716-446655440002',
        overallScore: '8.5',
        competencyScores: {
          teamLeadership: 8,
          communication: 9,
          problemSolving: 7,
        },
        starMethodAnalysis: {
          situation: 8,
          task: 7,
          action: 9,
          result: 8,
        },
        feedback: 'Good use of STAR method with clear examples.',
        strengths: ['Clear situation description', 'Specific actions taken'],
        improvementAreas: ['Could expand on measurable results'],
        aiImprovedAnswer: 'Enhanced version of the answer...',
      };

      const result = insertRatingSchema.safeParse(validRating);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.overallScore).toBe('8.5');
        expect(Array.isArray(result.data.strengths)).toBe(true);
      }
    });
  });

  describe('Schema Structure Validation', () => {
    it('should have users table with expected fields', () => {
      const userFields = Object.keys(users);
      expect(userFields).toContain('id');
      expect(userFields).toContain('email');
      expect(userFields).toContain('password');
      expect(userFields).toContain('subscriptionStatus');
    });

    it('should have documents table with expected fields', () => {
      const documentFields = Object.keys(documents);
      expect(documentFields).toContain('id');
      expect(documentFields).toContain('userId');
      expect(documentFields).toContain('type');
      expect(documentFields).toContain('content');
    });

    it('should have interviews table with expected fields', () => {
      const interviewFields = Object.keys(interviews);
      expect(interviewFields).toContain('id');
      expect(interviewFields).toContain('userId');
      expect(interviewFields).toContain('sessionType');
      expect(interviewFields).toContain('totalQuestions');
    });

    it('should have questions table with expected fields', () => {
      const questionFields = Object.keys(questions);
      expect(questionFields).toContain('id');
      expect(questionFields).toContain('userId');
      expect(questionFields).toContain('interviewId');
      expect(questionFields).toContain('competency');
    });

    it('should have answers table with expected fields', () => {
      const answerFields = Object.keys(answers);
      expect(answerFields).toContain('id');
      expect(answerFields).toContain('interviewId');
      expect(answerFields).toContain('questionId');
      expect(answerFields).toContain('answerText');
    });

    it('should have ratings table with expected fields', () => {
      const ratingFields = Object.keys(ratings);
      expect(ratingFields).toContain('id');
      expect(ratingFields).toContain('answerId');
      expect(ratingFields).toContain('overallScore');
      expect(ratingFields).toContain('feedback');
    });
  });
});