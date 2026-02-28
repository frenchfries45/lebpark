-- Create a secure function to look up email by username
-- This is needed because the user is not authenticated when signing in
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE username = lower(lookup_username) LIMIT 1;
$$;