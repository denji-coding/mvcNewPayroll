import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceResult {
  success: boolean;
  action?: 'time_in' | 'time_out';
  employee_id?: string;
  employee_name?: string;
  timestamp?: string;
  error?: string;
  late_minutes?: number;
  status?: string;
}

export function useAttendanceTerminal() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-clear result after 5 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const submitRfidAttendance = useCallback(async (rfidCardNumber: string) => {
    if (!rfidCardNumber.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfid-attendance', {
        body: { rfid_card_number: rfidCardNumber.trim() },
      });

      if (error) {
        setResult({ success: false, error: error.message || 'Failed to process attendance' });
        return;
      }

      if (data.error) {
        setResult({ success: false, error: data.error, employee_name: data.employee_name });
        return;
      }

      setResult({
        success: true,
        action: data.action,
        employee_id: data.employee_id,
        employee_name: data.employee_name,
        timestamp: data.timestamp,
        late_minutes: data.record?.late_minutes,
        status: data.record?.status,
      });
    } catch (err) {
      console.error('RFID attendance error:', err);
      setResult({ success: false, error: 'Connection error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const submitManualAttendance = useCallback(async (employeeId: string) => {
    if (!employeeId.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfid-attendance', {
        body: { employee_id: employeeId.trim() },
      });

      if (error) {
        setResult({ success: false, error: error.message || 'Failed to process attendance' });
        return;
      }

      if (data.error) {
        setResult({ success: false, error: data.error, employee_name: data.employee_name });
        return;
      }

      setResult({
        success: true,
        action: data.action,
        employee_id: data.employee_id,
        employee_name: data.employee_name,
        timestamp: data.timestamp,
        late_minutes: data.record?.late_minutes,
        status: data.record?.status,
      });
    } catch (err) {
      console.error('Manual attendance error:', err);
      setResult({ success: false, error: 'Connection error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    currentTime,
    isLoading,
    result,
    submitRfidAttendance,
    submitManualAttendance,
    clearResult,
  };
}
