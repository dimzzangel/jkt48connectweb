-- Create table for storing stream codes mapping
CREATE TABLE public.stream_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  stream_data jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.stream_codes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active stream codes
CREATE POLICY "Everyone can view active stream codes"
ON public.stream_codes
FOR SELECT
USING (is_active = true AND expires_at > now());

-- System can insert stream codes
CREATE POLICY "System can insert stream codes"
ON public.stream_codes
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookup
CREATE INDEX idx_stream_codes_code ON public.stream_codes(code) WHERE is_active = true;

-- Create table for live comments
CREATE TABLE public.live_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_code text NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view live comments
CREATE POLICY "Everyone can view live comments"
ON public.live_comments
FOR SELECT
USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
ON public.live_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.live_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookup by stream
CREATE INDEX idx_live_comments_stream_code ON public.live_comments(stream_code, created_at DESC);

-- Enable realtime for live comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_comments;