

# Export to PDF Feature for Daily Time Record

## Overview

This plan adds a direct PDF export button to the DTR page that generates a downloadable PDF file without opening the browser's print dialog. The PDF will match the same official Philippine DTR format used in the print version.

## Technical Approach

**Library Selection**: `jsPDF` with `jspdf-autotable` plugin

- **jsPDF**: Core PDF generation library (small, well-maintained, TypeScript support)
- **jspdf-autotable**: Plugin specifically designed for creating tables in PDFs with automatic pagination and styling

This approach is preferred over alternatives like:
- `html2canvas` + `jsPDF` (slower, quality issues with scaling)
- `react-pdf` (more complex, better suited for viewing PDFs)
- Server-side PDF generation (unnecessary for this use case)

## Implementation Details

### 1. Install Dependencies

Add the following packages:
```bash
jspdf ^2.5.1
jspdf-autotable ^3.8.2
```

### 2. Create PDF Generator Utility

Create a new utility file `src/lib/generateDTRPdf.ts` that:
- Accepts the same props as `PrintableDTR` (employee, attendance data, summary, month, year)
- Generates an A4 portrait PDF with:
  - Company header ("Migrants Venture Corporation")
  - Employee information section
  - DTR table with all 31 days using autoTable
  - Summary statistics
  - Signature lines for employee and HR
  - Footer with generation timestamp
- Returns the jsPDF document for download

### 3. Update DailyTimeRecord Page

Modify `src/pages/DailyTimeRecord.tsx` to:
- Import the PDF generator utility
- Add an "Export PDF" button next to the existing "Print DTR" button
- Implement `handleExportPDF` function that:
  - Calls the PDF generator
  - Triggers download with filename: `DTR_[EmployeeName]_[Month]_[Year].pdf`

## PDF Document Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY TIME RECORD                             │
│               Migrants Venture Corporation                       │
│                                                                  │
│  Name: John Doe              Employee ID: EMP-001                │
│  Position: Developer         Department: IT                      │
│  Period: January 2026                                            │
├─────────────────────────────────────────────────────────────────┤
│ Date │ Day │ AM In  │ AM Out │ PM In  │ PM Out │ Hours │ Remarks │
├──────┼─────┼────────┼────────┼────────┼────────┼───────┼─────────┤
│ 01   │ Mon │ 08:00  │ 12:00  │ 13:00  │ 17:00  │ 8.0   │         │
│ 02   │ Tue │ 08:15  │ 12:00  │ 13:00  │ 17:00  │ 7.8   │ Late    │
│ ...  │     │        │        │        │        │       │         │
├─────────────────────────────────────────────────────────────────┤
│ Days Worked: 22  │ Total Hours: 176  │ Late: 3  │ Absent: 1     │
├─────────────────────────────────────────────────────────────────┤
│  _____________________          _____________________            │
│  Employee Signature             Verified By (HR)                 │
│  Date: ___________              Date: ___________                │
├─────────────────────────────────────────────────────────────────┤
│ Generated on: January 26, 2026 10:30 AM                         │
└─────────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/generateDTRPdf.ts` | Create | PDF generation utility using jsPDF + autoTable |
| `src/pages/DailyTimeRecord.tsx` | Modify | Add Export PDF button and handler |
| `package.json` | Modify | Add jspdf and jspdf-autotable dependencies |

## Button UI Design

The Export PDF button will be placed next to the Print button:

```tsx
<div className="flex gap-2">
  <Button onClick={handlePrint} variant="outline">
    <Printer className="h-4 w-4 mr-2" />
    Print DTR
  </Button>
  <Button onClick={handleExportPDF}>
    <Download className="h-4 w-4 mr-2" />
    Export PDF
  </Button>
</div>
```

---

## Technical Details

### PDF Generator Function Signature

```typescript
interface GenerateDTRPdfParams {
  employee: {
    first_name: string;
    last_name: string;
    employee_id: string;
    position: string;
    department: string | null;
  };
  daysInMonth: Date[];
  attendanceMap: Map<string, AttendanceRecord>;
  summary: {
    daysWorked: number;
    totalHours: number;
    lateDays: number;
    absentDays: number;
  };
  month: string;
  year: number;
}

function generateDTRPdf(params: GenerateDTRPdfParams): void {
  // Creates and downloads PDF
}
```

### autoTable Configuration

```typescript
doc.autoTable({
  startY: 60,
  head: [['Date', 'Day', 'AM In', 'AM Out', 'PM In', 'PM Out', 'Hours', 'Remarks']],
  body: tableData,
  styles: { fontSize: 8, cellPadding: 1.5 },
  headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
  columnStyles: {
    0: { cellWidth: 12 },  // Date
    1: { cellWidth: 12 },  // Day
    2: { cellWidth: 20 },  // AM In
    3: { cellWidth: 20 },  // AM Out
    4: { cellWidth: 20 },  // PM In
    5: { cellWidth: 20 },  // PM Out
    6: { cellWidth: 15 },  // Hours
    7: { cellWidth: 'auto' }  // Remarks
  },
  theme: 'grid'
});
```

### TypeScript Type Declaration

Since jspdf-autotable extends jsPDF, we need to add the type augmentation:

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// The autoTable function adds itself to jsPDF prototype
```

