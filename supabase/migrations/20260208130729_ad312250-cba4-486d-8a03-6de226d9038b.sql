
-- Drop the admin-only insert policy
DROP POLICY "Admins can insert subscribers" ON public.subscribers;

-- Create a new policy allowing all authenticated users to insert subscribers
CREATE POLICY "Authenticated users can insert subscribers"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (true);
