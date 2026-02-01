import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { CreditCard, User, CheckCircle2, XCircle, Clock, Building2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAttendanceTerminal } from '@/hooks/useAttendanceTerminal';
import { cn } from '@/lib/utils';

export default function AttendanceTerminal() {
  const [mode, setMode] = useState<'rfid' | 'manual'>('rfid');
  const [rfidInput, setRfidInput] = useState('');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

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

  const isTerminalEnabled = settings?.terminal_enabled !== false;
  const isManualEntryAllowed = settings?.allow_manual_entry !== false;

  // Auto-focus RFID input
  useEffect(() => {
    if (isTerminalEnabled && !result) {
      if (mode === 'rfid') {
        rfidInputRef.current?.focus();
      } else if (mode === 'manual') {
        manualInputRef.current?.focus();
      }
    }
  }, [mode, result, isTerminalEnabled]);

  // Clear input when result clears
  useEffect(() => {
    if (!result) {
      setRfidInput('');
      setEmployeeIdInput('');
      if (mode === 'rfid') {
        rfidInputRef.current?.focus();
      }
    }
  }, [result, mode]);

  // Force RFID mode if manual entry is disabled
  useEffect(() => {
    if (!isManualEntryAllowed && mode === 'manual') {
      setMode('rfid');
    }
  }, [isManualEntryAllowed, mode]);

  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfidInput.trim()) {
      submitRfidAttendance(rfidInput);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeIdInput.trim()) {
      submitManualAttendance(employeeIdInput);
    }
  };

  const handleModeSwitch = () => {
    if (!isManualEntryAllowed) return;
    clearResult();
    setMode(mode === 'rfid' ? 'manual' : 'rfid');
  };

  // Format action label for display
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

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/80 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-foreground mx-auto mb-4 animate-spin" />
          <p className="text-primary-foreground text-lg">Loading terminal...</p>
        </div>
      </div>
    );
  }

  if (!isTerminalEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted via-muted/95 to-muted/80 flex flex-col">
        <header className="bg-background/10 backdrop-blur-sm border-b border-background/20 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MVC Corporation</h1>
                <p className="text-sm text-muted-foreground">Attendance System</p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Portal</span>
            </a>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <Card className="bg-background shadow-2xl border-0">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 bg-warning/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-warning" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Terminal Disabled
                </h2>
                <p className="text-muted-foreground mb-6">
                  The attendance terminal is currently disabled by the administrator.
                  Please contact HR for assistance.
                </p>
                <a href="/">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Portal
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="bg-background/10 backdrop-blur-sm border-t border-background/20 py-3 px-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MVC Corporation. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/80 flex flex-col">
      <header className="bg-background/10 backdrop-blur-sm border-b border-background/20 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">MVC Corporation</h1>
              <p className="text-sm text-primary-foreground/70">Attendance System</p>
            </div>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Portal</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Digital Clock */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl font-bold text-primary-foreground tracking-tight mb-2">
              {format(currentTime, 'hh:mm:ss')}
              <span className="text-3xl md:text-4xl ml-2">{format(currentTime, 'a')}</span>
            </div>
            <p className="text-xl text-primary-foreground/80">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Attendance Card */}
          <Card className="bg-background shadow-2xl border-0">
            <CardContent className="p-8">
              {result ? (
                <div className="text-center py-8">
                  <div
                    className={cn(
                      'w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center',
                      result.success ? 'bg-success/10' : 'bg-destructive/10'
                    )}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-12 h-12 text-success" />
                    ) : (
                      <XCircle className="w-12 h-12 text-destructive" />
                    )}
                  </div>

                  {result.success ? (
                    <>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {getActionLabel(result.action || '')} RECORDED
                      </h2>
                      <p className="text-xl text-muted-foreground mb-4">{result.employee_name}</p>
                      <p className="text-lg text-muted-foreground">{result.employee_id}</p>
                      {result.timestamp && (
                        <p className="text-muted-foreground mt-2">
                          {format(new Date(result.timestamp), 'hh:mm a')}
                        </p>
                      )}
                      {result.late_minutes && result.late_minutes > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-warning/10 text-warning rounded-full text-sm">
                          <Clock className="w-4 h-4" />
                          Late by {result.late_minutes} minutes
                        </div>
                      )}
                      {result.status === 'present' && result.action === 'morning_in' && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          On Time
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-destructive mb-2">
                        {result.error || 'Attendance Failed'}
                      </h2>
                      {result.employee_name && (
                        <p className="text-muted-foreground">{result.employee_name}</p>
                      )}
                      <p className="text-muted-foreground mt-4">Please try again or contact HR</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {isManualEntryAllowed && (
                    <div className="flex justify-center mb-6">
                      <div className="inline-flex rounded-lg bg-muted p-1">
                        <button
                          onClick={() => setMode('rfid')}
                          className={cn(
                            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                            mode === 'rfid'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <CreditCard className="w-4 h-4 inline-block mr-2" />
                          RFID Card
                        </button>
                        <button
                          onClick={() => setMode('manual')}
                          className={cn(
                            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                            mode === 'manual'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <User className="w-4 h-4 inline-block mr-2" />
                          Employee ID
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Info about 4-time schedule */}
                  <div className="text-center mb-6 text-sm text-muted-foreground">
                    <p>Scan sequence: AM In → AM Out → PM In → PM Out</p>
                  </div>

                  {mode === 'rfid' ? (
                    <form onSubmit={handleRfidSubmit} className="space-y-6">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <CreditCard className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Scan Your ID Card
                        </h2>
                        <p className="text-muted-foreground">
                          Place your RFID card near the scanner
                        </p>
                      </div>
                      
                      <Input
                        ref={rfidInputRef}
                        type="text"
                        value={rfidInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRfidInput(value);
                          // Auto-submit after 300ms of no input (for scanners that don't send Enter)
                          if (value.trim()) {
                            const timeoutId = setTimeout(() => {
                              if (value.trim() && value === rfidInput) {
                                submitRfidAttendance(value);
                              }
                            }, 300);
                            return () => clearTimeout(timeoutId);
                          }
                        }}
                        placeholder="Waiting for card scan..."
                        className="text-center text-lg h-14 bg-muted/50 caret-transparent"
                        autoComplete="off"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && rfidInput.trim()) {
                            e.preventDefault();
                            submitRfidAttendance(rfidInput);
                          }
                        }}
                      />

                      {isManualEntryAllowed && (
                        <p className="text-center text-sm text-muted-foreground">
                          Lost your ID?{' '}
                          <button
                            type="button"
                            onClick={handleModeSwitch}
                            className="text-primary hover:underline font-medium"
                          >
                            Enter Employee ID manually
                          </button>
                        </p>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handleManualSubmit} className="space-y-6">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <User className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Enter Employee ID
                        </h2>
                        <p className="text-muted-foreground">
                          Type your employee ID below
                        </p>
                      </div>

                      <Input
                        ref={manualInputRef}
                        type="text"
                        value={employeeIdInput}
                        onChange={(e) => setEmployeeIdInput(e.target.value.toUpperCase())}
                        placeholder="e.g., EMP-001"
                        className="text-center text-lg h-14 uppercase"
                        autoComplete="off"
                        disabled={isLoading}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg"
                        disabled={!employeeIdInput.trim() || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Submit Attendance'
                        )}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground">
                        <button
                          type="button"
                          onClick={handleModeSwitch}
                          className="text-primary hover:underline font-medium"
                        >
                          ← Back to RFID mode
                        </button>
                      </p>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {isLoading && !result && (
            <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-background p-8 rounded-xl shadow-2xl text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-lg font-medium">Processing attendance...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-background/10 backdrop-blur-sm border-t border-background/20 py-3 px-6">
        <p className="text-center text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} MVC Corporation. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
