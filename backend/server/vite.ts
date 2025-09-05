import express, { type Express } from "express";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Vite setup is no longer needed in backend - it's API only
export async function setupVite(app: Express, server: Server) {
  // No-op - Vite is handled by frontend
}

// Serve built frontend files in production
export function serveStatic(app: Express) {
  const path = require('path');
  
  // Serve static files from frontend/dist
  app.use(express.static(path.join(process.cwd(), 'frontend/dist')));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(process.cwd(), 'frontend/dist/index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}