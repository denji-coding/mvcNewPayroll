import { format, isWeekend } from 'date-fns';
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

interface Summary {
  daysWorked: number;
  totalHours: number;
  lateDays: number;
  absentDays: number;
}

interface PrintableDTRProps {
  employee: Employee;
  daysInMonth: Date[];
  attendanceMap: Map<string, AttendanceRecord>;
  summary: Summary;
  month: string;
  year: number;
}

export function PrintableDTR({ 
  employee, 
  daysInMonth, 
  attendanceMap, 
  summary, 
  month, 
  year 
}: PrintableDTRProps) {
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'hh:mm a');
  };

  const getRemarks = (record: AttendanceRecord | undefined, isWeekendDay: boolean, isFuture: boolean) => {
    if (isWeekendDay) return 'Weekend';
    if (isFuture) return '';
    if (!record) return 'Absent';
    if (record.status === 'late' || (record.late_minutes && record.late_minutes > 0)) {
      return `Late (${record.late_minutes}m)`;
    }
    if (record.status === 'on_leave') return 'On Leave';
    return '';
  };

  return (
    // Note: Using explicit black/white colors intentionally for print output
    // Print stylesheets require fixed colors that work on paper
    <div className="hidden print:block print-dtr bg-white text-black font-serif" style={{ 
      width: '210mm', 
      minHeight: '297mm',
      padding: '8mm 10mm',
      boxSizing: 'border-box',
      fontSize: '9pt'
    }}>
      {/* Header with Logo */}
      <div className="flex items-start gap-4 mb-3">
        <img src={companyLogo} alt="Company Logo" className="w-16 h-16 object-contain" />
        <div className="flex-1 text-center">
          <h1 className="text-base font-bold uppercase tracking-wide">Daily Time Record</h1>
          <p className="text-xs mt-0.5">Migrants Venture Corporation</p>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-xs border-b pb-2">
        <div className="flex gap-1">
          <span className="font-semibold">Name:</span>
          <span className="border-b border-black flex-1">{employee.first_name} {employee.last_name}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold">Employee ID:</span>
          <span className="border-b border-black flex-1">{employee.employee_id}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold">Position:</span>
          <span className="border-b border-black flex-1">{employee.position}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold">Department:</span>
          <span className="border-b border-black flex-1">{employee.department || 'N/A'}</span>
        </div>
        <div className="flex gap-1 col-span-2">
          <span className="font-semibold">Period:</span>
          <span>{month} {year}</span>
        </div>
      </div>

      {/* DTR Table - Compact for single page */}
      <table className="w-full border-collapse mb-3" style={{ fontSize: '8pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th className="border border-black px-1 py-0.5" style={{ width: '28px' }}>Date</th>
            <th className="border border-black px-1 py-0.5" style={{ width: '28px' }}>Day</th>
            <th className="border border-black px-1 py-0.5" style={{ width: '52px' }}>AM In</th>
            <th className="border border-black px-1 py-0.5" style={{ width: '52px' }}>AM Out</th>
            <th className="border border-black px-1 py-0.5" style={{ width: '52px' }}>PM In</th>
            <th className="border border-black px-1 py-0.5" style={{ width: '52px' }}>PM Out</th>
            <th className="border border-black px-1 py-0.5" style={{ width: '36px' }}>Hours</th>
            <th className="border border-black px-1 py-0.5">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = attendanceMap.get(dateStr);
            const isWeekendDay = isWeekend(day);
            const isFuture = day > new Date();

            return (
              <tr key={dateStr} style={{ backgroundColor: isWeekendDay ? '#f9fafb' : 'white' }}>
                <td className="border border-black px-1 py-0 text-center">{format(day, 'dd')}</td>
                <td className="border border-black px-1 py-0 text-center">{format(day, 'EEE')}</td>
                <td className="border border-black px-1 py-0 text-center" style={{ fontSize: '7pt' }}>{formatTime(record?.morning_in || null)}</td>
                <td className="border border-black px-1 py-0 text-center" style={{ fontSize: '7pt' }}>{formatTime(record?.morning_out || null)}</td>
                <td className="border border-black px-1 py-0 text-center" style={{ fontSize: '7pt' }}>{formatTime(record?.afternoon_in || null)}</td>
                <td className="border border-black px-1 py-0 text-center" style={{ fontSize: '7pt' }}>{formatTime(record?.afternoon_out || null)}</td>
                <td className="border border-black px-1 py-0 text-center">
                  {record?.hours_worked ? record.hours_worked.toFixed(1) : ''}
                </td>
                <td className="border border-black px-1 py-0 text-center" style={{ fontSize: '7pt' }}>
                  {getRemarks(record, isWeekendDay, isFuture)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary - Compact */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-4 p-2 border border-black">
        <div className="text-center">
          <p className="font-semibold text-xs">Days Worked</p>
          <p className="text-sm font-bold">{summary.daysWorked}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-xs">Total Hours</p>
          <p className="text-sm font-bold">{summary.totalHours.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-xs">Late Days</p>
          <p className="text-sm font-bold">{summary.lateDays}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-xs">Absent Days</p>
          <p className="text-sm font-bold">{summary.absentDays}</p>
        </div>
      </div>

      {/* Signature Lines - Compact */}
      <div className="grid grid-cols-2 gap-12 mt-6 text-xs">
        <div className="text-center">
          <div className="border-b border-black h-6 mb-1"></div>
          <p className="font-semibold">Employee Signature</p>
          <p className="text-xs" style={{ color: '#6b7280' }}>Date: _________________</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black h-6 mb-1"></div>
          <p className="font-semibold">Verified By (HR)</p>
          <p className="text-xs" style={{ color: '#6b7280' }}>Date: _________________</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center" style={{ fontSize: '7pt', color: '#6b7280' }}>
        <p>This document is system-generated. Printed on {format(new Date(), 'MMMM dd, yyyy hh:mm a')}</p>
      </div>
    </div>
  );
}