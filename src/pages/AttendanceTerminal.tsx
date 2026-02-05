import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CreditCard, User, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, LogIn, LogOut, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAttendanceTerminal } from '@/hooks/useAttendanceTerminal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import companyLogo from '@/assets/company-logo.png';

export default function AttendanceTerminal() {
  const [mode, setMode] = useState<'rfid' | 'manual'>('rfid');
  const [rfidInput, setRfidInput] = useState('');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentTime,
    isLoading,
    result,
    settings,
    settingsLoading,
    submitRfidAttendance,
    submitManualAttendance,
    clearResult,
  } = useAttendanceTerminal();

  // Fetch today's attendance records
  const { data: attendanceRecords, refetch: refetchAttendance } = useQuery({
    queryKey: ['terminal-attendance', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, employees(first_name, last_name, employee_id, position, avatar_url)')
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Refetch attendance when a successful result is recorded
  useEffect(() => {
    if (result?.success) {
      refetchAttendance();
    }
  }, [result, refetchAttendance]);

  const isTerminalEnabled = settings?.terminal_enabled !== false;
  const isManualEntryAllowed = settings?.allow_manual_entry !== false;

  // Auto-focus RFID input
  useEffect(() => {
    if (isTerminalEnabled && !result && !isLoading) {
      const focusInput = () => {
        if (mode === 'rfid' && rfidInputRef.current && document.activeElement !== rfidInputRef.current) {
          rfidInputRef.current.focus();
        } else if (mode === 'manual' && manualInputRef.current && document.activeElement !== manualInputRef.current) {
          manualInputRef.current.focus();
        }
      };
      
      focusInput();
      const focusInterval = setInterval(focusInput, 500);
      return () => clearInterval(focusInterval);
    }
  }, [mode, result, isTerminalEnabled, isLoading]);

  useEffect(() => {
    if (!result) {
      setRfidInput('');
      setEmployeeIdInput('');
    }
  }, [result]);

  useEffect(() => {
    if (!isManualEntryAllowed && mode === 'manual') {
      setMode('rfid');
    }
  }, [isManualEntryAllowed, mode]);

  const handleRfidChange = useCallback((value: string) => {
    setRfidInput(value);
    
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    
    if (value.trim() && !isLoading) {
      autoSubmitTimeoutRef.current = setTimeout(() => {
        if (value.trim()) {
          submitRfidAttendance(value);
        }
      }, 300);
    }
  }, [submitRfidAttendance, isLoading]);

  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    if (rfidInput.trim() && !isLoading) {
      submitRfidAttendance(rfidInput);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeIdInput.trim() && !isLoading) {
      submitManualAttendance(employeeIdInput);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      morning_in: 'MORNING IN',
      morning_out: 'MORNING OUT',
      afternoon_in: 'AFTERNOON IN',
      afternoon_out: 'AFTERNOON OUT',
      time_in: 'TIME IN',
      time_out: 'TIME OUT',
    };
    return labels[action] || action?.toUpperCase().replace('_', ' ');
  };

  // Force light mode styles - all hardcoded to light theme
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-700 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500 text-lg">Loading terminal...</p>
        </div>
      </div>
    );
  }

  if (!isTerminalEnabled) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Terminal Disabled</h2>
          <p className="text-gray-500 mb-6">
            The attendance terminal is currently disabled by the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Sidebar - Dark Panel */}
      <div className="w-72 bg-[#1a3d2b] text-white flex flex-col">
        {/* Logo and Company Name */}
        <div className="p-6 text-center border-b border-white/10">
          <img 
            src={companyLogo} 
            alt="Company Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-lg font-bold">Migrants Venture Corporation</h1>
          <p className="text-sm text-white/70 mt-1">Employee Attendance System</p>
        </div>

        {/* Input Section */}
        <div className="flex-1 p-6">
          {/* Mode Switch - Moved to top */}
          {isManualEntryAllowed && (
            <div className="mb-6 pb-4 border-b border-white/10">
              <p className="text-xs text-white/60 text-center mb-3">Input Mode</p>
              <div className="flex rounded-lg bg-white/10 p-1">
                <button
                  onClick={() => setMode('rfid')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    mode === 'rfid'
                      ? 'bg-white text-[#1a3d2b]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3 h-3 inline-block mr-1" />
                  RFID
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    mode === 'manual'
                      ? 'bg-white text-[#1a3d2b]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3 inline-block mr-1" />
                  Manual
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white/80">
              {mode === 'rfid' ? 'RFID Card Number' : 'Employee ID'}
            </label>
            {mode === 'rfid' ? (
              <form onSubmit={handleRfidSubmit}>
                <Input
                  ref={rfidInputRef}
                  type="text"
                  value={rfidInput}
                  onChange={(e) => handleRfidChange(e.target.value)}
                  placeholder="Scan RFID card..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-center"
                  autoComplete="off"
                  autoFocus
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (autoSubmitTimeoutRef.current) {
                        clearTimeout(autoSubmitTimeoutRef.current);
                      }
                      if (rfidInput.trim() && !isLoading) {
                        submitRfidAttendance(rfidInput);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (mode === 'rfid' && !result && !isLoading) {
                      setTimeout(() => rfidInputRef.current?.focus(), 100);
                    }
                  }}
                />
              </form>
            ) : (
              <form onSubmit={handleManualSubmit}>
                <Input
                  ref={manualInputRef}
                  type="text"
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value.toUpperCase())}
                  placeholder="Enter Employee ID"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-center uppercase"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </form>
            )}
          </div>

          {/* Time In/Out Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                if (mode === 'rfid' && rfidInput.trim()) {
                  submitRfidAttendance(rfidInput);
                } else if (mode === 'manual' && employeeIdInput.trim()) {
                  submitManualAttendance(employeeIdInput);
                }
              }}
              disabled={isLoading || (mode === 'rfid' ? !rfidInput.trim() : !employeeIdInput.trim())}
              className="w-full h-12 bg-transparent border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
              variant="outline"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Time In
            </Button>
            <Button
              onClick={() => {
                if (mode === 'rfid' && rfidInput.trim()) {
                  submitRfidAttendance(rfidInput);
                } else if (mode === 'manual' && employeeIdInput.trim()) {
                  submitManualAttendance(employeeIdInput);
                }
              }}
              disabled={isLoading || (mode === 'rfid' ? !rfidInput.trim() : !employeeIdInput.trim())}
              className="w-full h-12 bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              variant="outline"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Time Out
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-white/50 border-t border-white/10">
          © {new Date().getFullYear()} MVC Corporation
        </div>
      </div>

      {/* Right Main Panel - Force light mode */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Clock Display */}
        <div className="text-center py-8 border-b border-gray-200">
          <div className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight mb-2">
            {format(currentTime, 'hh:mm:ss')}
            <span className="text-3xl md:text-4xl ml-2 text-gray-500">{format(currentTime, 'a')}</span>
          </div>
          <p className="text-gray-500">
            Scan your ID card or enter your Employee ID to log attendance
          </p>
        </div>

        {/* Date Display */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="flex-1 overflow-auto p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 text-gray-700">No.</TableHead>
                <TableHead className="w-16 text-gray-700">Photo</TableHead>
                <TableHead className="text-gray-700">Name</TableHead>
                <TableHead className="text-gray-700">Position</TableHead>
                <TableHead className="text-center text-gray-700">Morning In</TableHead>
                <TableHead className="text-center text-gray-700">Morning Out</TableHead>
                <TableHead className="text-center text-gray-700">Afternoon In</TableHead>
                <TableHead className="text-center text-gray-700">Afternoon Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords && attendanceRecords.length > 0 ? (
                attendanceRecords.map((record: any, index: number) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={record.employees?.avatar_url} />
                        <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                          {record.employees?.first_name?.[0]}{record.employees?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {record.employees?.first_name} {record.employees?.last_name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {record.employees?.position || '-'}
                    </TableCell>
                    <TableCell className="text-center text-gray-700">
                      {record.morning_in ? format(new Date(`2000-01-01T${record.morning_in}`), 'hh:mm a') : '-'}
                    </TableCell>
                    <TableCell className="text-center text-gray-700">
                      {record.morning_out ? format(new Date(`2000-01-01T${record.morning_out}`), 'hh:mm a') : '-'}
                    </TableCell>
                    <TableCell className="text-center text-gray-700">
                      {record.afternoon_in ? format(new Date(`2000-01-01T${record.afternoon_in}`), 'hh:mm a') : '-'}
                    </TableCell>
                    <TableCell className="text-center text-gray-700">
                      {record.afternoon_out ? format(new Date(`2000-01-01T${record.afternoon_out}`), 'hh:mm a') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    No attendance records for today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Result Overlay */}
      {result && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                result.success ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>

            {result.success ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {getActionLabel(result.action || '')} RECORDED
                </h2>
                <p className="text-xl text-gray-600 mb-4">{result.employee_name}</p>
                <p className="text-lg text-gray-500">{result.employee_id}</p>
                {result.timestamp && (
                  <p className="text-gray-500 mt-2">
                    {format(new Date(result.timestamp), 'hh:mm a')}
                  </p>
                )}
                {result.late_minutes && result.late_minutes > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    <Clock className="w-4 h-4" />
                    Late by {result.late_minutes} minutes
                  </div>
                )}
                {result.status === 'present' && result.action === 'morning_in' && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    On Time
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-red-600 mb-2">
                  {result.error || 'Attendance Failed'}
                </h2>
                {result.employee_name && (
                  <p className="text-gray-600">{result.employee_name}</p>
                )}
                <p className="text-gray-500 mt-4">Please try again or contact HR</p>
              </>
            )}

            <Button
              onClick={clearResult}
              className="mt-6 bg-green-700 hover:bg-green-800 text-white"
              size="lg"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && !result && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-2xl text-center">
            <Loader2 className="w-12 h-12 text-green-700 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium text-gray-900">Processing attendance...</p>
          </div>
        </div>
      )}
    </div>
  );
}
