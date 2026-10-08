-- ====================================================================
-- NOTIFICATION TRIGGERS
-- Automates inserting rows into the notifications table
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TRIGGER: New Bookings
-- Alerts the tutor when a student requests a session.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_tutor_on_new_booking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (
        user_id,
        role,
        type,
        title,
        description,
        category,
        reference_id
    ) VALUES (
        NEW.tutor_id,
        'tutor',
        'booking',
        'New Booking Request',
        'You have a new session request from ' || COALESCE(NEW.student_name, 'a student') || ' for ' || NEW.subject || '.',
        'Sessions',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_booking_notification ON public.bookings;
CREATE TRIGGER trigger_new_booking_notification
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_tutor_on_new_booking();


-- --------------------------------------------------------------------
-- 2. TRIGGER: Booking Status Updates
-- Alerts the student when the tutor confirms or declines a booking.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_student_on_booking_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if the status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- If accepted/confirmed
        IF NEW.status = 'confirmed' OR NEW.status = 'accepted' THEN
            INSERT INTO public.notifications (user_id, role, type, title, description, category, reference_id) 
            VALUES (NEW.student_id, 'student', 'booking', 'Booking Confirmed', COALESCE(NEW.tutor_name, 'Your tutor') || ' confirmed your ' || NEW.subject || ' session.', 'Sessions', NEW.id);
        
        -- If declined
        ELSIF NEW.status = 'declined' THEN
            INSERT INTO public.notifications (user_id, role, type, title, description, category, reference_id) 
            VALUES (NEW.student_id, 'student', 'booking', 'Booking Declined', COALESCE(NEW.tutor_name, 'Your tutor') || ' had to decline your ' || NEW.subject || ' session.', 'Sessions', NEW.id);
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_booking_update_notification ON public.bookings;
CREATE TRIGGER trigger_booking_update_notification
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_on_booking_update();


-- --------------------------------------------------------------------
-- 3. TRIGGER: New Chat Messages
-- Alerts the recipient (tutor or student) when a new message is sent.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_recipient_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    conv RECORD;
    recipient_id UUID;
    recipient_role TEXT;
    preview_text TEXT;
BEGIN
    -- 1. Find the conversation to determine who the recipient is
    SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- 2. Determine Recipient
    IF NEW.sender_id = conv.student_id THEN
        recipient_id := conv.tutor_id;
        recipient_role := 'tutor';
    ELSIF NEW.sender_id = conv.tutor_id THEN
        recipient_id := conv.student_id;
        recipient_role := 'student';
    ELSE
        -- Admin or system message, skip notification for now
        RETURN NEW;
    END IF;

    -- 3. Generate preview text
    IF NEW.message_type = 'text' THEN
        preview_text := NEW.content;
    ELSIF NEW.message_type = 'image' THEN
        preview_text := '📷 Sent an image';
    ELSIF NEW.message_type = 'audio' THEN
        preview_text := '🎤 Sent a voice message';
    ELSIF NEW.message_type = 'file' THEN
        preview_text := '📎 Sent an attachment';
    ELSE
        preview_text := 'Sent a new message';
    END IF;

    -- 4. Insert Notification
    INSERT INTO public.notifications (
        user_id,
        role,
        type,
        title,
        description,
        category,
        reference_id
    ) VALUES (
        recipient_id,
        recipient_role,
        'message',
        'New Message',
        preview_text,
        'Messages',
        NEW.conversation_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_message_notification ON public.messages;
CREATE TRIGGER trigger_new_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_recipient_on_new_message();

