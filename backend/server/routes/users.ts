// User API Routes
import express from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../index";
import { insertUserSchema } from "@shared/schema";

const router = express.Router();

// GET /api/users/:id - Get user by ID
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Users can only access their own data
    if (id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// PATCH /api/users/:id - Update user
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Users can only update their own data
    if (id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedUser = await storage.updateUser(id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/users/:id/subscription - Get user subscription status
router.get("/:id/subscription", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Users can only access their own subscription data
    if (id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      starterInterviewsUsed: user.starterInterviewsUsed,
      freeAnswersUsed: user.freeAnswersUsed,
      starterExpiresAt: user.starterExpiresAt
    });
  } catch (error) {
    console.error("Get user subscription error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;