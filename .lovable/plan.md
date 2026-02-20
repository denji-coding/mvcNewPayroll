

# Plan: Leave Credits, Sidebar Fix, Payroll Loading, and Data Table

## 1. Auto-assign leave credits to all employees (including on new employee creation)

**What changes:**
- Create a database trigger that automatically inserts leave credits for a new employee whenever they are added to the `employees` table. The trigger will read all active leave types and create corresponding `leave_credits` records.
- Update the `create-employee` edge function to also assign leave credits after creating the employee record (as a fallback).
- This ensures HR admins, branch managers, and regular employees all get leave credits automatically.

**Technical details:**
- New database migration: create a function `assign_leave_credits_to_employee()` that queries `leave_types` where `is_active = true` and inserts into `leave_credits` for the given employee. A trigger `on_employee_created` fires after INSERT on `employees`.
- Also update `useCreateLeaveType` hook: when "Apply to all employees" is checked, ensure ALL employees get credits (not just active ones with a specific status filter issue).

## 2. Fix sidebar layout (remove scroll, adjust spacing)

**What changes:**
- Remove the scroll behavior inside the sidebar and adjust the spacing/padding so all menu items fit without needing to scroll.
- Reduce padding on sidebar header, groups, and menu items to make everything more compact.

**Technical details:**
- In `src/components/layout/AppSidebar.tsx`: reduce padding on the header (from `p-4` to `p-3`), reduce gap between groups, and use smaller text/spacing for labels.
- In `src/components/ui/sidebar.tsx`: keep `overflow-auto` as a safety fallback but ensure content fits by reducing default spacing in `SidebarGroup` and `SidebarMenuItem` components (reduce `gap-2` to `gap-1`, reduce padding).

## 3. Add loading indicators for payroll processing

**What changes:**
- Show a loading spinner and disabled state on Run Payroll and Approve Payroll buttons while processing.
- Add a full overlay or inline loading indicator on the payroll records table during computation.

**Technical details:**
- In `src/pages/Payroll.tsx`: use `runPayroll.isPending` and `approvePayroll.isPending` to show spinner text like "Processing..." and "Approving..." on the respective buttons, and disable them.
- Add a loading overlay card when either operation is pending.

## 4. Install TanStack React Table and create a reusable DataTable component

**What changes:**
- Install `@tanstack/react-table` package.
- Create a reusable `DataTable` component with built-in sorting, filtering (global search), and pagination.
- Replace the current manual table implementations on 9 pages: Employees, Positions, Branches, Time Schedules, Attendance, Leaves, Leave Credits, Payroll, and My Payslips.

**Technical details:**

### New files:
| File | Purpose |
|------|---------|
| `src/components/ui/data-table.tsx` | Reusable DataTable component with TanStack React Table |

### DataTable component features:
- Accepts `columns` (ColumnDef array) and `data` props
- Built-in sorting (clickable column headers with sort indicators)
- Built-in global filter/search input
- Built-in pagination (configurable page size, page controls)
- Uses existing ShadCN `Table` components for rendering
- Optional `searchPlaceholder` and `searchColumn` props

### Pages to update:
Each page will define its columns using `ColumnDef` and pass data to the `DataTable` component, replacing the manual `Table` + `TablePagination` pattern.

| Page | Key changes |
|------|-------------|
| `src/pages/Employees.tsx` | Define columns for Employee ID, Name, Position, Branch, Status, Actions |
| `src/pages/Positions.tsx` | Define columns for Name, Description, Status, Actions |
| `src/pages/Branches.tsx` | Define columns for Code, Name, Manager, Employees, Contact, Status, Actions |
| `src/pages/TimeSchedule.tsx` | Define columns for assigned schedules table |
| `src/pages/Attendance.tsx` | Define columns for attendance records |
| `src/pages/Leaves.tsx` | Define columns for leave requests table |
| `src/pages/LeaveCredits.tsx` | Define columns for leave types management table |
| `src/pages/Payroll.tsx` | Define columns for payroll periods and records tables |
| `src/pages/MyPayslips.tsx` | Define columns for payroll history table |

### Implementation order:
1. Database migration (auto-assign leave credits trigger)
2. Install `@tanstack/react-table` dependency
3. Create `DataTable` component
4. Fix sidebar spacing
5. Add payroll loading indicators
6. Update all 9 pages to use DataTable

