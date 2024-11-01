-- Notification Triggers Migration
-- Date: 2025-10-30
-- Purpose: Automatically create notifications for applications, messages, and connection requests

-- ============================================
-- 1. Function to create notification on new application
-- ============================================

CREATE OR REPLACE FUNCTION notify_job_poster_on_application()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_applicant_name TEXT;
  v_applicant_dept TEXT;
  v_applicant_year TEXT;
  v_poster_id UUID;
BEGIN
  -- Get job details
  SELECT title, posted_by INTO v_job_title, v_poster_id
  FROM jobs
  WHERE job_id = NEW.job_id;

  -- Get applicant details
  SELECT name, department, graduation_year 
  INTO v_applicant_name, v_applicant_dept, v_applicant_year
  FROM users
  WHERE user_id = NEW.applicant_id;

  -- Create notification for job poster
  INSERT INTO notifications (user_id, content, is_read)
  VALUES (
    v_poster_id,
    CONCAT(
      COALESCE(v_applicant_name, 'A student'),
      ' (',
      COALESCE(v_applicant_dept, 'Student'),
      ', ',
      COALESCE(v_applicant_year, ''),
      ') applied to your job: "',
      COALESCE(v_job_title, 'Job Posting'),
      '"'
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_on_application ON applications;

CREATE TRIGGER trigger_notify_on_application
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_poster_on_application();

-- ============================================
-- 2. Function to create notification on connection request
-- ============================================

CREATE OR REPLACE FUNCTION notify_on_connection_request()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_sender_role TEXT;
  v_sender_dept TEXT;
  v_sender_year TEXT;
BEGIN
  -- Only notify on pending status (new request)
  IF NEW.status = 'pending' THEN
    -- Get sender details
    SELECT name, role, department, graduation_year 
    INTO v_sender_name, v_sender_role, v_sender_dept, v_sender_year
    FROM users
    WHERE user_id = NEW.user_id_1;

    -- Create notification for receiver
    INSERT INTO notifications (user_id, content, is_read)
    VALUES (
      NEW.user_id_2,
      CONCAT(
        COALESCE(v_sender_name, 'Someone'),
        ' (',
        COALESCE(v_sender_role, 'User'),
        ', ',
        COALESCE(v_sender_dept, ''),
        ') sent you a connection request'
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_on_connection_request ON connections;

CREATE TRIGGER trigger_notify_on_connection_request
  AFTER INSERT ON connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_connection_request();

-- ============================================
-- 3. Function to create notification when connection is accepted
-- ============================================

CREATE OR REPLACE FUNCTION notify_on_connection_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_accepter_name TEXT;
BEGIN
  -- Only notify when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get accepter details
    SELECT name INTO v_accepter_name
    FROM users
    WHERE user_id = NEW.user_id_2;

    -- Create notification for requester
    INSERT INTO notifications (user_id, content, is_read)
    VALUES (
      NEW.user_id_1,
      CONCAT(
        COALESCE(v_accepter_name, 'Someone'),
        ' accepted your connection request'
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_on_connection_accepted ON connections;

CREATE TRIGGER trigger_notify_on_connection_accepted
  AFTER UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_connection_accepted();

-- ============================================
-- 4. Function to create notification on new message
-- ============================================

CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  -- Get sender details
  SELECT name INTO v_sender_name
  FROM users
  WHERE user_id = NEW.sender_id;

  -- Create notification for receiver
  INSERT INTO notifications (user_id, content, is_read)
  VALUES (
    NEW.receiver_id,
    CONCAT('New message from ', COALESCE(v_sender_name, 'Someone')),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_on_new_message ON messages;

CREATE TRIGGER trigger_notify_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();

-- ============================================
-- 5. Function to create notification on application status change
-- ============================================

CREATE OR REPLACE FUNCTION notify_on_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get job title
    SELECT title INTO v_job_title
    FROM jobs
    WHERE job_id = NEW.job_id;

    -- Create notification for applicant
    INSERT INTO notifications (user_id, content, is_read)
    VALUES (
      NEW.applicant_id,
      CONCAT(
        'Your application for "',
        COALESCE(v_job_title, 'Job Posting'),
        '" status was updated to: ',
        NEW.status
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notify_on_application_status_change ON applications;

CREATE TRIGGER trigger_notify_on_application_status_change
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_application_status_change();

-- ============================================
-- 6. Test the triggers (Optional - comment out in production)
-- ============================================

-- Test by inserting a sample notification manually
-- INSERT INTO notifications (user_id, content, is_read)
-- VALUES ('your-user-uuid-here', 'Test notification', false);

-- Verify notifications table
-- SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 5;

COMMIT;
