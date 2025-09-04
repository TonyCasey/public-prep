import { describe, it, expect } from 'vitest'
import { validateFileType, validateFileSize } from '../../backend/server/services/pdfParser'

describe('PDF Parser Service', () => {
  describe('validateFileType', () => {
    it('accepts valid PDF files', () => {
      expect(validateFileType('document.pdf')).toBe(true)
      expect(validateFileType('CV.PDF')).toBe(true)
    })

    it('accepts valid Word files', () => {
      expect(validateFileType('document.docx')).toBe(true)
      expect(validateFileType('resume.doc')).toBe(true)
      expect(validateFileType('CV.DOCX')).toBe(true)
    })

    it('accepts valid text files', () => {
      expect(validateFileType('document.txt')).toBe(true)
      expect(validateFileType('notes.TXT')).toBe(true)
    })

    it('rejects invalid file types', () => {
      expect(validateFileType('image.jpg')).toBe(false)
      expect(validateFileType('video.mp4')).toBe(false)
      expect(validateFileType('archive.zip')).toBe(false)
      expect(validateFileType('document.html')).toBe(false)
    })

    it('handles files without extensions', () => {
      expect(validateFileType('document')).toBe(false)
      expect(validateFileType('')).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('accepts files under the size limit', () => {
      const smallBuffer = Buffer.alloc(1024 * 1024) // 1MB
      expect(validateFileSize(smallBuffer, 5)).toBe(true)
    })

    it('rejects files over the size limit', () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
      expect(validateFileSize(largeBuffer, 5)).toBe(false)
    })

    it('accepts files exactly at the size limit', () => {
      const exactBuffer = Buffer.alloc(5 * 1024 * 1024) // Exactly 5MB
      expect(validateFileSize(exactBuffer, 5)).toBe(true)
    })

    it('uses default 5MB limit when not specified', () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
      expect(validateFileSize(largeBuffer)).toBe(false)
    })
  })
})