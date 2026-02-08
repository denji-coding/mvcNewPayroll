import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CreditCard, User, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Calendar } from 'lucide-react';
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
  const lastKeystrokeTimeRef = useRef<number>(0);
  const rfidBufferRef = useRef<string>('');

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

  // RFID scanners send characters very rapidly (<50ms between keystrokes)
  // Human typing is much slower. We use this to distinguish scanner vs keyboard.
  const handleRfidKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeSinceLastKey = now - lastKeystrokeTimeRef.current;
    lastKeystrokeTimeRef.current = now;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
      // Only submit if buffer was built from rapid input (scanner)
      if (rfidBufferRef.current.trim() && !isLoading) {
        setRfidInput(rfidBufferRef.current);
        submitRfidAttendance(rfidBufferRef.current);
      }
      rfidBufferRef.current = '';
      setRfidInput('');
      return;
    }

    // Ignore non-printable keys
    if (e.key.length !== 1) return;

    // If time between keystrokes > 80ms, it's likely manual typing — reset buffer
    if (timeSinceLastKey > 80 && rfidBufferRef.current.length > 0) {
      rfidBufferRef.current = '';
      setRfidInput('');
    }

    rfidBufferRef.current += e.key;
    // Don't show the value — keep input visually empty
    e.preventDefault();

    // Auto-submit after 300ms idle (scanner finishes quickly)
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    autoSubmitTimeoutRef.current = setTimeout(() => {
      if (rfidBufferRef.current.trim() && !isLoading) {
        setRfidInput(rfidBufferRef.current);
        submitRfidAttendance(rfidBufferRef.current);
        rfidBufferRef.current = '';
        setRfidInput('');
      }
    }, 300);
  }, [submitRfidAttendance, isLoading]);

  const handleRfidChange = useCallback((_value: string) => {
    // Prevent manual input — all handling is done via onKeyDown
  }, []);

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
                  value=""
                  onChange={() => {}}
                  placeholder="Waiting for RFID scan..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-center caret-transparent cursor-default"
                  autoComplete="off"
                  autoFocus
                  disabled={isLoading}
                  readOnly
                  style={{ color: 'transparent' }}
                  onKeyDown={handleRfidKeyDown}
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

          {/* Submit Button - Only for manual mode */}
          {mode === 'manual' && (
            <div>
              <Button
                onClick={() => {
                  if (employeeIdInput.trim()) {
                    submitManualAttendance(employeeIdInput);
                  }
                }}
                disabled={isLoading || !employeeIdInput.trim()}
                className="w-full h-12 bg-white text-[#1a3d2b] font-semibold hover:bg-white/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                )}
                Submit
              </Button>
            </div>
          )}
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
        <div className="flex items-center justify-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#1a3d2b] to-[#2d5a40] border-0">
                  <TableHead className="w-14 text-white font-semibold text-xs uppercase tracking-wider py-4">No.</TableHead>
                  <TableHead className="w-20 text-white font-semibold text-xs uppercase tracking-wider py-4">Photo</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-4">Employee ID</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-4">Full Name</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-4">Position</TableHead>
                  <TableHead className="text-center text-white font-semibold text-xs uppercase tracking-wider py-4">
                    <div className="flex flex-col items-center">
                      <span>Morning</span>
                      <span className="text-white/70 text-[10px] font-normal">In</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white font-semibold text-xs uppercase tracking-wider py-4">
                    <div className="flex flex-col items-center">
                      <span>Morning</span>
                      <span className="text-white/70 text-[10px] font-normal">Out</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white font-semibold text-xs uppercase tracking-wider py-4">
                    <div className="flex flex-col items-center">
                      <span>Afternoon</span>
                      <span className="text-white/70 text-[10px] font-normal">In</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white font-semibold text-xs uppercase tracking-wider py-4">
                    <div className="flex flex-col items-center">
                      <span>Afternoon</span>
                      <span className="text-white/70 text-[10px] font-normal">Out</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords && attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record: any, index: number) => (
                    <TableRow 
                      key={record.id} 
                      className={`border-b border-gray-100 transition-colors hover:bg-green-50/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <TableCell className="font-medium text-gray-500 text-sm py-4">
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-4">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                          <AvatarImage src={record.employees?.avatar_url} className="object-cover" />
                          <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-green-100 to-green-200 text-green-700">
                            {record.employees?.first_name?.[0]}{record.employees?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-mono font-medium">
                          {record.employees?.employee_id || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-medium text-gray-900">
                          {record.employees?.first_name} {record.employees?.last_name}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-gray-600 text-sm">
                          {record.employees?.position || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {record.morning_in ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            {format(new Date(record.morning_in), 'hh:mm a')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {record.morning_out ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            {format(new Date(record.morning_out), 'hh:mm a')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {record.afternoon_in ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            {format(new Date(record.afternoon_in), 'hh:mm a')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {record.afternoon_out ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                            {format(new Date(record.afternoon_out), 'hh:mm a')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No attendance records for today</p>
                        <p className="text-gray-400 text-sm">Records will appear here as employees clock in</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
