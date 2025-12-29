-- Create app_role enum for HR, Branch Manager, Employee
CREATE TYPE public.app_role AS ENUM ('hr_admin', 'branch_manager', 'employee');

-- Create employment_status enum
CREATE TYPE public.employment_status AS ENUM ('active', 'resigned', 'terminated', 'on_leave');

-- Create leave_type enum
CREATE TYPE public.leave_type AS ENUM ('vacation', 'sick', 'emergency', 'maternity', 'paternity', 'bereavement', 'unpaid');

-- Create leave_status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'manager_approved', 'hr_approved', 'rejected', 'cancelled');

-- Create payroll_status enum
CREATE TYPE public.payroll_status AS ENUM ('draft', 'processing', 'approved', 'paid');

-- Create notification_type enum
CREATE TYPE public.notification_type AS ENUM ('leave_request', 'leave_approved', 'leave_rejected', 'payroll_ready', 'announcement', 'system');

-- Branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Employees table (HR data)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL UNIQUE,
  rfid_card_number TEXT UNIQUE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  civil_status TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  position TEXT NOT NULL,
  department TEXT,
  date_hired DATE NOT NULL,
  employment_status employment_status DEFAULT 'active',
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  sss_number TEXT,
  philhealth_number TEXT,
  pagibig_number TEXT,
  tin_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branch managers assignment
CREATE TABLE public.branch_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (branch_id, user_id)
);

-- Attendance records
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  rfid_time_in TEXT,
  rfid_time_out TEXT,
  hours_worked DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  undertime_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'present',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, date)
);

-- Leave credits
CREATE TABLE public.leave_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type leave_type NOT NULL,
  year INTEGER NOT NULL,
  total_credits DECIMAL(5,2) DEFAULT 0,
  used_credits DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, leave_type, year)
);

-- Leave requests
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  manager_id UUID REFERENCES auth.users(id),
  manager_action_at TIMESTAMPTZ,
  manager_remarks TEXT,
  hr_id UUID REFERENCES auth.users(id),
  hr_action_at TIMESTAMPTZ,
  hr_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Salary components (allowances, deductions templates)
CREATE TABLE public.salary_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'deduction')),
  is_taxable BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Employee salary adjustments (custom allowances/deductions per employee)
CREATE TABLE public.employee_salary_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  component_id UUID REFERENCES public.salary_components(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payroll periods
CREATE TABLE public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status payroll_status DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payroll records (individual payslips)
CREATE TABLE public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  basic_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
  days_worked DECIMAL(5,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  night_differential DECIMAL(12,2) DEFAULT 0,
  holiday_pay DECIMAL(12,2) DEFAULT 0,
  total_allowances DECIMAL(12,2) DEFAULT 0,
  gross_pay DECIMAL(12,2) DEFAULT 0,
  sss_contribution DECIMAL(12,2) DEFAULT 0,
  philhealth_contribution DECIMAL(12,2) DEFAULT 0,
  pagibig_contribution DECIMAL(12,2) DEFAULT 0,
  withholding_tax DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) DEFAULT 0,
  allowances_breakdown JSONB DEFAULT '{}',
  deductions_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (payroll_period_id, employee_id)
);

-- Loans
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  loan_type TEXT NOT NULL,
  principal_amount DECIMAL(12,2) NOT NULL,
  monthly_amortization DECIMAL(12,2) NOT NULL,
  total_paid DECIMAL(12,2) DEFAULT 0,
  remaining_balance DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Philippine holidays (for payroll computation)
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('regular', 'special')),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's branch (for branch managers)
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.branch_managers WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get employee by user_id
CREATE OR REPLACE FUNCTION public.get_employee_by_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "HR can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "HR can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for branches
CREATE POLICY "Everyone can view branches" ON public.branches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage branches" ON public.branches
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for employees
CREATE POLICY "HR can manage all employees" ON public.employees
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Branch managers can view branch employees" ON public.employees
  FOR SELECT USING (
    public.has_role(auth.uid(), 'branch_manager') 
    AND branch_id = public.get_user_branch_id(auth.uid())
  );
CREATE POLICY "Employees can view own record" ON public.employees
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Employees can update own record" ON public.employees
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for branch_managers
CREATE POLICY "HR can manage branch managers" ON public.branch_managers
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Branch managers can view own assignment" ON public.branch_managers
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for attendance
CREATE POLICY "HR can manage all attendance" ON public.attendance
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Branch managers can view branch attendance" ON public.attendance
  FOR SELECT USING (
    public.has_role(auth.uid(), 'branch_manager') 
    AND employee_id IN (
      SELECT id FROM public.employees WHERE branch_id = public.get_user_branch_id(auth.uid())
    )
  );
CREATE POLICY "Employees can view own attendance" ON public.attendance
  FOR SELECT USING (employee_id = public.get_employee_by_user(auth.uid()));

-- RLS Policies for leave_credits
CREATE POLICY "HR can manage leave credits" ON public.leave_credits
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Employees can view own leave credits" ON public.leave_credits
  FOR SELECT USING (employee_id = public.get_employee_by_user(auth.uid()));

-- RLS Policies for leave_requests
CREATE POLICY "HR can manage all leave requests" ON public.leave_requests
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Branch managers can view/update branch leave requests" ON public.leave_requests
  FOR ALL USING (
    public.has_role(auth.uid(), 'branch_manager') 
    AND employee_id IN (
      SELECT id FROM public.employees WHERE branch_id = public.get_user_branch_id(auth.uid())
    )
  );
CREATE POLICY "Employees can manage own leave requests" ON public.leave_requests
  FOR ALL USING (employee_id = public.get_employee_by_user(auth.uid()));

-- RLS Policies for salary_components
CREATE POLICY "HR can manage salary components" ON public.salary_components
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Authenticated can view salary components" ON public.salary_components
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for employee_salary_adjustments
CREATE POLICY "HR can manage salary adjustments" ON public.employee_salary_adjustments
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Employees can view own adjustments" ON public.employee_salary_adjustments
  FOR SELECT USING (employee_id = public.get_employee_by_user(auth.uid()));

-- RLS Policies for payroll_periods
CREATE POLICY "HR can manage payroll periods" ON public.payroll_periods
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Authenticated can view payroll periods" ON public.payroll_periods
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for payroll_records
CREATE POLICY "HR can manage all payroll records" ON public.payroll_records
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Branch managers can view branch payroll" ON public.payroll_records
  FOR SELECT USING (
    public.has_role(auth.uid(), 'branch_manager') 
    AND employee_id IN (
      SELECT id FROM public.employees WHERE branch_id = public.get_user_branch_id(auth.uid())
    )
  );
CREATE POLICY "Employees can view own payroll" ON public.payroll_records
  FOR SELECT USING (employee_id = public.get_employee_by_user(auth.uid()));

-- RLS Policies for loans
CREATE POLICY "HR can manage all loans" ON public.loans
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Employees can view own loans" ON public.loans
  FOR SELECT USING (employee_id = public.get_employee_by_user(auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for announcements
CREATE POLICY "HR can manage announcements" ON public.announcements
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Authenticated can view published announcements" ON public.announcements
  FOR SELECT TO authenticated USING (is_published = true);

-- RLS Policies for holidays
CREATE POLICY "HR can manage holidays" ON public.holidays
  FOR ALL USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Authenticated can view holidays" ON public.holidays
  FOR SELECT TO authenticated USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  -- Default role is employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to relevant tables
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_credits_updated_at BEFORE UPDATE ON public.leave_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default salary components
INSERT INTO public.salary_components (name, type, is_taxable, is_mandatory, description) VALUES
('Transportation Allowance', 'earning', false, false, 'Monthly transportation allowance'),
('Rice Allowance', 'earning', false, false, 'Monthly rice allowance'),
('Meal Allowance', 'earning', false, false, 'Daily meal allowance'),
('SSS Contribution', 'deduction', false, true, 'Social Security System contribution'),
('PhilHealth Contribution', 'deduction', false, true, 'Philippine Health Insurance contribution'),
('Pag-IBIG Contribution', 'deduction', false, true, 'Home Development Mutual Fund contribution'),
('Withholding Tax', 'deduction', false, true, 'Income tax withholding'),
('SSS Loan', 'deduction', false, false, 'SSS salary loan deduction'),
('Pag-IBIG Loan', 'deduction', false, false, 'Pag-IBIG salary loan deduction'),
('Company Loan', 'deduction', false, false, 'Company cash advance/loan'),
('Cash Advance', 'deduction', false, false, 'Employee cash advance');