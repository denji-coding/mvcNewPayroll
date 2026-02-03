
## Implementation Plan: Employee View Modal, Attendance Edit Fix, Manual Payroll, and Leave Check

---

### Part 1: Employee View Modal

**Current State:** The Eye icon navigates to `/employees/${emp.id}` which opens the edit form.

**Solution:** Create a view-only modal that displays all employee information when the Eye icon is clicked.

#### Changes Required:

**File: `src/pages/Employees.tsx`**
1. Add state for selected employee and modal visibility
2. Create `EmployeeViewModal` component inside the file
3. Modify Eye icon to open modal instead of navigating
4. Display all employee fields in organized sections:
   - Personal Information (name, email, phone, DOB, gender, civil status, address)
   - Employment Details (employee ID, position, department, branch, date hired, salary, RFID, status)
   - Government IDs (SSS, PhilHealth, Pag-IBIG, TIN)
   - Banking Information (bank name, account number)
   - Emergency Contact

```text
Modal Structure:
├── DialogHeader with employee name and avatar
├── Personal Information Section
├── Employment Details Section  
├── Government IDs Section
├── Banking Information Section
└── Emergency Contact Section
```

---

### Part 2: Fix Attendance Time Edit Bug

**Problem:** When editing attendance times, if one field is empty, the update applies incorrect values. The issue is in how the form state is managed - the `handleEdit` function populates the form, but `handleSaveEdit` may be incorrectly sending null values that overwrite existing data.

**Root Cause Analysis:**
Looking at `handleSaveEdit` in `Attendance.tsx` (lines 56-75):
- The function creates timestamp strings by combining date + time
- If a field is empty, it sets the value to `null`
- The problem is that updating with `null` overwrites existing values

**Solution:**
Only include fields in the update payload that were explicitly changed. If a field wasn't edited, don't include it in the update.

**File: `src/pages/Attendance.tsx`**
1. Track which fields were modified during editing
2. Only send changed fields in the update mutation
3. Preserve original values for unchanged fields

```text
Fix Approach:
├── Store original record values
├── Track which fields user modified
├── Build update payload with only changed fields
└── Preserve existing timestamps for unchanged fields
```

---

### Part 3: Manual Payroll Feature

**Goal:** Allow HR to manually enter payroll data for individual employees instead of computing from attendance.

#### Step 3.1: Database Schema Update

Add `is_manual` column to `payroll_records` table:

```sql
ALTER TABLE payroll_records 
ADD COLUMN is_manual boolean DEFAULT false;
```

#### Step 3.2: Create Manual Payroll Dialog

**File: `src/pages/Payroll.tsx`**

Add a new dialog for manual payroll entry with fields:
- Employee selection (dropdown of active employees)
- Basic Pay
- Overtime Pay
- Holiday Pay
- Night Differential
- Total Allowances
- SSS Contribution
- PhilHealth Contribution
- Pag-IBIG Contribution
- Withholding Tax
- Other Deductions
- Days Worked
- Remarks/Notes

The dialog will calculate:
- Gross Pay = Basic + Overtime + Holiday + Night Diff + Allowances
- Total Deductions = SSS + PhilHealth + Pag-IBIG + Tax + Other
- Net Pay = Gross - Deductions

#### Step 3.3: Add Manual Payroll Hook

**File: `src/hooks/usePayroll.ts`**

Add `useCreateManualPayroll` mutation:
```typescript
export function useCreateManualPayroll() {
  // Insert payroll record with is_manual = true
}
```

#### Step 3.4: Update Payroll Records Display

Show "Manual" badge next to payroll records where `is_manual = true`

#### Step 3.5: Update My Payslips Display

**File: `src/pages/MyPayslips.tsx`**

Add indicator showing "Manually Processed" for records with `is_manual = true`

```text
Manual Payroll Flow:
├── HR clicks "Add Manual Payroll" button
├── Selects payroll period and employee
├── Enters all pay components manually
├── System calculates gross, deductions, net
├── Saves with is_manual = true
└── Badge shows on payroll records and payslips
```

---

### Part 4: Block Attendance for Employees on Leave

**Goal:** When an employee on approved leave tries to scan their RFID, show a message that they are on leave.

**File: `supabase/functions/rfid-attendance/index.ts`**

Add leave status check after finding the employee:

```typescript
// After finding employee, check for approved leave
const { data: activeLeave } = await supabase
  .from('leave_requests')
  .select('id, leave_type, start_date, end_date')
  .eq('employee_id', employee.id)
  .eq('status', 'hr_approved')
  .lte('start_date', today)
  .gte('end_date', today)
  .single();

if (activeLeave) {
  return new Response(
    JSON.stringify({ 
      error: 'Currently on leave',
      employee_name: `${employee.first_name} ${employee.last_name}`,
      message: `You are on ${activeLeave.leave_type} leave until ${activeLeave.end_date}. Attendance is not required.`,
      leave_type: activeLeave.leave_type,
      leave_end: activeLeave.end_date
    }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

This check happens:
1. After employee is found and validated
2. Before checking their schedule
3. Returns a friendly message with leave type and end date

---

### Summary of Changes

| Feature | Files Affected | Type |
|---------|----------------|------|
| Employee View Modal | `Employees.tsx` | UI Enhancement |
| Attendance Edit Fix | `Attendance.tsx` | Bug Fix |
| Manual Payroll | `Payroll.tsx`, `usePayroll.ts`, `MyPayslips.tsx`, DB migration | New Feature |
| Leave Check | `rfid-attendance/index.ts` | New Feature |

---

### Technical Notes

**Attendance Edit Bug:**
The current code in `handleSaveEdit` creates timestamps like `${dateStr}T${editForm.morning_in}:00` even when the time field is empty, resulting in invalid timestamps. The fix ensures only explicitly changed fields are updated.

**Manual Payroll:**
The `is_manual` flag allows distinguishing between computed and manually entered payroll records. This is important for auditing and transparency.

**Leave Validation:**
The leave check uses `hr_approved` status (final approval) and checks if today falls within the leave date range. Pending or rejected leaves don't block attendance.
