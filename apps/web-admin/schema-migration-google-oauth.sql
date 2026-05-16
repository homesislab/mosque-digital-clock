-- Google OAuth Database Migration
-- Run this to add Google OAuth support to the users table

-- Add Google OAuth columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE COMMENT 'Google OAuth ID';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_name VARCHAR(255) COMMENT 'User name from Google profile';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_picture VARCHAR(500) COMMENT 'Profile picture URL from Google';

-- Add timestamp if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation timestamp';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp';

-- Create index on google_id for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_id ON users(google_id);

-- Create index on email for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_email ON users(email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_created_at ON users(created_at);

-- Verify migration
SELECT 'Google OAuth migration completed successfully!' as status;
SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME IN ('google_id', 'google_name', 'google_picture', 'created_at');
