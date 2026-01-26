import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import companyLogo from '@/assets/company-logo.png';

interface PayslipEmployee {
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string | null;
}

interface PayrollData {
  period_start: string;
  period_end: string;
  pay_date: string;
  basic_pay: number;
  days_worked: number;
  overtime_pay: number;
  holiday_pay: number;
  night_differential: number;
  total_allowances: number;
  allowances_breakdown: Record<string, number>;
  gross_pay: number;
  sss_contribution: number;
  philhealth_contribution: number;
  pagibig_contribution: number;
  withholding_tax: number;
  other_deductions: number;
  deductions_breakdown: Record<string, number>;
  total_deductions: number;
  net_pay: number;
}

interface GeneratePayslipPdfParams {
  employee: PayslipEmployee;
  payroll: PayrollData;
}

const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function generatePayslipPdf({ employee, payroll }: GeneratePayslipPdfParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

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
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', pageWidth / 2, yPos + 5, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Migrants Venture Corporation', pageWidth / 2, yPos, { align: 'center' });

  // Pay Period
  yPos += 8;
  doc.setFontSize(9);
  const periodLabel = `Pay Period: ${format(new Date(payroll.period_start), 'MMM d')} - ${format(new Date(payroll.period_end), 'MMM d, yyyy')}`;
  doc.text(periodLabel, pageWidth / 2, yPos, { align: 'center' });

  // Employee Information Box
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, 'F');
  
  yPos += 7;
  doc.setFontSize(9);
  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.first_name} ${employee.last_name}`, leftCol + 32, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.employee_id, rightCol + 28, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Position:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.position, leftCol + 32, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Department:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.department || '-', rightCol + 28, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Date:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(payroll.pay_date), 'MMMM d, yyyy'), leftCol + 32, yPos);

  // Earnings Section
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text('EARNINGS', margin, yPos);
  doc.setTextColor(0, 0, 0);

  const earningsData = [
    ['Basic Pay', `${payroll.days_worked} days`, formatCurrency(payroll.basic_pay)],
    ['Overtime Pay', '', formatCurrency(payroll.overtime_pay)],
    ['Holiday Pay', '', formatCurrency(payroll.holiday_pay)],
    ['Night Differential', '', formatCurrency(payroll.night_differential)],
  ];

  // Add allowances breakdown
  if (payroll.allowances_breakdown && Object.keys(payroll.allowances_breakdown).length > 0) {
    Object.entries(payroll.allowances_breakdown).forEach(([name, amount]) => {
      earningsData.push([name, '', formatCurrency(amount as number)]);
    });
  } else if (payroll.total_allowances > 0) {
    earningsData.push(['Allowances', '', formatCurrency(payroll.total_allowances)]);
  }

  yPos += 3;
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Details', 'Amount']],
    body: earningsData,
    foot: [['GROSS PAY', '', formatCurrency(payroll.gross_pay)]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  });

  // Deductions Section
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('DEDUCTIONS', margin, yPos);
  doc.setTextColor(0, 0, 0);

  const deductionsData = [
    ['SSS Contribution', formatCurrency(payroll.sss_contribution)],
    ['PhilHealth Contribution', formatCurrency(payroll.philhealth_contribution)],
    ['Pag-IBIG Contribution', formatCurrency(payroll.pagibig_contribution)],
    ['Withholding Tax', formatCurrency(payroll.withholding_tax)],
  ];

  // Add other deductions breakdown
  if (payroll.deductions_breakdown && Object.keys(payroll.deductions_breakdown).length > 0) {
    Object.entries(payroll.deductions_breakdown).forEach(([name, amount]) => {
      deductionsData.push([name, formatCurrency(amount as number)]);
    });
  } else if (payroll.other_deductions > 0) {
    deductionsData.push(['Other Deductions', formatCurrency(payroll.other_deductions)]);
  }

  yPos += 3;
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: deductionsData,
    foot: [['TOTAL DEDUCTIONS', formatCurrency(payroll.total_deductions)]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  });

  // Net Pay Box
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('NET PAY', margin + 10, yPos + 11);
  doc.setFontSize(14);
  doc.text(formatCurrency(payroll.net_pay), pageWidth - margin - 10, yPos + 11, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Footer
  yPos += 30;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPos, { align: 'center' });

  // Download
  const periodStr = format(new Date(payroll.period_start), 'MMMdd') + '-' + format(new Date(payroll.period_end), 'MMMdd_yyyy');
  const fileName = `Payslip_${employee.last_name}_${employee.first_name}_${periodStr}.pdf`;
  doc.save(fileName);
}
