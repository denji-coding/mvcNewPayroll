
## Implementation Plan: Multiple Fixes and Features

### Overview
This plan addresses five items: verifying the My Payslips page, fixing the RFID scanner input, adding the company logo to loading screens, implementing a Benefits Rate configuration feature, and removing the Loans feature.

---

### Part 1: My Payslips Page (Already Implemented)

**Status: Complete**

The My Payslips page already exists at `src/pages/MyPayslips.tsx` and is properly configured in the sidebar under "Employee Portal". No changes needed.

---

### Part 2: Fix RFID Scanner Input

**Problem:** The RFID input field uses `readOnly` and `inputMode="none"`, which blocks keyboard input. RFID scanners emulate keyboard input by rapidly typing characters and pressing Enter.

**File: `src/pages/AttendanceTerminal.tsx`**

**Solution:**
1. Remove `readOnly` and `inputMode="none"` attributes from the RFID input field
2. Keep the input focused and capture scanner input via `onChange`
3. Auto-submit when Enter key is pressed (scanners typically send Enter after card data)
4. Add a debounce/auto-submit after rapid input stops (backup for scanners that don't send Enter)
5. Maintain the visual styling that hides the caret for cleaner appearance

**Changes:**
```text
RFID Input Field:
├── Remove readOnly attribute
├── Remove inputMode="none" attribute  
├── Add onChange handler to capture scanner input
├── Keep onKeyDown for Enter key submission
├── Add auto-submit timeout (300ms after last character)
└── Keep visual styling with transparent caret
```

---

### Part 3: Add Company Logo to Loading Screens

**File: `src/App.tsx`**

**Current State:** Loading screen shows a generic pulsing circle

**Solution:** Replace the placeholder circle with the company logo inside a pulsing animation

**Changes:**
- Import `companyLogo` from `@/assets/company-logo.png`
- Replace the generic circle div with the company logo image
- Keep the pulsing animation for visual feedback
- Also update the `AttendanceTerminal.tsx` loading state to use the logo

---

### Part 4: Benefits Rate Configuration

**New Feature:** Allow HR to configure benefit contribution rates

#### Step 4.1: Database Migration

Create a new settings entry for benefit rates (stored in the existing `settings` table):

```text
Settings Key: "benefit_rates"
Default Value: {
  "philhealth_rate": 5.0,
  "pagibig_employee_rate": 2.0,
  "pagibig_employer_rate": 2.0,
  "pagibig_ceiling": 5000
}
```

Note: SSS uses a bracket table which is standardized by law, so only PhilHealth and Pag-IBIG rates are configurable.

#### Step 4.2: Create Settings Hook

**New File: `src/hooks/useBenefitRates.ts`**

```text
Hook Functions:
├── useBenefitRates() - Fetch current rates
└── useUpdateBenefitRates() - Update rates (HR only)
```

#### Step 4.3: Add Benefits Rate Tab to Settings

**File: `src/pages/Settings.tsx`**

Add a new "Benefits" tab in the Settings page for HR Admins to configure:
- PhilHealth contribution rate (default 5%)
- Pag-IBIG employee contribution rate (default 2%)
- Pag-IBIG ceiling amount (default 5000)

```text
UI Elements:
├── PhilHealth Rate input (percentage)
├── Pag-IBIG Employee Rate input (percentage)
├── Pag-IBIG Salary Ceiling input (currency)
└── Save button
```

#### Step 4.4: Update Payroll Computation

**File: `supabase/functions/compute-payroll/index.ts`**

Modify the edge function to:
1. Fetch benefit rates from the `settings` table
2. Use configurable rates for PhilHealth and Pag-IBIG calculations
3. Fall back to default values if no settings exist

---

### Part 5: Remove Loan Feature

#### Step 5.1: Update Payroll Computation

**File: `supabase/functions/compute-payroll/index.ts`**

- Remove loan query and loan deduction calculations
- Remove loan-related deductions from the breakdown

#### Step 5.2: Update Payroll Page

**File: `src/pages/Payroll.tsx`**

- Remove "Loans" tab from TabsList
- Remove LoansTab component
- Remove loan-related imports (`useLoans`, `useCreateLoan`, `useDeleteLoan`)
- Remove loans data fetching

#### Step 5.3: Remove Loan Hooks

**File: `src/hooks/useLoans.ts`**

- Delete this file entirely

**File: `src/hooks/usePayroll.ts`**

- Remove `useEmployeeLoans` function

#### Step 5.4: Database Cleanup (Optional)

**Migration:** Drop the `loans` table from the database (optional - can be done later if there's no data)

---

### Summary of Changes

| Item | Files Affected | Action |
|------|----------------|--------|
| My Payslips | None | Already complete |
| RFID Scanner | `AttendanceTerminal.tsx` | Fix input handling |
| Loading Logo | `App.tsx` | Add company logo |
| Benefits Rate | `Settings.tsx`, new hook, edge function | Add new feature |
| Remove Loans | `Payroll.tsx`, hooks, edge function | Remove feature |

---

### Technical Notes

**RFID Scanner Behavior:**
Most RFID scanners work by emulating keyboard input - they type the card number character by character very quickly (typically within 50-100ms), then press Enter. The current implementation blocks this by making the input read-only.

**Benefits Rate Storage:**
Using the existing `settings` table with a JSON value allows flexible storage without schema changes. The edge function can read these settings at payroll computation time.

**Loan Removal:**
Removing the loans feature also removes loan deductions from payroll computation. If there are existing loan records in the database, they will remain but no longer affect payroll.
