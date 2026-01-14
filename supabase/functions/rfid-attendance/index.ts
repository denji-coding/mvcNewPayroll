import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-terminal-secret',
};

interface AttendanceRequest {
  rfid_card_number?: string;
  employee_id?: string;
  timestamp?: string;
}

interface TerminalSettings {
  terminal_enabled?: boolean;
  work_start_time: string;
  work_end_time: string;
  grace_period_minutes: number;
  allow_manual_entry: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify terminal secret for security (optional - only validate if both secret is configured AND header is provided)
    const terminalSecret = Deno.env.get('RFID_TERMINAL_SECRET');
    const providedSecret = req.headers.get('x-terminal-secret');
    
    // Only validate if a secret is configured, not empty, AND a header was actually provided
    // If no header is sent, allow the request (open mode for development/testing)
    if (terminalSecret && terminalSecret.trim() !== '' && providedSecret && providedSecret !== terminalSecret) {
      console.error('Invalid terminal secret provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized terminal' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch terminal settings first to check if terminal is enabled
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'terminal')
      .single();
    
    const settings: TerminalSettings = settingsData?.value || { 
      terminal_enabled: true,
      work_start_time: '08:00', 
      work_end_time: '17:00', 
      grace_period_minutes: 0,
      allow_manual_entry: true
    };

    // Check if terminal is enabled
    if (settings.terminal_enabled === false) {
      return new Response(
        JSON.stringify({ error: 'Attendance terminal is currently disabled' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { rfid_card_number, employee_id, timestamp }: AttendanceRequest = await req.json();

    // Check if manual entry is allowed when using employee_id
    if (employee_id && !rfid_card_number && settings.allow_manual_entry === false) {
      return new Response(
        JSON.stringify({ error: 'Manual entry is disabled. Please use your RFID card.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    if (!rfid_card_number && !employee_id) {
      return new Response(
        JSON.stringify({ error: 'RFID card number or Employee ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input length to prevent abuse
    if (rfid_card_number && rfid_card_number.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid RFID card number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (employee_id && employee_id.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid Employee ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find employee by RFID or Employee ID
    let employeeQuery = supabase
      .from('employees')
      .select('id, first_name, last_name, employee_id, branch_id')
      .eq('employment_status', 'active');

    if (rfid_card_number) {
      employeeQuery = employeeQuery.ilike('rfid_card_number', rfid_card_number);
    } else if (employee_id) {
      // Case-insensitive matching for employee_id
      employeeQuery = employeeQuery.ilike('employee_id', employee_id);
    }

    const { data: employee, error: empError } = await employeeQuery.single();

    if (empError || !employee) {
      console.error('Employee lookup error:', empError);
      return new Response(
        JSON.stringify({ error: 'Employee not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toISOString();

    // Check if employee has ANY schedule assigned
    const { data: allSchedules, error: scheduleCountError } = await supabase
      .from('employee_schedules')
      .select('id')
      .eq('employee_id', employee.id);
    
    if (scheduleCountError) {
      console.error('Schedule count error:', scheduleCountError);
    }

    // If employee has no schedule at all, reject attendance
    if (!allSchedules || allSchedules.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No schedule assigned',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          message: 'No time schedule has been assigned yet. Please contact HR.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check employee schedule for today
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const { data: scheduleData } = await supabase
      .from('employee_schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('day_of_week', dayOfWeek)
      .single();

    // If no schedule for today (employee has schedule but not for this day)
    if (!scheduleData) {
      return new Response(
        JSON.stringify({ 
          error: 'No duty today',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          message: 'You are not scheduled to work today.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If schedule exists but today is not a duty day
    if (!scheduleData.is_duty_day) {
      return new Response(
        JSON.stringify({ 
          error: 'No duty today',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          message: 'You are not scheduled to work today.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing attendance record today
    const { data: existingRecord, error: recordError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .single();

    let result;
    let action: 'time_in' | 'time_out';

    if (!existingRecord) {
      // First scan of the day - Time In
      action = 'time_in';
      
      // Use employee's schedule start time if available, otherwise use terminal settings
      const startTimeStr = scheduleData.start_time || settings.work_start_time;
      const startTime = new Date(today + `T${startTimeStr}`);
      const graceEndTime = new Date(startTime.getTime() + (settings.grace_period_minutes * 60 * 1000));
      
      let lateMinutes = 0;
      if (now > graceEndTime) {
        lateMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      }

      const status = lateMinutes > 0 ? 'late' : 'present';

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: today,
          time_in: currentTime,
          rfid_time_in: rfid_card_number,
          status: status,
          late_minutes: lateMinutes,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      result = data;
    } else if (!existingRecord.time_out) {
      // Second scan - Time Out
      action = 'time_out';
      
      const timeIn = new Date(existingRecord.time_in);
      const hoursWorked = (now.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
      
      // Use employee's schedule end time if available, otherwise use terminal settings
      const endTimeStr = scheduleData.end_time || settings.work_end_time;
      const endTime = new Date(today + `T${endTimeStr}`);
      let undertimeMinutes = 0;
      if (now < endTime) {
        undertimeMinutes = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));
      }

      // Calculate overtime (hours beyond 8)
      let overtimeHours = 0;
      if (hoursWorked > 8) {
        overtimeHours = hoursWorked - 8;
      }

      const { data, error } = await supabase
        .from('attendance')
        .update({
          time_out: currentTime,
          rfid_time_out: rfid_card_number,
          hours_worked: Math.round(hoursWorked * 100) / 100,
          undertime_minutes: undertimeMinutes,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      result = data;
    } else {
      // Already clocked in and out today
      return new Response(
        JSON.stringify({ 
          error: 'Already completed attendance for today',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          time_in: existingRecord.time_in,
          time_out: existingRecord.time_out,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attendance ${action} recorded for ${employee.first_name} ${employee.last_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        employee_id: employee.employee_id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        timestamp: currentTime,
        record: result,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('RFID Attendance Error:', error);
    // Return generic error message to client, log details server-side
    return new Response(
      JSON.stringify({ error: 'Failed to process attendance' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
