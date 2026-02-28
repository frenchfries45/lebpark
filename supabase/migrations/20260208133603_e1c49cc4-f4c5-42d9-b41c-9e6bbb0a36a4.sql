
-- Create activity_logs table to track user actions (payments, etc.)
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type text NOT NULL,
  performed_by_user_id uuid NOT NULL,
  performed_by_username text NOT NULL,
  subscriber_id uuid REFERENCES public.subscribers(id) ON DELETE SET NULL,
  subscriber_name text NOT NULL,
  amount numeric,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view logs
CREATE POLICY "Authenticated users can view activity logs"
ON public.activity_logs
FOR SELECT
USING (true);

-- All authenticated users can insert logs
CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Only admins can delete logs
CREATE POLICY "Admins can delete activity logs"
ON public.activity_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster weekly queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
