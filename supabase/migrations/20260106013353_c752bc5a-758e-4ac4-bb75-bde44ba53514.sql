-- Add 'attendance' to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'attendance';

-- Create trigger function for leave request notifications to HR admins
CREATE OR REPLACE FUNCTION notify_hr_on_leave_request()
RETURNS TRIGGER AS $$
DECLARE
  hr_user RECORD;
  emp_name TEXT;
BEGIN
  -- Get employee name
  SELECT first_name || ' ' || last_name INTO emp_name
  FROM employees WHERE id = NEW.employee_id;
  
  -- Insert notification for each HR admin
  FOR hr_user IN 
    SELECT user_id FROM user_roles WHERE role = 'hr_admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      hr_user.user_id,
      'leave_request',
      'New Leave Request',
      emp_name || ' has submitted a ' || NEW.leave_type || ' leave request',
      NEW.id,
      'leave_request'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new leave requests
CREATE TRIGGER on_leave_request_created
AFTER INSERT ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION notify_hr_on_leave_request();

-- Create trigger function for leave status updates to employees
CREATE OR REPLACE FUNCTION notify_employee_on_leave_update()
RETURNS TRIGGER AS $$
DECLARE
  emp_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  notif_type notification_type;
BEGIN
  -- Only trigger on status changes to hr_approved or rejected
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get the employee's user_id
  SELECT user_id INTO emp_user_id
  FROM employees WHERE id = NEW.employee_id;
  
  -- Only proceed if employee has a linked user account
  IF emp_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Set notification details based on status
  IF NEW.status = 'hr_approved' THEN
    notif_type := 'leave_approved';
    notification_title := 'Leave Request Approved';
    notification_message := 'Your ' || NEW.leave_type || ' leave request has been approved';
  ELSIF NEW.status = 'rejected' THEN
    notif_type := 'leave_rejected';
    notification_title := 'Leave Request Rejected';
    notification_message := 'Your ' || NEW.leave_type || ' leave request has been rejected';
  ELSE
    RETURN NEW;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (emp_user_id, notif_type, notification_title, notification_message, NEW.id, 'leave_request');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for leave status updates
CREATE TRIGGER on_leave_status_updated
AFTER UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION notify_employee_on_leave_update();

-- Create trigger function for payroll approved notifications
CREATE OR REPLACE FUNCTION notify_employees_on_payroll_approved()
RETURNS TRIGGER AS $$
DECLARE
  emp_record RECORD;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF OLD.status = NEW.status OR NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Notify each employee with a payroll record in this period
  FOR emp_record IN 
    SELECT e.user_id, pr.net_pay
    FROM payroll_records pr
    JOIN employees e ON e.id = pr.employee_id
    WHERE pr.payroll_period_id = NEW.id
    AND e.user_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      emp_record.user_id,
      'payroll_ready',
      'Payslip Ready',
      'Your payslip for ' || to_char(NEW.period_start, 'Mon DD') || ' - ' || to_char(NEW.period_end, 'Mon DD, YYYY') || ' is ready to view',
      NEW.id,
      'payroll_period'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payroll approval
CREATE TRIGGER on_payroll_approved
AFTER UPDATE ON payroll_periods
FOR EACH ROW
EXECUTE FUNCTION notify_employees_on_payroll_approved();

-- Create trigger function for attendance notifications
CREATE OR REPLACE FUNCTION notify_employee_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  emp_user_id UUID;
  notification_message TEXT;
BEGIN
  -- Get the employee's user_id
  SELECT user_id INTO emp_user_id
  FROM employees WHERE id = NEW.employee_id;
  
  -- Only proceed if employee has a linked user account
  IF emp_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- For INSERT (clock in)
  IF TG_OP = 'INSERT' AND NEW.time_in IS NOT NULL THEN
    notification_message := 'You clocked in at ' || to_char(NEW.time_in AT TIME ZONE 'Asia/Manila', 'HH12:MI AM');
    IF NEW.late_minutes > 0 THEN
      notification_message := notification_message || ' (' || NEW.late_minutes || ' minutes late)';
    END IF;
    
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (emp_user_id, 'attendance', 'Clock In Recorded', notification_message, NEW.id, 'attendance');
  
  -- For UPDATE (clock out)
  ELSIF TG_OP = 'UPDATE' AND OLD.time_out IS NULL AND NEW.time_out IS NOT NULL THEN
    notification_message := 'You clocked out at ' || to_char(NEW.time_out AT TIME ZONE 'Asia/Manila', 'HH12:MI AM');
    IF NEW.hours_worked IS NOT NULL THEN
      notification_message := notification_message || '. Hours worked: ' || round(NEW.hours_worked::numeric, 2);
    END IF;
    
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (emp_user_id, 'attendance', 'Clock Out Recorded', notification_message, NEW.id, 'attendance');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for attendance records
CREATE TRIGGER on_attendance_recorded
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION notify_employee_on_attendance();