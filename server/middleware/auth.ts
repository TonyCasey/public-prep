// Authentication middleware
import { Request, Response, NextFunction } from "express";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated (this should match your existing auth logic)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Alternative check for session-based auth
  if (req.session && (req.session as any).passport && (req.session as any).passport.user) {
    req.user = (req.session as any).passport.user;
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};