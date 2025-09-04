// Document API Routes
import express from "express";
import multer from "multer";
import { isAuthenticated } from "../auth";
import { storage } from "../index";
import { insertDocumentSchema, DocumentType } from "@shared/schema";
import { extractTextFromFile, validateFileType, validateFileSize } from "../services/pdfParser";
import { UUID } from "@shared/schema";
import { validate as isValidUUID } from 'uuid';

const router = express.Router();
// Configure multer for file uploads with memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as Buffer
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// GET /api/documents - Get all documents for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const documents = await storage.getDocumentsByUserId(userId);
    res.json(documents);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/documents/analysis - Get CV analysis results (must come before /:id)
router.get("/analysis", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const documents = await storage.getDocumentsByUserId(userId);
    const cvDocument = documents.find(doc => doc.type === "cv");
    
    if (!cvDocument) {
      return res.status(404).json({ message: "No CV document found" });
    }
    
    if (!cvDocument.analysis) {
      return res.status(404).json({ message: "CV not analyzed yet" });
    }
    
    res.json(cvDocument.analysis);
  } catch (error) {
    console.error("Get CV analysis error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /api/documents/:id - Get specific document
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const documentId = id;
    
    // Validate UUID format - all IDs must be UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      return res.status(400).json({ message: "Invalid document ID format - must be UUID" });
    }
    
    // Get document and verify ownership
    const documents = await storage.getDocumentsByUserId(userId);
    const document = documents.find(doc => doc.id === documentId);
    
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    res.json(document);
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// POST /api/documents - Upload new document
router.post("/", isAuthenticated, upload.single("file"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type, filename } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    if (!type || !["cv", "job_spec"].includes(type)) {
      return res.status(400).json({ message: "Invalid document type" });
    }
    
    // Validate file type and size
    if (!validateFileType(file.originalname)) {
      return res.status(400).json({
        message: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files."
      });
    }

    console.log("File info:", {
      originalname: file.originalname,
      size: file.size,
      hasBuffer: !!file.buffer,
      bufferLength: file.buffer?.length
    });

    if (!validateFileSize(file.buffer)) {
      return res.status(400).json({ message: "File size exceeds 5MB limit" });
    }

    console.log("Starting text extraction for:", file.originalname);

    // Extract text content from uploaded file
    const content = await extractTextFromFile(file.buffer, file.originalname);
    
    console.log("Text extraction successful. Content length:", content.length);
    
    const documentData = insertDocumentSchema.parse({
      userId,
      type: type as DocumentType,
      filename: filename || file.originalname,
      content,
      fileSize: file.size,
      analysis: null
    });
    
    const document = await storage.createDocument(documentData);
    res.status(201).json(document);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// PATCH /api/documents/:id - Update document
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const documentId = id;
    
    // Validate UUID format - all IDs must be UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      return res.status(400).json({ message: "Invalid document ID format - must be UUID" });
    }
    
    // Verify document belongs to authenticated user
    const documents = await storage.getDocumentsByUserId(userId);
    const document = documents.find(doc => doc.id === documentId);
    
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    const updatedDocument = await storage.updateDocument(documentId, req.body);
    res.json(updatedDocument);
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const documentId = id;
    
    console.log("Document deletion attempt:", { documentId, userId });
    
    // Validate UUID format - all IDs must be UUIDs
    if (!isValidUUID(documentId)) {
      console.log("Invalid document ID format:", documentId);
      return res.status(400).json({ message: "Invalid document ID format - must be UUID" });
    }
    
    // Verify document belongs to authenticated user
    const documents = await storage.getDocumentsByUserId(userId);
    console.log("User documents found:", documents.map(d => ({ id: d.id, filename: d.filename })));
    
    const document = documents.find(doc => doc.id === documentId);
    console.log("Document to delete:", document);
    
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    const deleted = await storage.deleteDocument(document.id as UUID);
    console.log("Document deletion result:", deleted);
    
    if (deleted) {
      res.json({ message: "Document deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete document" });
    }
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;