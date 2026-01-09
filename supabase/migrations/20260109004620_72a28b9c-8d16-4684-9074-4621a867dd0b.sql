-- Fix the function search_path security issue
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
      FROM public.employees e
      WHERE e.employment_status = 'active'
        AND e.user_id IS NOT NULL
        AND (NEW.branch_id IS NULL OR e.branch_id = NEW.branch_id)
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;