
-- Add email column to profiles for username-based login lookup
ALTER TABLE public.profiles ADD COLUMN email text;

-- Update the handle_new_user trigger to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Update existing admin profile with email
UPDATE public.profiles 
SET email = 'admin@parkleb.com' 
WHERE user_id = '5b287c14-676a-4c0e-984b-4425c631a88d';
