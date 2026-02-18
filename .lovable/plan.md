
# Fix and Enhance Leave, Sidebar, and Payroll

## 1. Leave With Pay / Without Pay Option

**What changes:** When employees apply for leave, they will see a new "Pay Type" option to choose between "Leave With Pay" and "Leave Without Pay." Employees get 3 days of leave with pay per month. Unused leave credits will be tracked for year-end cash conversion.

**Technical details:**
- Add a `pay_type` column to `leave_requests` table (text, default 'with_pay', values: 'with_pay' or 'without_pay')
- Update the leave form in `src/pages/Leaves.tsx` to add a radio group for pay type selection
- Update `src/hooks/useLeaves.ts` to pass `pay_type` when creating a leave request
- The existing monthly credit refresh and leave_types table already handle the 3-credit-per-month logic
- Add a note in the Leave Credits page about year-end cash conversion policy (this is an HR manual process)

## 2. Sidebar Scroll Fix When Collapsed

**What changes:** When the sidebar is collapsed, menu items below the visible area will become scrollable instead of hidden.

**Technical details:**
- In `src/components/ui/sidebar.tsx`, remove `group-data-[collapsible=icon]:overflow-hidden` from `SidebarContent` and replace with `group-data-[collapsible=icon]:overflow-auto` so icons remain scrollable in collapsed mode

## 3. Leave Integration in Payroll Calculation

**What changes:** The payroll computation will detect approved leaves during the pay period. Leave with pay days will be added to earnings. Leave without pay days will result in deductions. Leave details will appear on the payslip PDF.

**Technical details:**
- Update `supabase/functions/compute-payroll/index.ts` to:
  - Query `leave_requests` for each employee where dates overlap the payroll period and status is 'hr_approved'
  - For "with pay" leaves: add leave days to paid days (leave_pay = daily_rate x leave_days)
  - For "without pay" leaves: track as unpaid days
  - Store leave breakdown in `deductions_breakdown` or `allowances_breakdown` JSON fields
- Update `src/lib/generatePayslipPdf.ts` to display leave details (leave with pay as an earning, leave without pay noted)
- Add a `leave_pay` line item in the payslip earnings section showing "Leave With Pay (X days)"

## 4. Fix Leave Credit Card Text Overlap

**What changes:** Long leave type names will no longer overlap with the credit numbers.

**Technical details:**
- In `src/pages/Leaves.tsx`, update the leave credits card layout:
  - Add `min-w-0` to the text container for proper text truncation
  - Add `truncate` class to the leave type label
  - Adjust the grid to use `sm:grid-cols-2 lg:grid-cols-3` instead of `sm:grid-cols-3` for better spacing
  - Make the credits display use `whitespace-nowrap` to prevent wrapping

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/` (new) | Add `pay_type` column to `leave_requests` |
| `src/pages/Leaves.tsx` | Add pay type radio group in form; fix card text overlap |
| `src/hooks/useLeaves.ts` | Include `pay_type` in leave request creation |
| `src/components/ui/sidebar.tsx` | Fix overflow in collapsed mode |
| `supabase/functions/compute-payroll/index.ts` | Query leaves, calculate leave pay, include in payroll |
| `src/lib/generatePayslipPdf.ts` | Add leave details to payslip PDF |

## Implementation Order
1. Database migration (add `pay_type` column)
2. Sidebar scroll fix (quick CSS change)
3. Leave form and card text fixes
4. Payroll leave integration and payslip update
