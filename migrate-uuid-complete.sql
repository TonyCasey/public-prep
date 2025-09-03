-- Complete UUID Migration Script
-- This script migrates all remaining integer IDs to UUIDs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Backup current data before migration
CREATE TABLE backup_user_progress AS SELECT * FROM user_progress;
CREATE TABLE backup_backups AS SELECT * FROM backups;
CREATE TABLE backup_password_reset_tokens AS SELECT * FROM password_reset_tokens;

-- Create new temporary UUID tables
CREATE TABLE user_progress_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR,
  competency TEXT NOT NULL,
  average_score INTEGER NOT NULL,
  total_questions INTEGER DEFAULT 0,
  improvement_rate INTEGER DEFAULT 0,
  last_practiced TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE backups_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR,
  backup_data JSONB NOT NULL,
  backup_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_reset_tokens_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Copy data to new tables
INSERT INTO user_progress_new (user_id, competency, average_score, total_questions, improvement_rate, last_practiced, updated_at)
SELECT user_id, competency, average_score, total_questions, improvement_rate, last_practiced, updated_at
FROM user_progress;

INSERT INTO backups_new (user_id, backup_data, backup_type, created_at)
SELECT user_id, backup_data, backup_type, created_at
FROM backups;

INSERT INTO password_reset_tokens_new (token, email, expires_at, used, used_at, created_at)
SELECT token, email, expires_at, used, used_at, created_at
FROM password_reset_tokens;

-- Drop old tables and rename new ones
DROP TABLE user_progress CASCADE;
DROP TABLE backups CASCADE;  
DROP TABLE password_reset_tokens CASCADE;

ALTER TABLE user_progress_new RENAME TO user_progress;
ALTER TABLE backups_new RENAME TO backups;
ALTER TABLE password_reset_tokens_new RENAME TO password_reset_tokens;

-- Add foreign key constraints back
ALTER TABLE user_progress ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE backups ADD CONSTRAINT backups_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Clean up backup tables after successful migration
-- DROP TABLE backup_user_progress;
-- DROP TABLE backup_backups;
-- DROP TABLE backup_password_reset_tokens;

-- Verify migration
SELECT 'user_progress' as table_name, count(*) as records FROM user_progress
UNION ALL
SELECT 'backups' as table_name, count(*) as records FROM backups  
UNION ALL
SELECT 'password_reset_tokens' as table_name, count(*) as records FROM password_reset_tokens;