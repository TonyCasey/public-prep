// Interview API Routes
import express from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../index";
import { insertInterviewSchema, toUUID } from "@shared/schema";

const router = express.Router();

// GET /api/interviews - Get all interviews for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const interviews = await storage.getInterviewsByUserId(userId);
    res.json(interviews);
  } catch (error) {
    console.error("Get interviews error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// GET /api/interviews/:id - Get specific interview
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Verify interview belongs to authenticated user
    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(interview);
  } catch (error) {
    console.error("Get interview error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// POST /api/interviews - Create new interview
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const interviewData = insertInterviewSchema.parse({
      ...req.body,
      userId,
    });

    // Deactivate any existing active sessions
    const existingSession = await storage.getActiveInterview(userId);
    if (existingSession) {
      await storage.updateInterview(toUUID(existingSession.id), {
        isActive: false,
      });
    }

    const interview = await storage.createInterview(interviewData);
    res.status(201).json(interview);
  } catch (error) {
    console.error("Create interview error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// PATCH /api/interviews/:id - Update interview
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify interview belongs to authenticated user
    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedInterview = await storage.updateInterview(
      toUUID(id),
      req.body,
    );
    res.json(updatedInterview);
  } catch (error) {
    console.error("Update interview error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// DELETE /api/interviews/:id - Delete interview
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify interview belongs to authenticated user
    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete the interview with cascading deletion
    const deleted = await storage.deleteInterview(toUUID(id));
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete interview" });
    }

    res.json({ message: "Interview deleted successfully" });
  } catch (error) {
    console.error("Delete interview error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// GET /api/interviews/:id/answers - Get answers for specific interview
router.get("/:id/answers", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Verify interview belongs to authenticated user
    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const answers = await storage.getAnswersByInterviewId(id);
    res.json(answers);
  } catch (error) {
    console.error("Get interview answers error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// GET /api/interviews/:id/export - Export interview report
router.get("/:id/export", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await storage.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Verify interview belongs to authenticated user
    if (interview.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const answers = await storage.getAnswersByInterviewId(id);
    const user = await storage.getUser(userId);

    const report = {
      interview: {
        id: interview.id,
        jobTitle: interview.jobTitle,
        jobGrade: interview.jobGrade,
        framework: interview.framework,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        averageScore: interview.averageScore,
      },
      user: {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      answers: answers.length,
      exportedAt: new Date().toISOString(),
    };

    const filename = `interview-report-${id}-${new Date().toISOString().split("T")[0]}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(report);
  } catch (error) {
    console.error("Export interview error:", error);
    res
      .status(500)
      .json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

export default router;
