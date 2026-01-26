import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import companyLogo from '@/assets/company-logo.png';

interface AttendanceRecord {
  date: string;
  morning_in: string | null;
  morning_out: string | null;
  afternoon_in: string | null;
  afternoon_out: string | null;
  hours_worked: number | null;
  status: string | null;
  late_minutes: number | null;
}

interface Employee {
  first_name: string;
  last_name: string;
  employee_id: string;
  position: string;
  department: string | null;
}

interface MonthData {
  month: number;
  year: number;
  daysInMonth: Date[];
  attendanceMap: Map<string, AttendanceRecord>;
  summary: {
    daysWorked: number;
    totalHours: number;
    lateDays: number;
    absentDays: number;
  };
}

interface GenerateDTRPdfParams {
  employee: Employee;
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

interface GenerateMultiMonthDTRPdfParams {
  employee: Employee;
  monthsData: MonthData[];
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatTime = (timestamp: string | null): string => {
  if (!timestamp) return '-';
  return format(new Date(timestamp), 'hh:mm a');
};

const getRemarks = (record: AttendanceRecord | undefined, isWeekendDay: boolean, isFuture: boolean): string => {
  if (isWeekendDay) return 'Weekend';
  if (isFuture) return '-';
  if (!record) return 'Absent';
  if (record.status === 'late' || (record.late_minutes && record.late_minutes > 0)) return 'Late';
  if (record.status === 'on_leave') return 'On Leave';
  if (record.status === 'present') return 'Present';
  return '-';
};

function addMonthPage(
  doc: jsPDF,
  employee: Employee,
  daysInMonth: Date[],
  attendanceMap: Map<string, AttendanceRecord>,
  summary: { daysWorked: number; totalHours: number; lateDays: number; absentDays: number },
  month: string,
  year: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 15;

  // Add company logo
  try {
    doc.addImage(companyLogo, 'PNG', margin, yPos - 5, 20, 20);
  } catch (e) {
    console.warn('Failed to load logo:', e);
  }

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY TIME RECORD', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Migrants Venture Corporation', pageWidth / 2, yPos, { align: 'center' });

  // Employee Information
  yPos += 10;
  doc.setFontSize(9);
  
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.first_name} ${employee.last_name}`, leftCol + 20, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.employee_id, rightCol + 28, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Position:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.position, leftCol + 20, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Department:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.department || '-', rightCol + 28, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Period:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${month} ${year}`, leftCol + 20, yPos);

  // Prepare table data
  const tableData = daysInMonth.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = attendanceMap.get(dateStr);
    const isWeekendDay = isWeekend(day);
    const isFuture = day > new Date();

    return [
      format(day, 'dd'),
      format(day, 'EEE'),
      isWeekendDay ? '-' : formatTime(record?.morning_in ?? null),
      isWeekendDay ? '-' : formatTime(record?.morning_out ?? null),
      isWeekendDay ? '-' : formatTime(record?.afternoon_in ?? null),
      isWeekendDay ? '-' : formatTime(record?.afternoon_out ?? null),
      isWeekendDay ? '-' : (record?.hours_worked ? record.hours_worked.toFixed(2) : '-'),
      getRemarks(record, isWeekendDay, isFuture)
    ];
  });

  // Generate table
  yPos += 8;
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Day', 'AM In', 'AM Out', 'PM In', 'PM Out', 'Hours', 'Remarks']],
    body: tableData,
    styles: { 
      fontSize: 7, 
      cellPadding: 1.2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 'auto', halign: 'center' }
    },
    theme: 'grid',
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const remarks = data.row.raw?.[7];
        if (remarks === 'Weekend') {
          data.cell.styles.fillColor = [248, 248, 248];
          data.cell.styles.textColor = [128, 128, 128];
        } else if (remarks === 'Absent') {
          data.cell.styles.textColor = [220, 38, 38];
        } else if (remarks === 'Late') {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    }
  });

  // Get final Y position after table
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  yPos = finalY + 8;

  // Summary section
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  const summaryY = yPos;
  const colWidth = (pageWidth - 2 * margin) / 4;
  
  doc.text(`Days Worked: ${summary.daysWorked}`, margin, summaryY);
  doc.text(`Total Hours: ${summary.totalHours.toFixed(1)}`, margin + colWidth, summaryY);
  doc.text(`Late Days: ${summary.lateDays}`, margin + colWidth * 2, summaryY);
  doc.text(`Absent Days: ${summary.absentDays}`, margin + colWidth * 3, summaryY);

  // Signature lines
  yPos = summaryY + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  const signatureWidth = 50;
  const leftSignX = margin + 20;
  const rightSignX = pageWidth - margin - signatureWidth - 20;
  
  doc.line(leftSignX, yPos, leftSignX + signatureWidth, yPos);
  doc.text('Employee Signature', leftSignX + signatureWidth / 2, yPos + 4, { align: 'center' });
  doc.text('Date: ___________', leftSignX + signatureWidth / 2, yPos + 9, { align: 'center' });
  
  doc.line(rightSignX, yPos, rightSignX + signatureWidth, yPos);
  doc.text('Verified By (HR)', rightSignX + signatureWidth / 2, yPos + 4, { align: 'center' });
  doc.text('Date: ___________', rightSignX + signatureWidth / 2, yPos + 9, { align: 'center' });

  // Footer
  yPos += 18;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPos, { align: 'center' });
}

export function generateDTRPdf(params: GenerateDTRPdfParams): void {
  const { employee, daysInMonth, attendanceMap, summary, month, year } = params;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  addMonthPage(doc, employee, daysInMonth, attendanceMap, summary, month, year);

  const fileName = `DTR_${employee.last_name}_${employee.first_name}_${month}_${year}.pdf`;
  doc.save(fileName);
}

export function generateMultiMonthDTRPdf(params: GenerateMultiMonthDTRPdfParams): void {
  const { employee, monthsData } = params;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  monthsData.forEach((monthData, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    const monthName = months[monthData.month];
    addMonthPage(
      doc, 
      employee, 
      monthData.daysInMonth, 
      monthData.attendanceMap, 
      monthData.summary, 
      monthName, 
      monthData.year
    );
  });

  // Generate filename based on date range
  const firstMonth = monthsData[0];
  const lastMonth = monthsData[monthsData.length - 1];
  const startLabel = `${months[firstMonth.month].substring(0, 3)}${firstMonth.year}`;
  const endLabel = `${months[lastMonth.month].substring(0, 3)}${lastMonth.year}`;
  
  const fileName = monthsData.length === 1
    ? `DTR_${employee.last_name}_${employee.first_name}_${months[firstMonth.month]}_${firstMonth.year}.pdf`
    : `DTR_${employee.last_name}_${employee.first_name}_${startLabel}-${endLabel}.pdf`;
  
  doc.save(fileName);
}

// Helper to generate months data from date range
export function generateMonthsFromRange(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): { month: number; year: number }[] {
  const result: { month: number; year: number }[] = [];
  
  let currentMonth = startMonth;
  let currentYear = startYear;
  
  while (
    currentYear < endYear || 
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    result.push({ month: currentMonth, year: currentYear });
    
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  
  return result;
}

export function getDaysInMonth(month: number, year: number): Date[] {
  const date = new Date(year, month, 1);
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

export function calculateSummary(
  attendance: AttendanceRecord[] | undefined,
  daysInMonth: Date[]
): { daysWorked: number; totalHours: number; lateDays: number; absentDays: number } {
  if (!attendance) return { daysWorked: 0, totalHours: 0, lateDays: 0, absentDays: 0 };
  
  const daysWorked = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
  const lateDays = attendance.filter(a => (a.late_minutes || 0) > 0).length;
  const attendedDates = new Set(attendance.map(a => a.date));
  const absentDays = daysInMonth.filter(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return !isWeekend(day) && !attendedDates.has(dateStr) && day <= new Date();
  }).length;

  return { daysWorked, totalHours, lateDays, absentDays };
}
