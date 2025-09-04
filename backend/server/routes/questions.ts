// Question API Routes
import express from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../index";
import { insertQuestionSchema, toUUID } from "@shared/schema";

const router = express.Router();

// GET /api/questions - Get all questions for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { interviewId, competency } = req.query;
    
    let questions;
    if (interviewId) {
      // Get questions for specific interview
      questions = await storage.getQuestionsByInterviewId(interviewId);
    } else if (competency) {
      questions = await storage.getQuestionsByCompetency(userId, competency as string);
    } else {
      // This endpoint should not be used without interviewId or competency
      return res.status(400).json({ message: "interviewId or competency parameter required" });
    }
    
    res.json(questions);
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/questions/:interviewId - Get questions for specific interview
router.get("/:interviewId", isAuthenticated, async (req: any, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    
    console.log("Getting questions for interview:", interviewId, "user:", userId);
    
    // Verify interview belongs to authenticated user
    const interview = await storage.getInterviewById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    
    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get questions directly for this interview using database query
    const questions = await storage.getQuestionsByInterviewId(interviewId);
    
    console.log("Found questions for interview:", questions.length);
    res.json(questions);
  } catch (error) {
    console.error("Get questions for interview error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/questions/single/:id - Get specific question by ID
router.get("/single/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: "Invalid question ID format" });
    }
    
    const question = await storage.getQuestionById(toUUID(id));
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Verify question belongs to authenticated user by checking interview ownership
    const interview = await storage.getInterviewById(toUUID(question.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(question);
  } catch (error) {
    console.error("Get question by ID error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// POST /api/questions - Create new question
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const questionData = insertQuestionSchema.parse({
      ...req.body,
      userId
    });
    
    // Verify interviewId belongs to authenticated user if provided
    if (questionData.interviewId) {
      const interviews = await storage.getInterviewsByUserId(userId);
      const interview = interviews.find(i => i.id === questionData.interviewId);
      if (!interview) {
        return res.status(403).json({ message: "Access denied to interview session" });
      }
    }
    
    const question = await storage.createQuestion(questionData);
    res.status(201).json(question);
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// DELETE /api/questions/:id - Delete question
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const question = await storage.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Verify question belongs to authenticated user
    if (question.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const deleted = await storage.deleteQuestion(id);
    if (deleted) {
      res.json({ message: "Question deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete question" });
    }
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/questions/interview/:interviewId/current - Get current question for interview session
router.get("/interview/:interviewId/current", isAuthenticated, async (req: any, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    
    // Verify session belongs to authenticated user
    const interview = await storage.getInterviewById(interviewId);
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get questions for this session
    const sessionQuestions = await storage.getQuestionsByInterviewId(interviewId);
    
    if (sessionQuestions.length === 0) {
      return res.status(404).json({ message: "No questions found for this session" });
    }
    
    // Get current question based on session's currentQuestionIndex
    const currentIndex = interview.currentQuestionIndex || 0;
    const currentQuestion = sessionQuestions[currentIndex];
    
    if (!currentQuestion) {
      return res.status(404).json({ message: "Current question not found" });
    }
    
    res.json(currentQuestion);
  } catch (error) {
    console.error("Get current question error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;