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

// Static serving is no longer needed in backend - it's API only  
export function serveStatic(app: Express) {
  // No-op - static files are served by frontend
}