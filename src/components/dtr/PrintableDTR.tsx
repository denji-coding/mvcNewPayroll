import { format, isWeekend } from 'date-fns';

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
    <div className="hidden print:block print-dtr bg-white text-black p-8 font-serif">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wide">Daily Time Record</h1>
        <p className="text-sm mt-1">Migrants Venture Corporation</p>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b pb-4">
        <div className="flex gap-2">
          <span className="font-semibold">Name:</span>
          <span className="border-b border-black flex-1">{employee.first_name} {employee.last_name}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold">Employee ID:</span>
          <span className="border-b border-black flex-1">{employee.employee_id}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold">Position:</span>
          <span className="border-b border-black flex-1">{employee.position}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold">Department:</span>
          <span className="border-b border-black flex-1">{employee.department || 'N/A'}</span>
        </div>
        <div className="flex gap-2 col-span-2">
          <span className="font-semibold">Period:</span>
          <span className="border-b border-black flex-1">{month} {year}</span>
        </div>
      </div>

      {/* DTR Table */}
      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1 w-12">Date</th>
            <th className="border border-black p-1 w-10">Day</th>
            <th className="border border-black p-1" colSpan={2}>Morning</th>
            <th className="border border-black p-1" colSpan={2}>Afternoon</th>
            <th className="border border-black p-1 w-12">Hours</th>
            <th className="border border-black p-1">Remarks</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="border border-black p-1"></th>
            <th className="border border-black p-1"></th>
            <th className="border border-black p-1 w-16">In</th>
            <th className="border border-black p-1 w-16">Out</th>
            <th className="border border-black p-1 w-16">In</th>
            <th className="border border-black p-1 w-16">Out</th>
            <th className="border border-black p-1"></th>
            <th className="border border-black p-1"></th>
          </tr>
        </thead>
        <tbody>
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = attendanceMap.get(dateStr);
            const isWeekendDay = isWeekend(day);
            const isFuture = day > new Date();

            return (
              <tr key={dateStr} className={isWeekendDay ? 'bg-gray-50' : ''}>
                <td className="border border-black p-1 text-center">{format(day, 'dd')}</td>
                <td className="border border-black p-1 text-center">{format(day, 'EEE')}</td>
                <td className="border border-black p-1 text-center">{formatTime(record?.morning_in || null)}</td>
                <td className="border border-black p-1 text-center">{formatTime(record?.morning_out || null)}</td>
                <td className="border border-black p-1 text-center">{formatTime(record?.afternoon_in || null)}</td>
                <td className="border border-black p-1 text-center">{formatTime(record?.afternoon_out || null)}</td>
                <td className="border border-black p-1 text-center">
                  {record?.hours_worked ? record.hours_worked.toFixed(2) : ''}
                </td>
                <td className="border border-black p-1 text-center text-[10px]">
                  {getRemarks(record, isWeekendDay, isFuture)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 text-sm mb-8 p-3 border border-black">
        <div className="text-center">
          <p className="font-semibold">Days Worked</p>
          <p className="text-lg">{summary.daysWorked}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">Total Hours</p>
          <p className="text-lg">{summary.totalHours.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">Late Days</p>
          <p className="text-lg">{summary.lateDays}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">Absent Days</p>
          <p className="text-lg">{summary.absentDays}</p>
        </div>
      </div>

      {/* Signature Lines */}
      <div className="grid grid-cols-2 gap-16 mt-12 text-sm">
        <div className="text-center">
          <div className="border-b border-black h-8 mb-1"></div>
          <p className="font-semibold">Employee Signature</p>
          <p className="text-xs text-gray-600">Date: _________________</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black h-8 mb-1"></div>
          <p className="font-semibold">Verified By (HR)</p>
          <p className="text-xs text-gray-600">Date: _________________</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>This document is system-generated. Printed on {format(new Date(), 'MMMM dd, yyyy hh:mm a')}</p>
      </div>
    </div>
  );
}