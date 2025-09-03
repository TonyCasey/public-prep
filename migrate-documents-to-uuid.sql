-- Complete Documents Table UUID Migration
-- This script converts any remaining numeric document IDs to UUIDs

-- Check current documents table structure
SELECT 'Current documents count:' as info, COUNT(*) as count FROM documents;

-- If documents table has numeric IDs, we need to recreate it with proper UUIDs
-- First, backup any existing documents
CREATE TEMP TABLE documents_backup AS SELECT * FROM documents;

-- Drop existing documents table if it has wrong ID type
DROP TABLE IF EXISTS documents CASCADE;

-- Recreate documents table with proper UUID structure
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id),
    type TEXT NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    analysis JSONB,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Restore data from backup with new UUIDs
INSERT INTO documents (user_id, type, filename, content, analysis, uploaded_at)
SELECT user_id, type, filename, content, analysis, uploaded_at
FROM documents_backup;

-- Clean up temporary table
DROP TABLE documents_backup;

SELECT 'Migration complete. New documents count:' as info, COUNT(*) as count FROM documents;