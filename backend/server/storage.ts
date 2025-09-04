import { 
  users, documents, questions, interviews, answers, ratings, userProgress, backups,
  User, InsertUser, UpsertUser, Document, InsertDocument, Question, InsertQuestion,
  Interview, InsertInterview, Answer, InsertAnswer, Rating, InsertRating,
  UserProgress, InsertUserProgress, Backup, InsertBackup,
  CompetencyType, SessionType, DocumentType, UUID
} from "@shared/schema";
import { v4 as uuidv4, validate as isValidUUID } from 'uuid';
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management - User IDs are strings (from auth system), Entity IDs are UUIDs
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Document management - Entity IDs are UUIDs, User IDs are strings
  getDocumentsByUserId(userId: string): Promise<Document[]>;
  getDocumentByType(userId: string, type: DocumentType): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: UUID, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: UUID): Promise<boolean>;

  // Question management - Entity IDs are UUIDs, User IDs are strings  
  getQuestionsByInterviewId(interviewId: UUID): Promise<Question[]>;
  getQuestionsByCompetency(userId: string, competency: string): Promise<Question[]>;
  getQuestionById(id: UUID): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestion(id: UUID): Promise<boolean>;

  // Interview management - Entity IDs are UUIDs, User IDs are strings
  getInterviewsByUserId(userId: string): Promise<Interview[]>;
  getInterviewById(id: UUID): Promise<Interview | undefined>;
  getActiveInterview(userId: string): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: UUID, updates: Partial<Interview>): Promise<Interview | undefined>;
  deleteInterview(id: UUID): Promise<boolean>;

  // Answer management - Entity IDs are UUIDs, User IDs are strings
  getAnswersByQuestionId(questionId: UUID): Promise<Answer[]>;
  getAnswersByInterviewId(interviewId: UUID): Promise<Answer[]>;
  getAnswerById(answerId: UUID): Promise<Answer | undefined>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: UUID, updates: Partial<Answer>): Promise<Answer | undefined>;
  getAnswersByCompetency(userId: string, competency: string): Promise<Answer[]>;

  // Rating management - Entity IDs are UUIDs
  getRatingById(ratingId: UUID): Promise<Rating | undefined>;
  getRatingByAnswerId(answerId: UUID): Promise<Rating | undefined>;
  getRatingsByQuestionId(questionId: UUID): Promise<Rating[]>; // Gets ratings for answers to a specific question
  getRatingsByInterviewId(interviewId: UUID): Promise<Rating[]>; // Gets ratings for all answers in an interview
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(id: UUID, updates: Partial<Rating>): Promise<Rating | undefined>;

  // Progress tracking - User IDs are strings, Entity IDs are UUIDs
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getProgressByCompetency(userId: string, competency: string): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, competency: string, updates: Partial<UserProgress>): Promise<UserProgress>;

  // Backup management - User IDs are strings
  createBackup(backup: InsertBackup): Promise<Backup>;
  getBackupsByUserId(userId: string): Promise<Backup[]>;
  getLatestBackup(userId: string): Promise<Backup | undefined>;

  // Subscription management - User IDs are strings
  updateUser(userId: string, updates: Partial<User>): Promise<User | null>;
}

// Helper function to validate and cast UUID
function toUUID(id: string): UUID {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
  return id as UUID;
}

// Helper function to generate UUID
function generateUUID(): UUID {
  return uuidv4() as UUID;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    const userId = Date.now().toString();
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: userData.email!,
        password: userData.password!,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  // Document management
  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId));
  }

  async getDocumentByType(userId: string, type: DocumentType): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.type, type)));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateDocument(id: UUID, updates: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: UUID): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Question management
  async getQuestionsByInterviewId(interviewId: UUID): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.interviewId, interviewId));
  }

  async getQuestionsByCompetency(userId: string, competency: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(and(eq(questions.userId, userId), eq(questions.competency, competency)));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async getQuestionById(id: UUID): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async deleteQuestion(id: UUID): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Interview management (renamed from practice session for clarity)
  async getInterviewsByUserId(userId: string): Promise<Interview[]> {
    return await db.select().from(interviews).where(eq(interviews.userId, userId));
  }

  async getInterviewById(id: UUID): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async getActiveInterview(userId: string): Promise<Interview | undefined> {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.userId, userId), eq(interviews.isActive, true)));
    return interview;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values(interview)
      .returning();
    return newInterview;
  }

  async updateInterview(id: UUID, updates: Partial<Interview>): Promise<Interview | undefined> {
    const [updatedInterview] = await db
      .update(interviews)
      .set(updates)
      .where(eq(interviews.id, id))
      .returning();
    return updatedInterview;
  }

  async deleteInterview(id: UUID): Promise<boolean> {
    try {
      // First delete all ratings for answers in this interview
      const interviewAnswers = await this.getAnswersByInterviewId(id);
      for (const answer of interviewAnswers) {
        await db.delete(ratings).where(eq(ratings.answerId, toUUID(answer.id)));
      }

      // Then delete all answers for this interview
      await db.delete(answers).where(eq(answers.interviewId, id));

      // Then delete all questions for this interview
      await db.delete(questions).where(eq(questions.interviewId, id));

      // Finally delete the interview itself
      const result = await db.delete(interviews).where(eq(interviews.id, id));
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting interview:', error);
      return false;
    }
  }

  async getAnswerById(answerId: UUID): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, answerId));
    return answer;
  }

  // Answer management (user responses only)  
  async getAnswersByQuestionId(questionId: UUID): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.questionId, questionId));
  }

  async getAnswersByInterviewId(interviewId: UUID): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.interviewId, interviewId));
  }
  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [newAnswer] = await db.insert(answers).values(answer).returning();
    return newAnswer;
  }

  async updateAnswer(id: UUID, updates: Partial<Answer>): Promise<Answer | undefined> {
    const [updatedAnswer] = await db
      .update(answers)
      .set(updates)
      .where(eq(answers.id, id))
      .returning();
    return updatedAnswer;
  }

  async getAnswersByCompetency(userId: string, competency: string): Promise<Answer[]> {
    return await db
      .select({
        id: answers.id,
        interviewId: answers.interviewId,
        questionId: answers.questionId,
        answerText: answers.answerText,
        timeSpent: answers.timeSpent,
        answeredAt: answers.answeredAt,
      })
      .from(answers)
      .leftJoin(questions, eq(answers.questionId, questions.id))
      .leftJoin(interviews, eq(answers.interviewId, interviews.id))
      .where(and(eq(interviews.userId, userId), eq(questions.competency, competency)));
  }

  // Rating management - get ratings for answers in a specific interview
  async getRatingsByInterviewId(interviewId: UUID): Promise<Rating[]> {
    // First get all answers for the interview, then get ratings for those answers
    const interviewAnswers = await this.getAnswersByInterviewId(interviewId);
    const answerIds = interviewAnswers.map(answer => answer.id);
    
    if (answerIds.length === 0) {
      return [];
    }
    
    // Get all ratings for the answer IDs
    const ratingsResult = [];
    for (const answerId of answerIds) {
      const rating = await this.getRatingByAnswerId(toUUID(answerId));
      if (rating) {
        ratingsResult.push(rating);
      }
    }
    return ratingsResult;
  }

  async getRatingById(ratingId: UUID): Promise<Rating | undefined> {
    const [rating] = await db.select().from(ratings).where(eq(ratings.id, ratingId));
    return rating;
  }

  async getRatingByAnswerId(answerId: UUID): Promise<Rating | undefined> {
    const [rating] = await db.select().from(ratings).where(eq(ratings.answerId, answerId));
    return rating;
  }

  async getRatingsByQuestionId(questionId: UUID): Promise<Rating[]> {
    // Get all answers for this question, then get ratings for those answers
    const questionAnswers = await db.select().from(answers).where(eq(answers.questionId, questionId));
    const answerIds = questionAnswers.map(answer => answer.id);
    
    if (answerIds.length === 0) {
      return [];
    }
    
    const ratingsResult = [];
    for (const answerId of answerIds) {
      const rating = await this.getRatingByAnswerId(toUUID(answerId));
      if (rating) {
        ratingsResult.push(rating);
      }
    }
    return ratingsResult;
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async updateRating(id: UUID, updates: Partial<Rating>): Promise<Rating | undefined> {
    const [updatedRating] = await db
      .update(ratings)
      .set(updates)
      .where(eq(ratings.id, id))
      .returning();
    return updatedRating;
  }



  // Progress tracking
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getProgressByCompetency(userId: string, competency: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.competency, competency)));
    return progress;
  }

  async updateUserProgress(userId: string, competency: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    const existingProgress = await this.getProgressByCompetency(userId, competency);

    if (existingProgress) {
      const [updated] = await db
        .update(userProgress)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(userProgress.userId, userId), eq(userProgress.competency, competency)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProgress)
        .values({
          userId,
          competency,
          averageScore: 0,
          totalQuestions: 0,
          improvementRate: 0,
          ...updates
        })
        .returning();
      return created;
    }
  }

  // Backup management
  async createBackup(backup: InsertBackup): Promise<Backup> {
    const [newBackup] = await db
      .insert(backups)
      .values(backup)
      .returning();
    return newBackup;
  }

  async getBackupsByUserId(userId: string): Promise<Backup[]> {
    return await db.select().from(backups).where(eq(backups.userId, userId));
  }

  async getLatestBackup(userId: string): Promise<Backup | undefined> {
    const [backup] = await db
      .select()
      .from(backups)
      .where(eq(backups.userId, userId))
      .orderBy(backups.createdAt)
      .limit(1);
    return backup;
  }
}

export const storage = new DatabaseStorage();