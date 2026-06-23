-- Migration: Security hardening user fields
-- Date: 2026-06-20
-- Description: Expands login attempts counter and adds recovery token tracking fields

USE `y-toledo`;

-- Expand attempts to support values greater than 9.
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'attempts'
);

SET @sql = IF(
    @column_exists > 0,
    'ALTER TABLE `users` MODIFY COLUMN `attempts` INTEGER(11) NOT NULL DEFAULT 0',
    'SELECT ''Column users.attempts does not exist; skipping'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add recovery_token_hash if it does not exist.
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'recovery_token_hash'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE `users` ADD COLUMN `recovery_token_hash` VARCHAR(64) NULL AFTER `attempts`',
    'SELECT ''Column users.recovery_token_hash already exists; skipping'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add recovery_token_created_at if it does not exist.
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'recovery_token_created_at'
);

SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE `users` ADD COLUMN `recovery_token_created_at` DATETIME NULL AFTER `recovery_token_hash`',
    'SELECT ''Column users.recovery_token_created_at already exists; skipping'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
