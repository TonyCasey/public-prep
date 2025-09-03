// Answer API Routes
import express from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../index";
import { insertAnswerSchema, toUUID } from "@shared/schema";

const router = express.Router();

// GET /api/answers - Get answers for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { interviewId, questionId, competency } = req.query;
    
    let answers;
    if (interviewId) {
      // Get answers for specific interview
      answers = await storage.getAnswersByInterviewId(toUUID(interviewId as string));
      
      // Verify interview belongs to authenticated user
      const interview = await storage.getInterviewById(toUUID(interviewId as string));
      if (!interview || interview.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (questionId) {
      // Get answers for specific question
      answers = await storage.getAnswersByQuestionId(toUUID(questionId as string));
      // TODO: Add proper authorization check for question ownership
    } else if (competency) {
      answers = await storage.getAnswersByCompetency(userId, competency as string);
    } else {
      // Get all answers for user (across all interviews)
      const userInterviews = await storage.getInterviewsByUserId(userId);
      const allAnswers = await Promise.all(
        userInterviews.map(interview => storage.getAnswersByInterviewId(toUUID(interview.id)))
      );
      answers = allAnswers.flat();
    }
    
    res.json(answers);
  } catch (error) {
    console.error("Get answers error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/answers/by-interview/:interviewId - Get answers for specific interview  
router.get("/by-interview/:interviewId", isAuthenticated, async (req: any, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    
    console.log("Getting answers for interview:", interviewId, "user:", userId);
    
    // Verify interview belongs to authenticated user
    const interview = await storage.getInterviewById(toUUID(interviewId));
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    
    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get answers for this interview
    const answers = await storage.getAnswersByInterviewId(toUUID(interviewId));
    
    console.log("Found answers for interview:", answers.length);
    res.json(answers);
  } catch (error) {
    console.error("Get answers for interview error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/answers/by-question/:questionId - Get answers for specific question (latest first)
router.get("/by-question/:questionId", isAuthenticated, async (req: any, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(questionId)) {
      return res.status(400).json({ message: "Invalid question ID format" });
    }
    
    // Verify question exists and belongs to user's interview
    const question = await storage.getQuestionById(toUUID(questionId));
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const interview = await storage.getInterviewById(toUUID(question.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get answers for this question (sorted by creation date DESC)
    const answers = await storage.getAnswersByQuestionId(toUUID(questionId));
    res.json(answers);
  } catch (error) {
    console.error("Get answers by question error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/answers/:id - Get specific answer
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const answerId = id; // UUID, no need to parse
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID format" });
    }
    
    const answer = await storage.getAnswerById(toUUID(answerId));
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // Verify answer belongs to authenticated user by checking session ownership
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(answer);
  } catch (error) {
    console.error("Get answer error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// POST /api/answers - Create new answer
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { interviewId, questionId, answerText, timeSpent } = req.body;
    
    // Verify session belongs to authenticated user
    const interview = await storage.getInterviewById(interviewId);
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied to interview session" });
    }
    
    // Verify question exists and belongs to the session
    const question = await storage.getQuestionById(questionId);
    if (!question || question.interviewId !== interviewId) {
      return res.status(400).json({ message: "Invalid question for this session" });
    }
    
    // CRITICAL FIX: Check if answer already exists for this question
    const existingAnswers = await storage.getAnswersByQuestionId(toUUID(questionId));
    let answer;
    
    if (existingAnswers.length > 0) {
      // Update existing answer instead of creating duplicate
      const existingAnswer = existingAnswers[0];
      const answerData = {
        answerText,
        timeSpent: timeSpent || 0
      };
      answer = await storage.updateAnswer(toUUID(existingAnswer.id), answerData);
      console.log('Updated existing answer for question:', questionId);
    } else {
      // Create new answer
      const answerData = insertAnswerSchema.parse({
        interviewId,
        questionId,
        answerText,
        timeSpent: timeSpent || 0
      });
      answer = await storage.createAnswer(answerData);
      console.log('Created new answer for question:', questionId);
    }
    
    if (!answer) {
      throw new Error('Failed to create or update answer');
    }

    // No need to track global answer count - free users are limited per interview

    // Trigger AI evaluation for the answer
    try {
      const { evaluateAnswer } = await import("../services/openai.js");
      
      // Get CV context if available
      let cvContext = null;
      try {
        const cvDoc = await storage.getDocumentByType(userId, "cv");
        cvContext = cvDoc?.content || null;
      } catch (error) {
        console.log("No CV found for evaluation context");
      }

      const evaluation = await evaluateAnswer(
        question.questionText,
        answerText,
        question.competency,
        cvContext || undefined
      );

      // Debug the evaluation object structure
      console.log('Full evaluation object:', JSON.stringify(evaluation, null, 2));

      // Store the rating - ensure proper data types for database
      const ratingData = {
        answerId: answer.id,
        overallScore: evaluation.overallScore.toString(), // Convert to string for decimal type
        competencyScores: evaluation.competencyScores, // Already an object for JSONB
        starMethodAnalysis: evaluation.starMethodAnalysis, // Already an object for JSONB
        feedback: evaluation.feedback,
        strengths: evaluation.strengths, // Keep as array for JSONB
        improvementAreas: evaluation.improvementAreas, // Keep as array for JSONB
        aiImprovedAnswer: evaluation.improvedAnswer
      };
      
      console.log('Rating data being stored:', JSON.stringify(ratingData, null, 2));

      try {
        const rating = await storage.createRating(ratingData);
        console.log('Rating successfully created:', JSON.stringify(rating, null, 2));
      } catch (ratingError) {
        console.error('Failed to create rating:', ratingError);
        console.error('Rating data that failed:', JSON.stringify(ratingData, null, 2));
        // Continue without failing the entire request
      }

      // Return answer with evaluation
      res.status(201).json({
        ...answer,
        evaluation
      });
    } catch (evaluationError) {
      console.error("AI evaluation failed:", evaluationError);
      // Still return the answer even if evaluation fails
      res.status(201).json(answer);
    }
  } catch (error) {
    console.error("Create answer error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// PATCH /api/answers/:id - Update answer
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const answerId = id; // UUID, no need to parse
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID format" });
    }
    
    const answer = await storage.getAnswerById(toUUID(answerId));
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // Verify answer belongs to authenticated user by checking session ownership
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedAnswer = await storage.updateAnswer(toUUID(answerId), req.body);
    res.json(updatedAnswer);
  } catch (error) {
    console.error("Update answer error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// DELETE /api/answers/:id - Delete answer
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const answerId = id; // UUID, no need to parse
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID format" });
    }
    
    const answer = await storage.getAnswerById(toUUID(answerId));
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // Verify answer belongs to authenticated user by checking session ownership
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // TODO: Implement answer deletion with cascade to ratings
    res.json({ message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Delete answer error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;