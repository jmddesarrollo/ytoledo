-- Migration: Remove distance_m column from routes table
-- Date: 2026-01-26
-- Description: Remove the distance_m field from routes table as requested by user
--              Keep only distance_km field for distance measurements

-- Drop the distance_m column from routes table
ALTER TABLE `routes` DROP COLUMN `distance_m`;