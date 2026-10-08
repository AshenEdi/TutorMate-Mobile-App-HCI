-- ============================================================================
-- TUTORMATE: Real-Time Chat System Tables, Permissions & RLS Policies
-- Comprehensive Support: Text, Images, Documents & Voice Messages
-- ============================================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_chat_thread UNIQUE (student_id, tutor_id)
);

-- Ensure admin_id column exists if table was already created
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create messages table with attachment & voice message support
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_mime_type TEXT,
    attachment_size BIGINT,
    audio_duration INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Safely add columns if messages table already exists
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_size BIGINT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Safe check constraint for message_type (text, image, file, audio)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_message_type'
    ) THEN
        ALTER TABLE public.messages DROP CONSTRAINT check_message_type;
    END IF;
    ALTER TABLE public.messages 
    ADD CONSTRAINT check_message_type 
    CHECK (message_type IN ('text', 'image', 'file', 'audio'));
END $$;

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tutor_id ON public.conversations(tutor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for conversations (Supports Student, Tutor, Admin)
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations"
    ON public.conversations FOR SELECT
    USING (
        auth.uid() = student_id 
        OR auth.uid() = tutor_id 
        OR auth.uid() = admin_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
CREATE POLICY "Participants can insert conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        auth.uid() = student_id 
        OR auth.uid() = tutor_id 
        OR auth.uid() = admin_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Participants can update their conversations" ON public.conversations;
CREATE POLICY "Participants can update their conversations"
    ON public.conversations FOR UPDATE
    USING (
        auth.uid() = student_id 
        OR auth.uid() = tutor_id 
        OR auth.uid() = admin_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. RLS Policies for messages (Supports Student, Tutor, Admin)
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND (
                conversations.student_id = auth.uid() 
                OR conversations.tutor_id = auth.uid()
                OR conversations.admin_id = auth.uid()
                OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND (
                conversations.student_id = auth.uid() 
                OR conversations.tutor_id = auth.uid()
                OR conversations.admin_id = auth.uid()
                OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
CREATE POLICY "Participants can update messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND (
                conversations.student_id = auth.uid() 
                OR conversations.tutor_id = auth.uid()
                OR conversations.admin_id = auth.uid()
                OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

-- 7. Grant required privileges to postgres roles
GRANT ALL ON TABLE public.conversations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;

-- 8. Database trigger for last_message and updated_at (with Text, Image, File & Voice Message preview support)
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = CASE
        WHEN NEW.message_type = 'image' THEN '📷 Image'
        WHEN NEW.message_type = 'file' THEN COALESCE('📎 ' || NEW.attachment_name, '📎 File')
        WHEN NEW.message_type = 'audio' THEN '🎤 Voice message'
        ELSE COALESCE(NULLIF(TRIM(NEW.content), ''), 'New message')
    END,
    updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message ON public.messages;
CREATE TRIGGER trigger_update_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- 9. Storage Bucket setup & policies for chat-attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old/conflicting storage policies
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow chat attachment uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow chat attachment reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow chat attachment updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow chat attachment deletes" ON storage.objects;

-- Storage Upload Policy: Allow uploads to chat-attachments
CREATE POLICY "Allow chat attachment uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'chat-attachments');

-- Storage Read Policy: Allow public/authenticated reads from chat-attachments
CREATE POLICY "Allow chat attachment reads"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'chat-attachments');

-- Storage Update Policy: Allow updates on chat-attachments
CREATE POLICY "Allow chat attachment updates"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'chat-attachments');

-- Storage Delete Policy: Allow deletes on chat-attachments
CREATE POLICY "Allow chat attachment deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments');

-- 10. Enable Realtime for messages table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
