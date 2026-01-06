import { z } from 'zod';

// Common validation patterns
const phoneRegex = /^(\+?63|0)?[0-9]{10,11}$/;
const sssRegex = /^[0-9]{2}-[0-9]{7}-[0-9]$|^[0-9]{10}$/;
const tinRegex = /^[0-9]{3}-[0-9]{3}-[0-9]{3}(-[0-9]{3,5})?$|^[0-9]{9,14}$/;
const philhealthRegex = /^[0-9]{2}-[0-9]{9}-[0-9]$|^[0-9]{12}$/;
const pagibigRegex = /^[0-9]{4}-[0-9]{4}-[0-9]{4}$|^[0-9]{12}$/;

// Employee validation schema
export const employeeSchema = z.object({
  employee_id: z.string()
    .min(1, 'Employee ID is required')
    .max(50, 'Employee ID must be less than 50 characters'),
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  middle_name: z.string().max(100, 'Middle name must be less than 100 characters').optional().nullable(),
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .nullable()
    .or(z.literal('')),
  position: z.string()
    .min(1, 'Position is required')
    .max(100, 'Position must be less than 100 characters'),
  department: z.string().max(100, 'Department must be less than 100 characters').optional().nullable(),
  branch_id: z.string().uuid('Invalid branch selected').optional().nullable(),
  date_hired: z.string().min(1, 'Date hired is required'),
  date_of_birth: z.string().optional().nullable(),
  basic_salary: z.number()
    .min(0, 'Salary must be a positive number')
    .max(10000000, 'Salary exceeds maximum allowed'),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  civil_status: z.enum(['single', 'married', 'widowed', 'separated', 'divorced']).optional().nullable(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().nullable(),
  sss_number: z.string()
    .regex(sssRegex, 'Invalid SSS number format (XX-XXXXXXX-X or 10 digits)')
    .optional()
    .nullable()
    .or(z.literal('')),
  tin_number: z.string()
    .regex(tinRegex, 'Invalid TIN format (XXX-XXX-XXX or XXX-XXX-XXX-XXXXX)')
    .optional()
    .nullable()
    .or(z.literal('')),
  philhealth_number: z.string()
    .regex(philhealthRegex, 'Invalid PhilHealth number format (XX-XXXXXXXXX-X or 12 digits)')
    .optional()
    .nullable()
    .or(z.literal('')),
  pagibig_number: z.string()
    .regex(pagibigRegex, 'Invalid Pag-IBIG number format (XXXX-XXXX-XXXX or 12 digits)')
    .optional()
    .nullable()
    .or(z.literal('')),
  bank_name: z.string().max(100, 'Bank name must be less than 100 characters').optional().nullable(),
  bank_account_number: z.string().max(50, 'Account number must be less than 50 characters').optional().nullable(),
  rfid_card_number: z.string().max(50, 'RFID card number must be less than 50 characters').optional().nullable(),
  emergency_contact_name: z.string().max(100, 'Emergency contact name must be less than 100 characters').optional().nullable(),
  emergency_contact_phone: z.string()
    .regex(phoneRegex, 'Please enter a valid emergency contact phone number')
    .optional()
    .nullable()
    .or(z.literal('')),
});

// Branch validation schema
export const branchSchema = z.object({
  name: z.string()
    .min(1, 'Branch name is required')
    .max(100, 'Branch name must be less than 100 characters'),
  code: z.string()
    .min(1, 'Branch code is required')
    .max(20, 'Branch code must be less than 20 characters')
    .regex(/^[A-Z0-9-]+$/i, 'Branch code can only contain letters, numbers, and hyphens'),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().nullable(),
  contact_number: z.string()
    .regex(phoneRegex, 'Please enter a valid contact number')
    .optional()
    .nullable()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});

// Payroll period validation schema
export const payrollPeriodSchema = z.object({
  period_start: z.string().min(1, 'Start date is required'),
  period_end: z.string().min(1, 'End date is required'),
  pay_date: z.string().min(1, 'Pay date is required'),
}).refine((data) => {
  const start = new Date(data.period_start);
  const end = new Date(data.period_end);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['period_end'],
}).refine((data) => {
  const end = new Date(data.period_end);
  const pay = new Date(data.pay_date);
  return pay >= end;
}, {
  message: 'Pay date must be after or equal to end date',
  path: ['pay_date'],
});

// Loan validation schema
export const loanSchema = z.object({
  employee_id: z.string().uuid('Please select an employee'),
  loan_type: z.string().min(1, 'Loan type is required'),
  principal_amount: z.number()
    .min(1, 'Principal amount must be greater than 0')
    .max(10000000, 'Principal amount exceeds maximum allowed'),
  monthly_amortization: z.number()
    .min(1, 'Monthly amortization must be greater than 0')
    .max(10000000, 'Monthly amortization exceeds maximum allowed'),
  start_date: z.string().min(1, 'Start date is required'),
}).refine((data) => {
  return data.monthly_amortization <= data.principal_amount;
}, {
  message: 'Monthly amortization cannot exceed principal amount',
  path: ['monthly_amortization'],
});

// Attendance terminal validation
export const rfidInputSchema = z.string()
  .min(1, 'Please scan your RFID card or enter your ID')
  .max(50, 'Invalid input length');

export const employeeIdInputSchema = z.string()
  .min(1, 'Please enter your Employee ID')
  .max(50, 'Employee ID is too long');

// Leave request validation schema
export const leaveRequestSchema = z.object({
  leave_type: z.enum(['vacation', 'sick', 'emergency', 'maternity', 'paternity', 'bereavement', 'unpaid'], {
    required_error: 'Please select a leave type',
  }),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
  total_days: z.number().min(0.5, 'Leave must be at least half a day'),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
});

// Holiday validation schema
export const holidaySchema = z.object({
  name: z.string()
    .min(1, 'Holiday name is required')
    .max(100, 'Holiday name must be less than 100 characters'),
  date: z.string().min(1, 'Date is required'),
  type: z.string().min(1, 'Holiday type is required'),
  year: z.number().min(2000).max(2100),
});

// Announcement validation schema
export const announcementSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  branch_id: z.string().uuid().optional().nullable(),
});

// Helper function to validate and return typed result
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
}

// Type exports
export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type BranchFormData = z.infer<typeof branchSchema>;
export type PayrollPeriodFormData = z.infer<typeof payrollPeriodSchema>;
export type LoanFormData = z.infer<typeof loanSchema>;
export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
export type HolidayFormData = z.infer<typeof holidaySchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
