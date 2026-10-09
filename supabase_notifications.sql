-- ====================================================================
-- NOTIFICATIONS SCHEMA
-- ====================================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT, -- e.g., 'tutor', 'student', 'admin'
    type TEXT NOT NULL, -- e.g., 'session', 'message', 'wallet', 'booking', 'material', 'review', 'dispute'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    highlight_text TEXT, 
    is_unread BOOLEAN DEFAULT TRUE NOT NULL,
    category TEXT, -- e.g., 'Sessions', 'Messages', 'Reminders'
    reference_id UUID, -- Links to a specific booking, message, or dispute ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries when filtering by user and unread status
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (e.g., to mark as read)
CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy: System can insert notifications
CREATE POLICY "Users can insert their own notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() = user_id);


-- ====================================================================
-- USER PUSH TOKENS SCHEMA
-- ====================================================================

-- 2. Create user_push_tokens table (for Expo Push Notifications)
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    platform TEXT, -- 'ios' or 'android'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fetching a user's tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.user_push_tokens(user_id);

-- Enable RLS for user_push_tokens
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view their own tokens" 
    ON public.user_push_tokens FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
    ON public.user_push_tokens FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens (e.g., on logout)
CREATE POLICY "Users can delete their own tokens" 
    ON public.user_push_tokens FOR DELETE 
    USING (auth.uid() = user_id);
