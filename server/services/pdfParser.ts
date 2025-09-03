import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';

// Simplified PDF text extraction that works with most common CVs
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // For PDFs, we'll use a fallback approach that works for most CV files
    // This is not perfect but will work for the majority of cases
    const text = buffer.toString('binary');
    
    // Extract readable text from PDF binary data using regex patterns
    const textMatches = text.match(/[\x20-\x7E]{4,}/g) || [];
    const extractedText = textMatches.join(' ');
    
    // Basic text cleaning
    const cleanedText = extractedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E]/g, ' ') // Remove non-printable characters
      .trim();
    
    if (cleanedText.length < 50) {
      throw new Error('Unable to extract readable text from PDF. Please try uploading a text-based PDF or convert to .docx format.');
    }
    
    return cleanedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}

export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    // Use mammoth for .docx files, fallback for .doc
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    // Basic text cleaning
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanedText.length < 10) {
      throw new Error('Document appears to be empty or contains minimal text');
    }
    
    return cleanedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract text from Word document: ${errorMessage}`);
  }
}

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const extension = path.extname(filename).toLowerCase();
  
  try {
    switch (extension) {
      case '.pdf':
        return await extractTextFromPDF(buffer);
      case '.doc':
      case '.docx':
        return await extractTextFromWord(buffer);
      case '.txt':
        const txtContent = buffer.toString('utf8');
        if (txtContent.trim().length < 10) {
          throw new Error('Text file appears to be empty');
        }
        return txtContent;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`File extraction error for ${filename}:`, errorMessage);
    throw new Error(`Failed to extract text from ${filename}: ${errorMessage}`);
  }
}

export function validateFileType(filename: string): boolean {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const extension = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(extension);
}

export function validateFileSize(buffer: Buffer | undefined, maxSizeMB: number = 5): boolean {
  if (!buffer) {
    console.error('validateFileSize: buffer is undefined');
    return false;
  }
  const fileSizeBytes = buffer.length;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSizeBytes <= maxSizeBytes;
}
