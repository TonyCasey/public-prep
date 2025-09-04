import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import validator from "validator";
import { storage } from "./storage";
import {
  analyzeCV,
  generateQuestions,
  evaluateAnswer,
  generateSampleAnswer,
} from "./services/openai";
import {
  extractTextFromFile,
  validateFileType,
  validateFileSize,
} from "./services/pdfParser";
// import { backupService } from "./services/backup"; // Disabled for now
import { extractJobTitleFromText } from "./services/jobTitleExtractor";
import {
  insertDocumentSchema,
  insertQuestionSchema,
  insertInterviewSchema,
  insertAnswerSchema,
} from "@shared/schema";
import * as schema from "@shared/schema";
import { toUUID } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  stripe,
  createCheckoutSession,
  createCustomer,
  constructWebhookEvent,
} from "./services/stripe";
import {
  generatePasswordResetToken,
  validatePasswordResetToken,
  markTokenAsUsed,
} from "./services/passwordResetService";
import {
  sendInterviewCompletionEmail,
  sendPaymentConfirmationEmail,
  sendMilestoneAchievementEmail,
  sendContactFormNotification,
  sendContactConfirmationEmail,
} from "./services/emailService";
import { crmService } from "./services/crm";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Import entity-specific routes
import documentsRouter from "./routes/documents";
import interviewsRouter from "./routes/interviews";
import questionsRouter from "./routes/questions";
import answersRouter from "./routes/answers";
import ratingsRouter from "./routes/ratings";
import usersRouter from "./routes/users";

// Subscription status helper
function getEffectiveSubscriptionStatus(user: any) {
  if (!user.subscriptionStatus || user.subscriptionStatus === 'free') {
    return { status: 'free' };
  }
  
  if (user.subscriptionStatus === 'starter') {
    // Check if starter plan has expired
    if (user.starterExpiresAt && new Date() > new Date(user.starterExpiresAt)) {
      return { 
        status: 'free', 
        expiryMessage: 'Your starter plan has expired'
      };
    }
    return { status: 'starter' };
  }
  
  return { status: user.subscriptionStatus };
}

// Environment-specific Stripe configuration
function getStripeConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      priceIds: {
        starter: process.env.STRIPE_PRICE_ID_STARTER,
        premium: process.env.STRIPE_PRICE_ID_PREMIUM,
        upgrade: process.env.STRIPE_PRICE_ID_UPGRADE,
      }
    };
  } else {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY_DEV || process.env.STRIPE_SECRET_KEY,
      priceIds: {
        starter: process.env.STRIPE_PRICE_ID_STARTER_DEV || process.env.STRIPE_PRICE_ID_STARTER,
        premium: process.env.STRIPE_PRICE_ID_PREMIUM_DEV || process.env.STRIPE_PRICE_ID_PREMIUM,
        upgrade: process.env.STRIPE_PRICE_ID_UPGRADE_DEV || process.env.STRIPE_PRICE_ID_UPGRADE,
      }
    };
  }
}

export function setupRoutes(app: Express): Server {
  // Mount entity-specific routes
  app.use("/api/documents", documentsRouter);
  app.use("/api/interviews", interviewsRouter);  
  app.use("/api/questions", questionsRouter);
  app.use("/api/answers", answersRouter);
  app.use("/api/ratings", ratingsRouter);
  app.use("/api/users", usersRouter);

  // Setup authentication
  setupAuth(app);

  // Start practice session with AI-generated questions
  app.post("/api/practice/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const {
        sessionType = "full",
        competencies = [],
        questionCount = 12,
        framework = "old",
        grade = "heo",
      } = req.body;

      // Check subscription status and usage limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscriptionInfo = getEffectiveSubscriptionStatus(user);

      // Check usage limits for starter plan
      if (subscriptionInfo.status === "starter") {
        const starterInterviewsUsed = user.starterInterviewsUsed || 0;
        if (starterInterviewsUsed >= 1) {
          return res.status(403).json({
            message: "You've used your 1 interview in the starter package. Upgrade to premium for unlimited access.",
            code: "STARTER_LIMIT_REACHED",
          });
        }
      }

      // Get CV analysis
      const cvDoc = await storage.getDocumentByType(userId, "cv");
      if (!cvDoc || !cvDoc.analysis) {
        return res.status(400).json({ message: "Please upload and analyze your CV first" });
      }

      // Get job spec if available
      const jobSpecDoc = await storage.getDocumentByType(userId, "job_spec");

      // Extract job title
      let jobTitle = "HEO Interview";
      if (jobSpecDoc) {
        const extractedTitle = extractJobTitleFromText(jobSpecDoc.content);
        if (extractedTitle) {
          jobTitle = extractedTitle;
        } else if (jobSpecDoc.filename) {
          jobTitle = jobSpecDoc.filename.replace(/\.(pdf|docx?|txt)$/i, "");
        }
      }

      // Generate questions using AI
      const questionSet = await generateQuestions(
        cvDoc.analysis as any,
        jobSpecDoc?.content,
        competencies.length > 0 ? competencies : undefined,
        questionCount,
        framework,
        grade,
      );

      // Create interview session
      const sessionData = insertInterviewSchema.parse({
        userId,
        sessionType: sessionType as any,
        competencyFocus: competencies.length > 0 ? competencies : null,
        jobTitle,
        jobGrade: grade,
        framework: framework as any,
        totalQuestions: questionSet.totalQuestions,
        currentQuestionIndex: 0,
        isActive: true,
      });

      // Deactivate any existing active interviews
      const existingInterview = await storage.getActiveInterview(userId);
      if (existingInterview) {
        await storage.updateInterview(toUUID(existingInterview.id), {
          isActive: false,
        });
      }

      const interview = await storage.createInterview(sessionData);

      // Save generated questions to database
      const savedQuestions = [];
      for (const q of questionSet.questions) {
        const questionData = insertQuestionSchema.parse({
          userId,
          competency: q.competency,
          questionText: q.questionText,
          difficulty: q.difficulty,
          interviewId: interview.id,
        });
        const saved = await storage.createQuestion(questionData);
        savedQuestions.push(saved);
      }

      // Increment starter interview counter if on starter plan
      if (subscriptionInfo.status === "starter") {
        const currentCount = user.starterInterviewsUsed || 0;
        await storage.updateUser(userId, {
          starterInterviewsUsed: currentCount + 1,
        });
      }

      // Track interview start
      if (req.user?.email) {
        crmService.trackFeatureUsage(req.user.email, {
          feature: "interview_start",
          timestamp: new Date().toISOString(),
          metadata: {
            interviewType: sessionType,
            framework,
            grade,
            questionCount: questionSet.totalQuestions,
            jobTitle,
          },
        });
      }

      res.json({
        interview,
        questions: savedQuestions,
        currentQuestion: savedQuestions[0],
        totalQuestions: questionSet.totalQuestions,
        competencyDistribution: questionSet.competencyDistribution,
      });
    } catch (error) {
      console.error("Start practice session error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to start interview"
      });
    }
  });

  // CV Analysis endpoint
  app.post("/api/cv/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get CV document
      const cvDoc = await storage.getDocumentByType(userId, "cv");
      if (!cvDoc) {
        return res.status(400).json({ message: "No CV uploaded" });
      }

      // Get job spec if available
      const jobSpecDoc = await storage.getDocumentByType(userId, "job_spec");

      // Perform AI analysis
      const analysis = await analyzeCV(cvDoc.content, jobSpecDoc?.content);

      // Update document with analysis
      await storage.updateDocument(toUUID(cvDoc.id), { analysis });

      res.json(analysis);
    } catch (error) {
      console.error("CV analysis error:", error);
      res.status(500).json({ message: "Analysis failed. Please try again." });
    }
  });

  // Stripe checkout session creation
  app.post("/api/stripe/create-checkout-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planType } = req.body;

      if (!planType || !['starter', 'premium'].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      // Get user to check current subscription
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get environment-specific Stripe configuration
      const stripeConfig = getStripeConfig();
      
      console.log('Environment debugging:', {
        NODE_ENV: process.env.NODE_ENV,
        STRIPE_SECRET_KEY_DEV: process.env.STRIPE_SECRET_KEY_DEV ? 'configured' : 'missing',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
        stripeConfig
      });
      
      // Determine price ID based on plan type and user's current subscription
      let priceId: string;
      if (planType === 'starter') {
        priceId = stripeConfig.priceIds.starter || '';
      } else if (planType === 'premium') {
        // Check if user has starter subscription for upgrade pricing
        if (user.subscriptionStatus === 'starter') {
          priceId = stripeConfig.priceIds.upgrade || '';
        } else {
          // Use premium price for full premium pricing
          priceId = stripeConfig.priceIds.premium || '';
        }
      } else {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      console.log('Price ID selection:', {
        planType,
        userSubscriptionStatus: user.subscriptionStatus,
        selectedPriceId: priceId,
        availablePriceIds: {
          starter: stripeConfig.priceIds.starter ? 'configured' : 'missing',
          premium: stripeConfig.priceIds.premium ? 'configured' : 'missing',
          upgrade: stripeConfig.priceIds.upgrade ? 'configured' : 'missing'
        }
      });

      if (!priceId) {
        console.error(`Missing price ID for plan type: ${planType}`);
        return res.status(500).json({ message: "Price configuration error" });
      }

      // Create or get Stripe customer
      // In development, always create a new customer to avoid live/test environment conflicts
      let customerId = user.stripeCustomerId;
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (!customerId || !isProduction) {
        const customer = await createCustomer(user.email, user.id);
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
        console.log(`Created new Stripe customer for ${isProduction ? 'production' : 'development'}: ${customerId}`);
      }

      // Create checkout session - Use custom domain in production
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://publicprep.ie'
        : `https://${process.env.REPLIT_DEV_DOMAIN}`;
      
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/app`;
      
      console.log('Checkout URLs:', { baseUrl, successUrl, cancelUrl });

      console.log('Creating Stripe checkout session with params:', {
        customerId,
        priceId,
        successUrl,
        cancelUrl
      });

      const session = await createCheckoutSession(customerId, priceId, successUrl, cancelUrl);

      console.log('Checkout session created successfully:', {
        sessionId: session.id,
        url: session.url,
        customerId,
        priceId,
        planType
      });

      res.json({
        url: session.url,
        sessionId: session.id
      });

    } catch (error) {
      console.error("Stripe checkout session creation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create checkout session" 
      });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const body = req.body;
      
      if (!sig) {
        console.error('No stripe signature found');
        return res.status(400).send('Missing stripe signature');
      }

      let event;
      try {
        event = await constructWebhookEvent(body, sig);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log('Stripe webhook received:', event.type);

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any;
          console.log('Payment successful for session:', session.id);
          
          // Find user by Stripe customer ID
          const customerId = session.customer;
          if (!customerId) {
            console.error('No customer ID in session');
            break;
          }

          // Get user by Stripe customer ID
          const users = await db.select().from(schema.users).where(eq(schema.users.stripeCustomerId, customerId));
          const user = users[0];
          
          if (!user) {
            console.error(`No user found for Stripe customer: ${customerId}`);
            break;
          }

          // Determine plan type based on price ID
          const stripeConfig = getStripeConfig();
          
          // Get the line items to find the price ID
          let lineItems;
          try {
            if (!stripe) {
              throw new Error('Stripe is not configured');
            }
            lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          } catch (error) {
            console.error('Error fetching line items:', error);
          }
          
          const priceId = lineItems?.data[0]?.price?.id;
          let planType: 'starter' | 'premium' = 'premium';
          let expiresAt: Date | null = null;

          console.log('Price ID determination:', {
            sessionId: session.id,
            priceId,
            starterPriceId: stripeConfig.priceIds.starter,
            premiumPriceId: stripeConfig.priceIds.premium,
            upgradePriceId: stripeConfig.priceIds.upgrade
          });

          if (priceId === stripeConfig.priceIds.starter) {
            planType = 'starter';
            expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
          } else if (priceId === stripeConfig.priceIds.upgrade) {
            planType = 'premium'; // Upgrade goes to premium
          } else if (priceId === stripeConfig.priceIds.premium) {
            planType = 'premium';
          }

          console.log(`Updating user ${user.id} subscription to ${planType}`);

          // Update user subscription status
          await db.update(schema.users)
            .set({
              subscriptionStatus: planType,
              subscriptionId: session.subscription || session.id,
              starterExpiresAt: expiresAt,
              updatedAt: new Date()
            })
            .where(eq(schema.users.id, user.id));

          // Send payment confirmation email
          try {
            await sendPaymentConfirmationEmail(user.email, user.firstName || user.email, session.amount_total / 100, planType);
          } catch (emailError) {
            console.error('Error sending payment confirmation email:', emailError);
          }

          // Update CRM with subscription status
          try {
            await crmService.trackTransaction(user.email, session.amount_total / 100, planType);
          } catch (crmError) {
            console.error('Error updating CRM with transaction:', crmError);
          }

          console.log(`Successfully updated user ${user.id} to ${planType} plan`);
          
          // Note: Frontend user cache will be refreshed on next API call since
          // the user session data comes from database and we just updated it
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Webhook processing failed" 
      });
    }
  });

  // Sample answer evaluation endpoint (public - no auth required)
  app.post("/api/sample/evaluate", async (req, res) => {
    try {
      const { answerText, questionText } = req.body;
      
      if (!answerText || !questionText) {
        return res.status(400).json({ message: "Answer text and question text are required" });
      }

      // Use the evaluateAnswer function from openai service
      const { evaluateAnswer } = await import("./services/openai.js");
      
      const evaluation = await evaluateAnswer(
        questionText,
        answerText,
        "Team Leadership", // Default competency for sample evaluation
        undefined // No CV content for sample
      );

      res.json(evaluation);
    } catch (error) {
      console.error("Sample evaluation error:", error);
      
      // Check if it's an OpenAI overloaded error
      const errorMessage = error instanceof Error ? error.message : "Evaluation failed";
      if (errorMessage.includes("Overloaded") || errorMessage.includes("529")) {
        return res.status(503).json({ 
          message: "OpenAI seems to be busy at the moment. Please try again in a few minutes.",
          userFriendly: true
        });
      }
      
      res.status(500).json({ 
        message: errorMessage
      });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Validate email format
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      // Basic length validation
      if (name.length > 100 || subject.length > 200 || message.length > 2000) {
        return res.status(400).json({ message: "Input too long" });
      }
      
      console.log('Contact form submission:', { name, email, subject, message: message.substring(0, 100) + '...' });
      
      // Send notification email to support team
      const supportEmailSent = await sendContactFormNotification({
        name,
        email,
        subject,
        message
      });
      
      // Send confirmation email to the person who submitted the form
      const confirmationEmailSent = await sendContactConfirmationEmail(email, name);
      
      console.log('Contact form emails sent:', { 
        supportNotification: supportEmailSent, 
        userConfirmation: confirmationEmailSent 
      });
      
      // Track contact form submission in CRM
      try {
        await crmService.trackFeatureUsage(email, { 
          feature: 'contact_form_submission',
          timestamp: new Date().toISOString(),
          metadata: {
            subject,
            hasAccount: false, // Contact form is public, so assume no account
            emailsSent: { supportNotification: supportEmailSent, userConfirmation: confirmationEmailSent }
          }
        });
      } catch (crmError) {
        console.error('Error tracking contact form submission:', crmError);
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for your message. We'll get back to you soon!" 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ 
        message: "Sorry, there was an error sending your message. Please try again." 
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const server = createServer(app);
  return server;
}