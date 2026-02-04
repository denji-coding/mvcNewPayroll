
## Implementation Plan: Employee Form, Sidebar, Leave System & Attendance Updates

---

### Part 1: Add Emergency Contact Fields to Employee Form

**Current State:** The employee form has `emergency_contact_name` and `emergency_contact_phone` in the form state but no input fields to actually enter them.

**Solution:** Add an "Emergency Contact" card section after the Government IDs section in `EmployeeForm.tsx`.

**File: `src/pages/EmployeeForm.tsx`**
- Add a new Card section after the Government IDs & Banking card
- Include two fields: Emergency Contact Name and Emergency Contact Phone
- Fields are optional (no `required` attribute)

```text
New Card Structure:
├── CardHeader: "Emergency Contact"
├── CardContent (grid 2 cols):
│   ├── Emergency Contact Name (text input)
│   └── Emergency Contact Phone (text input)
```

---

### Part 2: Sidebar Logo and Branding Updates

**Current Issues:**
1. Logo is small and left-aligned (needs to be centered when expanded, larger when collapsed)
2. Company name shows "MVC" (should be "Migrant Venture Corporation")
3. Subtitle shows "HR & Payroll" (should be removed)
4. Avatar button is not centered when collapsed
5. Avatar image not loading properly

**Solution:** Restructure the sidebar header and footer in `AppSidebar.tsx`.

**File: `src/components/layout/AppSidebar.tsx`**

Changes:
1. **Header (expanded):** Center logo with company name below
   - Logo: ~48x48px centered
   - Company name: "Migrant Venture Corporation" centered below logo

2. **Header (collapsed):** Centered larger logo
   - Logo: ~36x36px (slightly larger), centered

3. **Footer (collapsed):** Center avatar, increase button size for better touch target
   - Wrapper flex justify-center
   - Avatar button size increased when collapsed

4. **Avatar image:** Use profile.avatarUrl which already comes from profiles table

```text
Sidebar Layout:
├── SidebarHeader
│   ├── Expanded: Logo (centered) + "Migrant Venture Corporation" (centered)
│   └── Collapsed: Logo only (centered, larger)
├── SidebarContent (unchanged)
└── SidebarFooter
    ├── Expanded: Avatar + Name + Role + Chevron
    └── Collapsed: Avatar only (centered, larger button)
```

---

### Part 3: Limit Leave Types & Update Database Enum

**Current State:** The system has 7 leave types (vacation, sick, emergency, maternity, paternity, bereavement, unpaid).

**User Request:** Only 3 leave types: sick, vacation, emergency.

**Solution:** 
1. **Update leave_type enum** in database to only include: sick, vacation, emergency
2. **Update LEAVE_TYPES array** in `Leaves.tsx` to only show these 3 types
3. **Update Zod schema** in `src/lib/validations.ts`

**Database Migration:**
```sql
-- Note: Changing enums requires a more careful approach
-- We'll create a new enum and migrate
```

**File: `src/pages/Leaves.tsx`**
```typescript
const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
];
```

**File: `src/lib/validations.ts`**
- Update leaveRequestSchema to only allow: sick, vacation, emergency

---

### Part 4: Leave Credit Management Feature

**Current State:** 
- `leave_credits` table exists with columns: id, employee_id, leave_type, year, total_credits, used_credits
- No CRUD operations for leave credits in the hooks
- Credits are displayed but cannot be managed

**User Requirements:**
- HR Admin can add/edit leave credits for employees
- Default credits per leave type:
  - Sick Leave: 2 credits
  - Vacation Leave: 1 credit  
  - Emergency Leave: 2 credits
- Deduct credits only when leave is approved (hr_approved)

**Solution:**

**File: `src/hooks/useLeaves.ts`**
Add new hooks:
- `useAllLeaveCredits()` - Fetch all leave credits (for HR admin)
- `useEmployeeLeaveCredits(employeeId)` - Fetch specific employee credits
- `useCreateLeaveCredit()` - Create new leave credit entry
- `useUpdateLeaveCredit()` - Update existing leave credit
- `useDeductLeaveCredit()` - Deduct from leave credit when approved

**File: `src/pages/Leaves.tsx`**
Add leave credit management section (for HR Admin only):
- Button: "Manage Leave Credits"
- Dialog to select employee and manage their credits
- Table showing all employees and their leave credits

**Approval Logic Update:**
Modify `useApproveLeaveRequest` to deduct leave credits when HR approves a leave request:
```typescript
// When status becomes 'hr_approved', deduct from leave_credits
if (action === 'approve' && role === 'hr_admin') {
  // Get leave request details
  // Deduct from leave_credits: used_credits += total_days
}
```

---

### Part 5: Leave Credits Display Card

**Current State:** Credits are displayed but only for the logged-in user.

**Solution:** Enhance the existing leave credits card in `Leaves.tsx`:
- Show available credits (total - used) prominently
- Visual indicator when credits are low
- Different styling for each leave type

The current implementation already shows credits, but we'll enhance it.

---

### Part 6: Remove Edit Button from Attendance

**Current State:** HR Admin can edit attendance records via pencil icon.

**User Request:** Remove edit functionality entirely.

**File: `src/pages/Attendance.tsx`**
- Remove the "Actions" column from the table header
- Remove the Actions TableCell with Edit button
- Remove all edit-related state and functions (editRecord, editForm, handleEdit, handleSaveEdit)
- Keep Export functionality

---

### Part 7: Remove Department from Employee Form and Positions Page

**Current State:**
- Employee form has a "Department" field
- Positions page has a "Department" column and field

**Solution:**

**File: `src/pages/EmployeeForm.tsx`**
- Remove the Department input field from Employment Details section
- Remove `department` from form state (or just ignore it)

**File: `src/pages/Positions.tsx`**
- Remove Department column from table
- Remove Department input from create/edit dialogs
- Remove `department` from form state

**File: `src/components/employees/EmployeeViewModal.tsx`**
- Remove Department row from Employment Details section

---

### Summary of Changes

| Change | Files Affected | Type |
|--------|----------------|------|
| Emergency Contact Fields | `EmployeeForm.tsx` | Add Section |
| Sidebar Logo Centering | `AppSidebar.tsx` | UI Update |
| Company Name Change | `AppSidebar.tsx` | Text Update |
| Remove HR & Payroll subtitle | `AppSidebar.tsx` | Remove |
| Collapsed Logo Size | `AppSidebar.tsx` | CSS Update |
| Avatar Centering (collapsed) | `AppSidebar.tsx` | CSS Update |
| Limit Leave Types | `Leaves.tsx`, `validations.ts`, DB Migration | Enum Update |
| Leave Credit CRUD | `useLeaves.ts`, `Leaves.tsx` | New Feature |
| Leave Credit Deduction | `useLeaves.ts` | Logic Update |
| Remove Attendance Edit | `Attendance.tsx` | Remove Feature |
| Remove Department (Employee) | `EmployeeForm.tsx` | Remove Field |
| Remove Department (Position) | `Positions.tsx` | Remove Field |
| Remove Department (View) | `EmployeeViewModal.tsx` | Remove Row |

---

### Database Changes Required

1. **Update leave_type enum** (optional - can be handled in frontend only):
   - Restrict to: sick, vacation, emergency
   - This is a breaking change if existing data uses other types

2. **No new tables needed** - leave_credits table already exists with correct structure

---

### Technical Notes

**Leave Credit Deduction Logic:**
When a leave request is approved by HR (status = 'hr_approved'):
1. Query the leave_credits table for the employee + leave_type + current year
2. Update: `used_credits = used_credits + total_days`
3. If no credit record exists, the approval should still work but show a warning

**Avatar Display:**
The sidebar already uses `profile?.avatarUrl` from the auth context, which fetches from the profiles table. The avatar should display if the user has uploaded one.
