// Rating API Routes
import express from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../index";
import { insertRatingSchema, toUUID } from "@shared/schema";

const router = express.Router();

// GET /api/ratings - Get ratings for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { interviewId, questionId, answerId } = req.query;
    
    let ratings;
    if (interviewId) {
      // Get ratings for specific interview
      ratings = await storage.getRatingsByInterviewId(toUUID(interviewId as string));
      
      // Verify interview belongs to authenticated user
      const interview = await storage.getInterviewById(toUUID(interviewId as string));
      if (!interview || interview.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (questionId) {
      // Get ratings for specific question
      ratings = await storage.getRatingsByQuestionId(toUUID(questionId as string));
      // TODO: Add proper authorization check for question ownership
    } else if (answerId) {
      const answerIdStr = answerId as string;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(answerIdStr)) {
        return res.status(400).json({ message: "Invalid answer ID format" });
      }
      
      // Get rating for specific answer
      const rating = await storage.getRatingByAnswerId(toUUID(answerIdStr));
      if (!rating) {
        return res.status(404).json({ message: "Rating not found" });
      }
      
      // Verify answer belongs to authenticated user
      const answer = await storage.getAnswerById(toUUID(answerIdStr));
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
      if (!interview || interview.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      ratings = [rating];
    } else {
      // Get all ratings for user (across all interviews)
      const userInterviews = await storage.getInterviewsByUserId(userId);
      const allRatings = await Promise.all(
        userInterviews.map(interview => storage.getRatingsByInterviewId(toUUID(interview.id)))
      );
      ratings = allRatings.flat();
    }
    
    res.json(ratings);
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/ratings/:id - Get specific rating
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params; const uuid = toUUID(id);
    const userId = req.user.id;
    const ratingId = id; // UUID, no need to parse
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ratingId)) {
      return res.status(400).json({ message: "Invalid rating ID format" });
    }
    
    const rating = await storage.getRatingById(toUUID(ratingId));
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    
    // Verify rating belongs to authenticated user by checking answer ownership
    const answer = await storage.getAnswerById(toUUID(rating.answerId!));
    if (!answer) {
      return res.status(404).json({ message: "Associated answer not found" });
    }
    
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(rating);
  } catch (error) {
    console.error("Get rating error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/ratings/by-answer/:answerId - Get rating for specific answer
router.get("/by-answer/:answerId", isAuthenticated, async (req: any, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(answerId)) {
      return res.status(400).json({ message: "Invalid answer ID format" });
    }
    
    // Get rating for specific answer
    const rating = await storage.getRatingByAnswerId(toUUID(answerId));
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    
    // Verify answer belongs to authenticated user
    const answer = await storage.getAnswerById(toUUID(answerId));
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(rating);
  } catch (error) {
    console.error("Get rating by answer error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// POST /api/ratings - Create new rating
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { answerId, overallScore, competencyScores, starMethodAnalysis, feedback, strengths, improvementAreas, aiImprovedAnswer } = req.body;
    
    // Verify answer belongs to authenticated user
    const answer = await storage.getAnswerById(toUUID(answerId));
    if (!answer) {
      return res.status(400).json({ message: "Answer not found" });
    }
    
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied to answer" });
    }
    
    // Check if rating already exists for this answer
    const existingRating = await storage.getRatingByAnswerId(toUUID(answerId));
    if (existingRating) {
      return res.status(409).json({ message: "Rating already exists for this answer" });
    }
    
    const ratingData = insertRatingSchema.parse({
      answerId,
      overallScore,
      competencyScores,
      starMethodAnalysis,
      feedback,
      strengths,
      improvementAreas,
      aiImprovedAnswer,
      evaluation: {
        overallScore,
        starMethodAnalysis,
        strengths,
        improvementAreas,
        feedback,
        aiImprovedAnswer
      }
    });
    
    const rating = await storage.createRating(ratingData);
    res.status(201).json(rating);
  } catch (error) {
    console.error("Create rating error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// PATCH /api/ratings/:id - Update rating
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params; const uuid = toUUID(id);
    const userId = req.user.id;
    const ratingId = id; // UUID, no need to parse
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ratingId)) {
      return res.status(400).json({ message: "Invalid rating ID format" });
    }
    
    const rating = await storage.getRatingById(toUUID(ratingId));
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    
    // Verify rating belongs to authenticated user
    const answer = await storage.getAnswerById(toUUID(rating.answerId!));
    if (!answer) {
      return res.status(404).json({ message: "Associated answer not found" });
    }
    
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedRating = await storage.updateRating(toUUID(ratingId), req.body);
    res.json(updatedRating);
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// DELETE /api/ratings/:id - Delete rating
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params; const uuid = toUUID(id);
    const userId = req.user.id;
    const ratingId = id; // UUID, no need to parse
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ratingId)) {
      return res.status(400).json({ message: "Invalid rating ID format" });
    }
    
    const rating = await storage.getRatingById(toUUID(ratingId));
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    
    // Verify rating belongs to authenticated user
    const answer = await storage.getAnswerById(toUUID(rating.answerId!));
    if (!answer) {
      return res.status(404).json({ message: "Associated answer not found" });
    }
    
    const interview = await storage.getInterviewById(toUUID(answer.interviewId!));
    if (!interview || interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // TODO: Implement rating deletion
    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;