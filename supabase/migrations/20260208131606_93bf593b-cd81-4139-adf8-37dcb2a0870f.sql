
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Create index for fast username lookups
CREATE INDEX idx_profiles_username ON public.profiles (username);

-- Allow anyone authenticated to look up profiles by username (already covered by existing SELECT policy)
