import express, { type Express } from "express";
import { type Server } from "http";
import path from "path";

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
  // Determine correct path - on Heroku cwd is /app/backend, need to go up to /app
  const isHeroku = process.env.NODE_ENV === 'production';
  const frontendDistPath = isHeroku 
    ? path.join(process.cwd(), '..', 'frontend', 'dist')
    : path.join(process.cwd(), 'frontend', 'dist');
  
  app.use(express.static(frontendDistPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}