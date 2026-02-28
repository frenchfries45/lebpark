
-- Add recorded_by_username column to payments table
ALTER TABLE public.payments 
ADD COLUMN recorded_by_username text;
