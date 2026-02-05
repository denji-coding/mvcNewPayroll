
# Implementation Plan: UI Updates and Feature Enhancements

## Overview
This plan addresses 5 changes: Attendance Terminal redesign, Employee Form improvements, Leave Credits module separation, sidebar logo sizing, and login page background update.

---

## Part 1: Attendance Terminal Design Redesign

**Current State:** Single-column card-based layout with gradient background

**Target Design (from reference image):**
- Split-panel layout: Dark sidebar on left, light main content on right
- Left panel contains: Company logo, company name, subtitle, Employee ID input, Time In/Time Out buttons
- Right panel contains: Large clock display, date, filter controls, and attendance log table

**Changes to `src/pages/AttendanceTerminal.tsx`:**

1. Restructure layout to horizontal split:
   - Left sidebar (~280px): Dark green background
     - Company logo (using existing `src/assets/company-logo.png`)
     - "Migrants Venture Corporation" heading
     - "Employee Attendance System" subtitle
     - Employee ID input field
     - Time In and Time Out buttons (green/red outlined)
   
   - Right main area: Light background
     - Large digital clock with PM/AM indicator
     - Instruction text
     - Date picker and Filter button
     - Attendance records table with columns: No., Photo, Name, Position, Morning (In/Out), Afternoon (In/Out), Date

2. Keep all existing functionality intact:
   - RFID scanning and manual entry modes
   - Auto-submit timeout logic
   - Result display overlay
   - Terminal enabled/disabled states

---

## Part 2: Employee Form Width and Date of Birth Fix

**Issues:**
1. Form container is limited to `max-w-4xl` leaving unused space
2. Date of Birth field shows full date format that overflows button width

**Changes to `src/pages/EmployeeForm.tsx`:**

1. **Increase form width:**
   - Change `max-w-4xl` to `max-w-5xl` or `max-w-6xl` on line 115
   - Consider removing max-width entirely if more space is needed

2. **Fix Date of Birth overflow:**
   - The DateInput component uses `format(date, "PPP")` which produces long format like "February 5th, 2026"
   - Modify the date picker button to use shorter format or add `truncate` class
   - Add `overflow-hidden text-ellipsis whitespace-nowrap` to prevent text overflow

3. **Add Employee ID Generator:**
   - Add a "Generate" button next to the Employee ID field
   - Generate format: `EMP-XXXXXX` where X is a random digit
   - Function: `const generateEmployeeId = () => 'EMP-' + Math.floor(100000 + Math.random() * 900000)`

---

## Part 3: Leave Credits as Separate Page

**Current State:** Leave credits management is embedded within the Leaves page

**Changes Required:**

1. **Create new page `src/pages/LeaveCredits.tsx`:**
   - Move leave credit card and management dialog from Leaves.tsx
   - Add full CRUD capabilities for leave credits
   - Add ability to add new leave types (custom leave types feature)
   - Display all employees' leave credits in a table
   - Include monthly auto-refresh logic

2. **Update Sidebar (`src/components/layout/AppSidebar.tsx`):**
   - Add "Leave Credits" navigation item under Management section
   - Icon: `CreditCard` or similar from lucide-react
   - Permission: HR Admin only
   - URL: `/leave-credits`

3. **Update App.tsx routing:**
   - Add route: `<Route path="leave-credits" element={<LeaveCredits />} />`

4. **Update `src/pages/Leaves.tsx`:**
   - Remove the Leave Credits Card section (lines 345-496)
   - Keep only the leave request form and table
   - Add a link to "Manage Leave Credits" page for HR Admin

5. **Monthly Auto-Refresh Feature:**
   - The existing `leave_credits` table has a `year` column
   - Add a check to detect when a new month begins
   - Option 1: Edge function scheduled task (preferred for true auto-refresh)
   - Option 2: Client-side check on page load that resets credits if month changed

---

## Part 4: Sidebar Logo Size When Collapsed

**Current State:** 
- Expanded logo: `w-12 h-12`
- Collapsed logo: `w-9 h-9`
- Avatar size: `h-9 w-9` when collapsed, `h-8 w-8` when expanded

**Issue:** Logo should match avatar size when collapsed

**Changes to `src/components/layout/AppSidebar.tsx`:**

1. Line 140-141 - Update collapsed logo size to match avatar:
   - Change from: `${collapsed ? 'w-9 h-9' : 'w-12 h-12'}`
   - Keep as-is (already matches avatar's `h-9 w-9`)
   
   Actually, reviewing the code:
   - Collapsed logo is `w-9 h-9` (line 140)
   - Collapsed avatar is `h-9 w-9` (line 232)
   - These already match!
   
   Let me verify if there's a visual discrepancy. The avatar might appear smaller due to padding/container. The issue may be the button wrapper padding making it appear misaligned.

   **Fix:** Ensure both logo and avatar containers have same dimensions when collapsed. May need to adjust the wrapper/padding.

---

## Part 5: Login Page Background Image

**Current State:** Gradient background: `bg-gradient-to-br from-primary/10 via-background to-secondary/20`

**Changes Required:**

1. **Copy the uploaded image to project:**
   - Copy `user-uploads://image_bg.jpg` to `src/assets/login-bg.jpg`

2. **Update `src/pages/Auth.tsx`:**
   - Import the background image: `import loginBg from '@/assets/login-bg.jpg'`
   - Replace line 110 gradient with background image:
   ```tsx
   <div 
     className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
     style={{ backgroundImage: `url(${loginBg})` }}
   >
   ```
   - Add a semi-transparent overlay for better readability of the login form

---

## Technical Summary

| Feature | Files Changed | Type |
|---------|---------------|------|
| Attendance Terminal redesign | `AttendanceTerminal.tsx` | UI Overhaul |
| Employee Form width | `EmployeeForm.tsx` | CSS Fix |
| Date of Birth overflow | `EmployeeForm.tsx`, possibly `date-picker.tsx` | CSS Fix |
| Employee ID Generator | `EmployeeForm.tsx` | New Feature |
| Leave Credits page | New `LeaveCredits.tsx`, `AppSidebar.tsx`, `App.tsx`, `Leaves.tsx` | New Page |
| Sidebar collapsed logo | `AppSidebar.tsx` | CSS Fix |
| Login background | `Auth.tsx`, copy new asset | UI Update |

---

## Assets Required

1. Copy `user-uploads://image_bg.jpg` to `src/assets/login-bg.jpg` for login background

---

## Database Changes

**None required** - All changes are UI/frontend only. The existing `leave_credits` table and hooks support the new Leave Credits page.

---

## Implementation Order

1. Copy background image asset
2. Update Login page background (Auth.tsx)
3. Fix sidebar collapsed logo size (AppSidebar.tsx)
4. Fix Employee Form width and DOB, add ID generator (EmployeeForm.tsx)
5. Create Leave Credits page and update routing (LeaveCredits.tsx, App.tsx, AppSidebar.tsx)
6. Update Leaves page to remove credits section (Leaves.tsx)
7. Redesign Attendance Terminal (AttendanceTerminal.tsx)
