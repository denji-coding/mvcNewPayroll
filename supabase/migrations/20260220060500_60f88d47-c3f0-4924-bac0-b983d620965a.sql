
-- Function to auto-assign leave credits when a new employee is created
CREATE OR REPLACE FUNCTION public.assign_leave_credits_to_employee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lt RECORD;
  current_yr integer;
  leave_type_map RECORD;
  enum_val text;
BEGIN
  current_yr := EXTRACT(YEAR FROM now());
  
  -- For each active leave type, create leave credits
  FOR lt IN SELECT name, default_credits FROM leave_types WHERE is_active = true
  LOOP
    -- Map leave type name to enum value
    enum_val := CASE lt.name
      WHEN 'Sick Leave' THEN 'sick'
      WHEN 'Vacation Leave' THEN 'vacation'
      WHEN 'Emergency Leave' THEN 'emergency'
      WHEN 'Maternity/Paternity Leave' THEN 'maternity'
      WHEN 'Paternity Leave' THEN 'paternity'
      WHEN 'Bereavement Leave' THEN 'bereavement'
      WHEN 'Unpaid Leave' THEN 'unpaid'
      ELSE 'sick'
    END;
    
    -- Insert leave credits if not already existing
    INSERT INTO leave_credits (employee_id, leave_type, year, total_credits, used_credits)
    VALUES (NEW.id, enum_val::leave_type, current_yr, lt.default_credits, 0)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on employees table
DROP TRIGGER IF EXISTS on_employee_created_assign_leave ON public.employees;
CREATE TRIGGER on_employee_created_assign_leave
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_leave_credits_to_employee();
