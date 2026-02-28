-- Add backend_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'backend_admin';

-- Create pending_messages table
CREATE TABLE public.pending_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  subscriber_name TEXT NOT NULL,
  subscriber_phone TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  message TEXT NOT NULL,
  requested_by_username TEXT NOT NULL,
  requested_by_user_id UUID NOT NULL,
  is_bulk BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_username TEXT
);

-- Enable RLS
ALTER TABLE public.pending_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert pending messages"
  ON public.pending_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can read all pending messages
CREATE POLICY "Authenticated users can read pending messages"
  ON public.pending_messages FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can update (mark as sent)
CREATE POLICY "Authenticated users can update pending messages"
  ON public.pending_messages FOR UPDATE
  TO authenticated
  USING (true);
