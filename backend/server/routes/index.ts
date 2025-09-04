// Main Routes Index - Separate API for each entity
import express from "express";
import userRoutes from "./users";
import interviewRoutes from "./interviews";
import documentRoutes from "./documents";
import questionRoutes from "./questions";
import answerRoutes from "./answers";
import ratingRoutes from "./ratings";
import speechRoutes from "./speech";
import deepgramRoutes from "./deepgram";
import audioDebugRoutes from "./audio-debug";

const router = express.Router();

// Mount entity-specific routes
router.use("/users", userRoutes);
router.use("/interviews", interviewRoutes);
router.use("/documents", documentRoutes);
router.use("/questions", questionRoutes);
router.use("/answers", answerRoutes);
router.use("/ratings", ratingRoutes);
router.use("/speech", speechRoutes);
router.use("/deepgram", deepgramRoutes);
router.use("/audio-debug", audioDebugRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    entities: ["users", "interviews", "documents", "questions", "answers", "ratings", "speech", "deepgram"]
  });
});

export default router;