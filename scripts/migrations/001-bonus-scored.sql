-- Add scored column to bonus_results
-- When false: correct answer is shown on extras page but points are NOT counted in ranking
-- When true: points are counted in ranking
-- Run on both dev and prod databases

ALTER TABLE bonus_results ADD COLUMN IF NOT EXISTS scored BOOLEAN NOT NULL DEFAULT false;
