import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import apiRoutes from "./routes/index";
import { setupRoutes } from "./routes";
import { DatabaseStorage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure CORS for production (Vercel frontend to Heroku backend)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://www.publicprep.ie',
        'https://publicprep.ie',
        'https://publicprep.vercel.app', // Vercel default domain
        ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])
      ]
    : true, // Allow all origins in development
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Serve public assets FIRST to avoid middleware interference (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/public', express.static('../public', {
    maxAge: '1y', // Cache for 1 year
    etag: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.mp4')) {
        res.set({
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000' // 1 year
        });
      } else if (path.endsWith('.png')) {
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000' // 1 year
        });
      }
    }
  }));
}

// Domain redirect middleware - redirect publicserviceprep.ie to publicprep.ie
app.use((req, res, next) => {
  const host = req.get('host');
  if (host === 'publicserviceprep.ie' || host === 'www.publicserviceprep.ie') {
    const protocol = req.secure ? 'https' : 'http';
    const redirectUrl = `${protocol}://publicprep.ie${req.originalUrl}`;
    return res.redirect(301, redirectUrl);
  }
  next();
});

// Handle Stripe webhook with raw body first (before JSON parsing)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize storage globally
export const storage = new DatabaseStorage();

(async () => {
  // Setup authentication routes BEFORE mounting API routes
  const { setupAuth } = await import("./auth");
  await setupAuth(app);
  
  // Mount API routes from the routes directory (entity routes)
  app.use("/api", apiRoutes);
  
  // Register all additional routes including Stripe routes
  const server = await setupRoutes(app);

  // Add global unhandled promise rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error('Express error handler:', err);
    res.status(status).json({ message });
  });

  // Serve manual payment test page
  app.get("/payment-test", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "manual-payment-test.html"));
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 5000
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = process.env.NODE_ENV === 'production' ? "0.0.0.0" : "localhost";
  
  const serverOptions: any = { port, host };
  
  // Only use reusePort in production (Replit/Linux environments)
  if (process.env.NODE_ENV === 'production') {
    serverOptions.reusePort = true;
  }
  
  server.listen(serverOptions, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
