-- Create function to notify employees on new announcement
CREATE OR REPLACE FUNCTION notify_employees_on_announcement()
RETURNS TRIGGER AS $$
DECLARE
  emp RECORD;
BEGIN
  -- Only trigger on published announcements
  IF NEW.is_published = true THEN
    -- Get all active employees with user_id
    FOR emp IN 
      SELECT DISTINCT e.user_id 
      FROM employees e
      WHERE e.employment_status = 'active'
        AND e.user_id IS NOT NULL
        AND (NEW.branch_id IS NULL OR e.branch_id = NEW.branch_id)
    LOOP
      INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        emp.user_id,
        'announcement',
        'New Announcement: ' || NEW.title,
        LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
        NEW.id,
        'announcement'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_announcement_published ON announcements;

-- Create trigger for new announcements that are published immediately
CREATE TRIGGER on_announcement_published
  AFTER INSERT ON announcements
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION notify_employees_on_announcement();

-- Create trigger for announcements that get published after creation
DROP TRIGGER IF EXISTS on_announcement_publish_update ON announcements;

CREATE TRIGGER on_announcement_publish_update
  AFTER UPDATE OF is_published ON announcements
  FOR EACH ROW
  WHEN (OLD.is_published = false AND NEW.is_published = true)
  EXECUTE FUNCTION notify_employees_on_announcement();