import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./services/emailService";
import { generatePasswordResetToken, validatePasswordResetToken, markTokenAsUsed } from "./services/passwordResetService";
import { crmService } from "./services/crm";
import { pool, encodedDatabaseUrl } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: encodedDatabaseUrl, // Use the properly encoded database URL
      tableName: 'sessions',
      createTableIfMissing: true, // Allow table creation if missing
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // Secure: prevent JavaScript access to session cookie
      secure: false, // Allow cookies to work on both HTTP and HTTPS
      sameSite: 'lax'
    }
  };

  console.log('🔧 Session settings configured:', {
    cookieMaxAge: sessionSettings.cookie?.maxAge,
    cookieSecure: sessionSettings.cookie?.secure,
    cookieSameSite: sessionSettings.cookie?.sameSite,
    storeType: 'PostgreSQL'
  });

  app.set("trust proxy", 1);
  
  // Session middleware debug (reduced logging for production)
  app.use((req, res, next) => {
    if (req.user) {
      console.log('✅ Authenticated session:', req.user.email);
    }
    next();
  });
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByEmail(username); // Using email as username
        
        if (!user || !user.password) {
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Login strategy error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('🔍 Deserializing user ID:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('❌ User not found during deserialization:', id);
        // User doesn't exist - clear the session
        return done(null, false);
      }
      console.log('✅ User deserialized successfully:', user.email);
      done(null, user);
    } catch (error) {
      console.error('User deserialization error for ID:', id, error);
      // Clear invalid session
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        const errorResponse: any = { message: "Email and password are required" };
        if (process.env.NODE_ENV === 'development') {
          errorResponse.details = {
            missing: [],
            hint: "Both email and password are required for registration"
          };
          if (!email) errorResponse.details.missing.push('email');
          if (!password) errorResponse.details.missing.push('password');
        }
        return res.status(400).json(errorResponse);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const errorResponse: any = { message: "Invalid email format" };
        if (process.env.NODE_ENV === 'development') {
          errorResponse.details = {
            email,
            hint: "Email must be in format: user@domain.com"
          };
        }
        return res.status(400).json(errorResponse);
      }

      // Validate password length
      if (password.length < 6) {
        const errorResponse: any = { message: "Password must be at least 6 characters long" };
        if (process.env.NODE_ENV === 'development') {
          errorResponse.details = {
            passwordLength: password.length,
            minimumRequired: 6,
            hint: "Choose a stronger password with at least 6 characters"
          };
        }
        return res.status(400).json(errorResponse);
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        const errorResponse: any = { message: "An account with this email already exists" };
        if (process.env.NODE_ENV === 'development') {
          errorResponse.details = {
            email,
            hint: "Try logging in instead or use a different email address",
            userCreatedAt: existingUser.createdAt
          };
        }
        return res.status(409).json(errorResponse);
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
      });

      // Send welcome email
      sendWelcomeEmail(email, firstName).catch(err => 
        console.error('Failed to send welcome email:', err)
      );

      // Create CRM contact asynchronously
      crmService.createContact({
        email,
        firstName: firstName || 'Unknown',
        lastName: lastName || 'User',
        subscriptionStatus: 'free',
        source: 'website_registration',
        lifecycleStage: 'lead',
        customProperties: {
          registrationDate: new Date().toISOString()
        }
      }).catch(err => 
        console.error('Failed to create CRM contact:', err)
      );

      req.login(user, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          const errorResponse: any = { message: "Registration successful but login failed" };
          if (process.env.NODE_ENV === 'development') {
            errorResponse.details = {
              error: err.message || err.toString(),
              hint: "User was created but session could not be established. Try logging in manually."
            };
          }
          return res.status(500).json(errorResponse);
        }
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorResponse: any = { message: "Registration failed" };
      if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
          error: error.message || error.toString(),
          type: error.name || 'UnknownError',
          stack: error.stack,
          hint: "Check server logs for more details"
        };
      }
      res.status(500).json(errorResponse);
    }
  });

  app.post("/api/login", (req, res, next) => {
    if (!req.body.username || !req.body.password) {
      const errorResponse: any = { message: "Email and password are required" };
      if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
          missing: [],
          hint: "Both email (as username) and password fields must be provided"
        };
        if (!req.body.username) errorResponse.details.missing.push('username/email');
        if (!req.body.password) errorResponse.details.missing.push('password');
      }
      return res.status(400).json(errorResponse);
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        const errorResponse: any = { message: "Login failed" };
        if (process.env.NODE_ENV === 'development') {
          errorResponse.details = {
            error: err.message || err.toString(),
            type: err.name || 'UnknownError',
            stack: err.stack
          };
        }
        return res.status(500).json(errorResponse);
      }
      if (!user) {
        const errorResponse: any = { message: "Invalid email or password" };
        if (process.env.NODE_ENV === 'development') {
          errorResponse.details = {
            info: info || 'Authentication failed',
            hint: 'Check if the email exists and password is correct',
            attemptedEmail: req.body.username
          };
        }
        return res.status(401).json(errorResponse);
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          const errorResponse: any = { message: "Login failed" };
          if (process.env.NODE_ENV === 'development') {
            errorResponse.details = {
              error: err.message || err.toString(),
              type: 'SessionError',
              hint: 'Failed to establish session after successful authentication'
            };
          }
          return res.status(500).json(errorResponse);
        }
        
        // Handle remember me functionality
        if (req.body.rememberMe) {
          // Extend session to 30 days when remember me is checked
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
          console.log('🔒 Extended session to 30 days for user:', user.email);
        } else {
          // Use default 7 days session
          req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          console.log('🔒 Standard 7-day session for user:', user.email);
        }
        
        // Force session save to ensure it persists
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
          } else {
            console.log('✅ Session saved successfully for user:', user.email);
            console.log('🍪 Cookie settings:', {
              maxAge: req.session.cookie.maxAge,
              secure: req.session.cookie.secure,
              httpOnly: req.session.cookie.httpOnly,
              sameSite: req.session.cookie.sameSite,
              expires: req.session.cookie.expires
            });
          }
        });
        
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Debug endpoint to check session status
  app.get("/api/debug/session", (req, res) => {
    const sessionInfo = {
      isAuthenticated: req.isAuthenticated(),
      hasSession: !!req.session,
      sessionId: req.sessionID,
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      cookie: req.session ? {
        maxAge: req.session.cookie.maxAge,
        expires: req.session.cookie.expires,
        secure: req.session.cookie.secure,
        httpOnly: req.session.cookie.httpOnly,
        sameSite: req.session.cookie.sameSite
      } : null
    };
    
    console.log('🐛 Session debug info:', sessionInfo);
    res.json(sessionInfo);
  });

  app.get("/api/user", async (req: any, res) => {
    console.log('Auth check:', {
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      sessionId: req.sessionID,
      user: req.user ? { id: req.user.id, email: req.user.email } : null
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Fetch fresh user data from database to ensure subscription status is current
      const freshUser = await storage.getUser(req.user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = freshUser;
      console.log('🔍 Fresh user data from database:', {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        subscriptionStatus: userWithoutPassword.subscriptionStatus,
        rawData: JSON.stringify(userWithoutPassword, null, 2)
      });
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
      // Fallback to session user data
      res.json(req.user);
    }
  });

  // Password reset request
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists - always return success
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      // Generate reset token
      const token = await generatePasswordResetToken(email);
      if (!token) {
        console.error('Failed to generate reset token for:', email);
        return res.status(500).json({ message: "Failed to generate reset token" });
      }

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, token, user.firstName || undefined);
      if (!emailSent) {
        console.error('Failed to send reset email to:', email);
      }

      // Always return success message for security
      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Password reset request failed" });
    }
  });

  // Password reset validation and update
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Validate token
      const tokenData = await validatePasswordResetToken(token);
      if (!tokenData) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get user by email
      const user = await storage.getUserByEmail(tokenData.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password and update user
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await markTokenAsUsed(token);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });
}

// Authentication middleware
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};