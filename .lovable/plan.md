

## Implementation Plan: Employee Avatars & Branch Logos

### Overview
This plan adds avatar display to the employees table and implements a complete logo management system for branches, including upload functionality and table display.

---

### Part 1: Display Employee Avatars in Employees Table

**File: `src/pages/Employees.tsx`**

1. Import the Avatar component and add helper function for default avatars based on gender
2. Update the table to include an "Avatar" column before "Employee ID"
3. Display the employee's uploaded photo or default gender-based avatar
4. Use the existing Dicebear API pattern from `EmployeeAvatarUpload.tsx`

**Changes:**
- Add new table column for avatar display
- Use existing `avatar_url` and `gender` fields from employee data

---

### Part 2: Branch Logo System

#### Step 2.1: Database Migration

Add a `logo_url` column to the `branches` table and create a new storage bucket for branch logos.

```text
SQL Migration:
├── Add logo_url column to branches table
├── Create branch-logos storage bucket (public)
└── Set up RLS policies:
    ├── Anyone can view logos (SELECT)
    ├── HR can upload logos (INSERT)
    ├── HR can update logos (UPDATE)
    └── HR can delete logos (DELETE)
```

#### Step 2.2: Create Branch Logo Upload Component

**New File: `src/components/branches/BranchLogoUpload.tsx`**

Create a reusable component similar to `EmployeeAvatarUpload` with:
- Default building/branch icon when no logo is uploaded
- File validation (type: JPG, PNG, WebP; size: max 2MB)
- Upload to `branch-logos` storage bucket
- Display current logo with overlay upload button
- Remove logo functionality

**Default Logo:** Use Lucide `Building2` icon styled as a placeholder

#### Step 2.3: Update Branches Page

**File: `src/pages/Branches.tsx`**

1. **Form State:** Add `logo_url` to the form state
2. **Branch Interface:** Add `logo_url` to `BranchWithCounts` interface
3. **Dialog Form:** Integrate `BranchLogoUpload` component
4. **Table Display:** 
   - Add "Logo" column as the first column
   - Show uploaded logo or default building icon
5. **Edit Mode:** Load existing `logo_url` when editing

---

### Technical Details

#### Default Avatars (Employee)
```text
Male:   Dicebear avataaars with male styling
Female: Dicebear avataaars with female styling
```

#### Default Logo (Branch)
```text
Building2 icon from Lucide with muted background styling
```

#### Storage Buckets
```text
employee-avatars (existing) → Employee photos
branch-logos (new)          → Branch logos
```

#### File Structure
```text
src/
├── components/
│   ├── branches/
│   │   └── BranchLogoUpload.tsx (new)
│   └── employees/
│       └── EmployeeAvatarUpload.tsx (existing)
└── pages/
    ├── Employees.tsx (update)
    └── Branches.tsx (update)
```

---

### Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| Database | Migration | Add `logo_url` to branches, create storage bucket |
| `BranchLogoUpload.tsx` | Create | New component for logo upload |
| `Branches.tsx` | Update | Add logo column & upload form |
| `Employees.tsx` | Update | Add avatar column display |

