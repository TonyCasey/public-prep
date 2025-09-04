import { pgTable, foreignKey, uuid, varchar, text, timestamp, jsonb, numeric, unique, boolean, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id"),
	interviewId: uuid("interview_id"),
	competency: text().notNull(),
	questionText: text("question_text").notNull(),
	difficulty: text().notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "questions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.interviewId],
			foreignColumns: [interviews.id],
			name: "questions_interview_id_interviews_id_fk"
		}),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id"),
	type: text().notNull(),
	filename: text().notNull(),
	content: text().notNull(),
	analysis: jsonb(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "documents_user_id_users_id_fk"
		}),
]);

export const ratings = pgTable("ratings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	answerId: uuid("answer_id"),
	overallScore: numeric("overall_score").notNull(),
	competencyScores: jsonb("competency_scores"),
	starMethodAnalysis: jsonb("star_method_analysis"),
	feedback: text(),
	strengths: jsonb(),
	improvementAreas: jsonb("improvement_areas"),
	aiImprovedAnswer: text("ai_improved_answer"),
	evaluation: jsonb(),
	ratedAt: timestamp("rated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.answerId],
			foreignColumns: [answers.id],
			name: "ratings_answer_id_answers_id_fk"
		}),
]);

export const backups = pgTable("backups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id"),
	backupData: jsonb("backup_data").notNull(),
	backupType: text("backup_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "backups_user_id_users_id_fk"
		}),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	token: varchar({ length: 64 }).notNull(),
	email: varchar().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: boolean().default(false),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const interviews = pgTable("interviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id"),
	sessionType: text("session_type").notNull(),
	competencyFocus: jsonb("competency_focus"),
	jobTitle: text("job_title"),
	jobGrade: text("job_grade").default('eo'),
	framework: text().default('old'),
	totalQuestions: integer("total_questions").notNull(),
	currentQuestionIndex: integer("current_question_index").default(0),
	completedQuestions: integer("completed_questions").default(0),
	averageScore: integer("average_score"),
	duration: integer(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "interviews_user_id_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const answers = pgTable("answers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interviewId: uuid("interview_id"),
	questionId: uuid("question_id"),
	answerText: text("answer_text").notNull(),
	timeSpent: integer("time_spent"),
	answeredAt: timestamp("answered_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.interviewId],
			foreignColumns: [interviews.id],
			name: "answers_interview_id_interviews_id_fk"
		}),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "answers_question_id_questions_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: varchar().notNull(),
	password: varchar().notNull(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	stripeCustomerId: varchar("stripe_customer_id"),
	subscriptionStatus: varchar("subscription_status").default('free'),
	subscriptionId: varchar("subscription_id"),
	freeAnswersUsed: integer("free_answers_used").default(0),
	starterInterviewsUsed: integer("starter_interviews_used").default(0),
	starterExpiresAt: timestamp("starter_expires_at", { mode: 'string' }),
	milestoneSent70: boolean("milestone_sent_70").default(false),
	milestoneSent80: boolean("milestone_sent_80").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const userProgress = pgTable("user_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id"),
	competency: text().notNull(),
	averageScore: integer("average_score").notNull(),
	totalQuestions: integer("total_questions").default(0),
	improvementRate: integer("improvement_rate").default(0),
	lastPracticed: timestamp("last_practiced", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_progress_user_id_users_id_fk"
		}),
]);
