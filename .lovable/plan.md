
# Plan: Payroll Leave Computation, Employee Form Fixes, and Sidebar Rename

## 1. Salary Calculator -- Add Leave Fields (LWP / LWOP)

**What changes:**
- Add two new input fields to the Salary Calculator: "Leave With Pay (days)" and "Leave Without Pay (days)"
- Update `SalaryCalculationInput` and `calculateSalary` in `src/lib/salaryCalculations.ts` to include `leaveWithPayDays` and `leaveWithoutPayDays`
- Leave With Pay adds earnings: `dailyRate x leaveWithPayDays`
- Leave Without Pay is informational (shown as 0 deduction line item, since those days simply aren't in "days worked")
- Show the leave pay line items in the Computation Breakdown section

**Files to edit:**
- `src/lib/salaryCalculations.ts` -- add `leaveWithPayDays` and `leaveWithoutPayDays` to the interface and calculation
- `src/components/payroll/SalaryCalculator.tsx` -- add input fields and display leave earnings/deductions in breakdown

**Note:** The `compute-payroll` edge function already handles leave computation correctly (it queries `leave_requests` and calculates LWP/LWOP). No changes needed there.

## 2. Number Input Fields -- Allow Direct Keyboard Editing

**What changes:**
- Remove the default browser spinner arrows on number inputs by adding CSS to hide them
- Add `[appearance:textfield]` class to number inputs in the Salary Calculator so users can type values directly without relying on up/down buttons
- This is a CSS-only fix applied globally via `src/index.css`

**Files to edit:**
- `src/index.css` -- add CSS to hide number input spinners globally

## 3. Employee Form -- Field Length Limits, Placeholders, and Field Removal

**What changes:**
- **Phone/Contact**: `maxLength={11}`, placeholder `"09XXXXXXXXX"`
- **SSS Number**: `maxLength={12}`, placeholder `"XX-XXXXXXX-X"` (10 digits + 2 dashes, standard format)
- **PhilHealth Number**: `maxLength={14}`, placeholder `"XX-XXXXXXXXX-X"` (12 digits + 2 dashes)
- **Pag-IBIG Number**: `maxLength={14}`, placeholder `"XXXX-XXXX-XXXX"` (12 digits + 2 dashes)
- **Remove** TIN Number, Bank Name, Bank Account Number fields from the form
- **Remove** those three fields from the form state (keep DB columns as-is for backward compatibility)
- **Add placeholders** to all remaining input fields (First Name, Last Name, Email, Address, etc.)
- **Emergency Contact Phone**: `maxLength={11}`, placeholder `"09XXXXXXXXX"`

**Password clarification (to be noted in UI):**
The password is NOT stored in the `employees` table. When creating an employee, the edge function (`create-employee`) creates a user account in the authentication system using that password. The password is managed by the authentication system, not in any visible database table. This is by design for security. The existing UI note "Employee will login using their email and this password" is sufficient.

**Files to edit:**
- `src/pages/EmployeeForm.tsx` -- add placeholders, maxLength, remove TIN/Bank fields

## 4. Sample Employee with Attendance Records

**What changes:**
- Insert a sample employee record and attendance records directly into the database using the data insertion tool
- The sample employee will have varied attendance statuses (present, late, absent, leave) from approximately 10 days ago through today
- This is a data-only operation, no code changes needed

**Data to insert:**
- 1 employee record with realistic Philippine data
- ~10 attendance records with mixed statuses (present, late, absent)

## 5. Sidebar -- Rename "Leaves" to "My Leaves"

**What changes:**
- In `src/components/layout/AppSidebar.tsx`, change the Employee Portal item title from `"Leaves"` to `"My Leaves"`
- The `Leaves.tsx` page already has `<h1>My Leaves</h1>` so no change needed there

**Files to edit:**
- `src/components/layout/AppSidebar.tsx` -- change title in `employeePortalItems`

## Summary of Files to Edit

| File | Changes |
|------|---------|
| `src/lib/salaryCalculations.ts` | Add leave fields to interface and calculation |
| `src/components/payroll/SalaryCalculator.tsx` | Add leave input fields and breakdown display |
| `src/index.css` | Hide number input spinners globally |
| `src/pages/EmployeeForm.tsx` | Add placeholders, maxLength, remove TIN/Bank fields |
| `src/components/layout/AppSidebar.tsx` | Rename "Leaves" to "My Leaves" |

## Implementation Order
1. Update salary calculations library (add leave fields)
2. Update Salary Calculator UI (add leave inputs + breakdown)
3. Add CSS for number input spinners
4. Update Employee Form (placeholders, limits, remove fields)
5. Rename sidebar item
6. Insert sample employee + attendance data
