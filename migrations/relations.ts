import { relations } from "drizzle-orm/relations";
import { users, questions, interviews, documents, answers, ratings, backups, userProgress } from "./schema";

export const questionsRelations = relations(questions, ({one, many}) => ({
	user: one(users, {
		fields: [questions.userId],
		references: [users.id]
	}),
	interview: one(interviews, {
		fields: [questions.interviewId],
		references: [interviews.id]
	}),
	answers: many(answers),
}));

export const usersRelations = relations(users, ({many}) => ({
	questions: many(questions),
	documents: many(documents),
	backups: many(backups),
	interviews: many(interviews),
	userProgresses: many(userProgress),
}));

export const interviewsRelations = relations(interviews, ({one, many}) => ({
	questions: many(questions),
	user: one(users, {
		fields: [interviews.userId],
		references: [users.id]
	}),
	answers: many(answers),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
}));

export const ratingsRelations = relations(ratings, ({one}) => ({
	answer: one(answers, {
		fields: [ratings.answerId],
		references: [answers.id]
	}),
}));

export const answersRelations = relations(answers, ({one, many}) => ({
	ratings: many(ratings),
	interview: one(interviews, {
		fields: [answers.interviewId],
		references: [interviews.id]
	}),
	question: one(questions, {
		fields: [answers.questionId],
		references: [questions.id]
	}),
}));

export const backupsRelations = relations(backups, ({one}) => ({
	user: one(users, {
		fields: [backups.userId],
		references: [users.id]
	}),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	user: one(users, {
		fields: [userProgress.userId],
		references: [users.id]
	}),
}));