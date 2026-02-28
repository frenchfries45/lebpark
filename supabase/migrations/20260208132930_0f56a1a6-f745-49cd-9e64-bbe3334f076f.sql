-- Table for pre-approved usernames that admins add manually
CREATE TABLE public.allowed_usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_usernames ENABLE ROW LEVEL SECURITY;

-- Only admins can manage allowed usernames
CREATE POLICY "Admins can view allowed usernames"
  ON public.allowed_usernames FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert allowed usernames"
  ON public.allowed_usernames FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete allowed usernames"
  ON public.allowed_usernames FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Secure function to check if a username is pre-approved (works without auth)
CREATE OR REPLACE FUNCTION public.is_username_allowed(lookup_username text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_usernames WHERE username = lower(lookup_username)
  );
$$;

-- Secure function to remove a username from allowed list after sign-up
CREATE OR REPLACE FUNCTION public.claim_allowed_username(claimed_username text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.allowed_usernames WHERE username = lower(claimed_username);
$$;