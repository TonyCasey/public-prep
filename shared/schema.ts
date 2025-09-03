import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// UUID type for better type safety
export type UUID = string & { readonly brand: unique symbol };

// Helper functions for UUID handling
export function toUUID(str: string): UUID {
  return str as UUID;
}

export function generateUUID(): UUID {
  // This will be handled by database default in most cases
  return crypto.randomUUID() as UUID;
}

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  subscriptionStatus: varchar("subscription_status").default('free'), // 'free', 'starter', 'premium', 'canceled', 'past_due'
  subscriptionId: varchar("subscription_id"),
  freeAnswersUsed: integer("free_answers_used").default(0),
  starterInterviewsUsed: integer("starter_interviews_used").default(0),
  starterExpiresAt: timestamp("starter_expires_at"),
  milestoneSent70: boolean("milestone_sent_70").default(false),
  milestoneSent80: boolean("milestone_sent_80").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document uploads (CV, Job Spec)
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // 'cv' or 'job_spec'
  filename: text("filename").notNull(),
  content: text("content").notNull(), // extracted text content
  analysis: jsonb("analysis"), // AI analysis results
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Generated questions
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  interviewId: uuid("interview_id").references(() => interviews.id),
  competency: text("competency").notNull(),
  questionText: text("question_text").notNull(),
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Interviews
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  sessionType: text("session_type").notNull(), // 'full', 'competency_focus', 'quick'
  competencyFocus: jsonb("competency_focus"), // array of competencies to focus on
  jobTitle: text("job_title"), // Job title from job spec
  jobGrade: text("job_grade").default('eo'), // Grade level: co, eo, ao, ap, po, as, ds, sg
  framework: text("framework").default('old'), // 'old' (6 competencies) or 'new' (4 areas)
  totalQuestions: integer("total_questions").notNull(),
  currentQuestionIndex: integer("current_question_index").default(0),
  completedQuestions: integer("completed_questions").default(0),
  averageScore: integer("average_score"), // out of 10
  duration: integer("duration"), // in minutes
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  isActive: boolean("is_active").default(true),
});

// User answers (what the user provides)
export const answers = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id").references(() => interviews.id),
  questionId: uuid("question_id").references(() => questions.id),
  answerText: text("answer_text").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  answeredAt: timestamp("answered_at").defaultNow(),
});

// AI ratings/evaluations of answers (what the AI evaluates)
export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  answerId: uuid("answer_id").references(() => answers.id),
  overallScore: decimal("overall_score").notNull(), // out of 10 (allows decimals like 7.5)
  competencyScores: jsonb("competency_scores"), // breakdown by competency
  starMethodAnalysis: jsonb("star_method_analysis"), // STAR method breakdown
  feedback: text("feedback"),
  strengths: jsonb("strengths"), // array of strength points
  improvementAreas: jsonb("improvement_areas"), // array of improvement suggestions
  aiImprovedAnswer: text("ai_improved_answer"), // AI's suggested improvement
  evaluation: jsonb("evaluation"), // Full evaluation details for backward compatibility
  ratedAt: timestamp("rated_at").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  competency: text("competency").notNull(),
  averageScore: integer("average_score").notNull(),
  totalQuestions: integer("total_questions").default(0),
  improvementRate: integer("improvement_rate").default(0), // percentage
  lastPracticed: timestamp("last_practiced").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Backup records
export const backups = pgTable("backups", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  backupData: jsonb("backup_data").notNull(),
  backupType: text("backup_type").notNull(), // 'auto', 'manual'
  createdAt: timestamp("created_at").defaultNow(),
});



// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  email: varchar("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true, 
  updatedAt: true,
  stripeCustomerId: true,
  subscriptionStatus: true,
  subscriptionId: true,
  freeAnswersUsed: true
});
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, generatedAt: true });
export const insertInterviewSchema = createInsertSchema(interviews).omit({ 
  id: true, 
  startedAt: true, 
  completedAt: true 
});
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, answeredAt: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, ratedAt: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ 
  id: true, 
  lastPracticed: true, 
  updatedAt: true 
});
export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

// Competency types based on HEO framework
export type CompetencyType = 
  | 'team_leadership'
  | 'judgement_analysis_decision_making'
  | 'management_delivery_results'
  | 'interpersonal_communication_skills'
  | 'specialist_knowledge_expertise_self_development'
  | 'drive_commitment';

export type SessionType = 'full' | 'competency_focus' | 'quick';
export type DocumentType = 'cv' | 'job_spec';
export type BackupType = 'auto' | 'manual';
export type FrameworkType = 'old' | 'new';
export type GradeType = 'co' | 'eo' | 'ao' | 'ap' | 'po' | 'as' | 'ds' | 'sg';
