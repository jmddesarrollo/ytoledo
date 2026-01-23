-- Migration: Add file tracking fields to routes table
-- Date: 2026-01-23
-- Description: Adds file_track and filename_track fields to support file attachments on routes

USE `y-toledo`;

-- Add file tracking fields to routes table
ALTER TABLE `routes` 
ADD COLUMN `file_track` VARCHAR(255) DEFAULT '' COMMENT 'Unique identifier for attached file',
ADD COLUMN `filename_track` VARCHAR(255) DEFAULT '' COMMENT 'Original filename with extension for download';

-- Update existing records to have empty strings (already default, but explicit)
UPDATE `routes` SET `file_track` = '', `filename_track` = '' WHERE `file_track` IS NULL OR `filename_track` IS NULL;