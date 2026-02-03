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

    // Verify terminal secret for security
    const terminalSecret = Deno.env.get('RFID_TERMINAL_SECRET');
    const providedSecret = req.headers.get('x-terminal-secret');
    
    if (terminalSecret && terminalSecret.trim() !== '' && providedSecret && providedSecret !== terminalSecret) {
      console.error('Invalid terminal secret provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized terminal' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch terminal settings
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

    if (settings.terminal_enabled === false) {
      return new Response(
        JSON.stringify({ error: 'Attendance terminal is currently disabled' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { rfid_card_number, employee_id, timestamp }: AttendanceRequest = await req.json();

    if (employee_id && !rfid_card_number && settings.allow_manual_entry === false) {
      return new Response(
        JSON.stringify({ error: 'Manual entry is disabled. Please use your RFID card.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rfid_card_number && !employee_id) {
      return new Response(
        JSON.stringify({ error: 'RFID card number or Employee ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((rfid_card_number && rfid_card_number.length > 50) || (employee_id && employee_id.length > 50)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find employee
    let employeeQuery = supabase
      .from('employees')
      .select('id, first_name, last_name, employee_id, branch_id')
      .eq('employment_status', 'active');

    if (rfid_card_number) {
      employeeQuery = employeeQuery.ilike('rfid_card_number', rfid_card_number);
    } else if (employee_id) {
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

    // Check for approved leave
    const { data: activeLeave } = await supabase
      .from('leave_requests')
      .select('id, leave_type, start_date, end_date')
      .eq('employee_id', employee.id)
      .eq('status', 'hr_approved')
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle();

    if (activeLeave) {
      console.log(`Employee ${employee.first_name} ${employee.last_name} is on leave`);
      return new Response(
        JSON.stringify({ 
          error: 'Currently on leave',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          message: `You are on ${activeLeave.leave_type} leave until ${activeLeave.end_date}. Attendance is not required.`,
          leave_type: activeLeave.leave_type,
          leave_end: activeLeave.end_date
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if employee has any schedule
    const { data: allSchedules } = await supabase
      .from('employee_schedules')
      .select('id')
      .eq('employee_id', employee.id);
    
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

    // Check today's schedule
    const dayOfWeek = now.getDay();
    const { data: scheduleData } = await supabase
      .from('employee_schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!scheduleData || !scheduleData.is_duty_day) {
      return new Response(
        JSON.stringify({ 
          error: 'No duty today',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          message: 'You are not scheduled to work today.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing attendance record
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .single();

    // 4-Time Schedule Logic:
    // 1st scan -> morning_in
    // 2nd scan -> morning_out
    // 3rd scan -> afternoon_in  
    // 4th scan -> afternoon_out
    
    let result;
    let action: 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out';

    const morningStart = scheduleData.morning_start || '08:00';
    const morningEnd = scheduleData.morning_end || '12:00';
    const afternoonStart = scheduleData.afternoon_start || '13:00';
    const afternoonEnd = scheduleData.afternoon_end || '17:00';

    if (!existingRecord) {
      // 1st scan - Morning In
      action = 'morning_in';
      
      const startTime = new Date(`${today}T${morningStart}`);
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
          morning_in: currentTime,
          rfid_time_in: rfid_card_number,
          status: status,
          late_minutes: lateMinutes,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else if (!existingRecord.morning_out) {
      // 2nd scan - Morning Out
      action = 'morning_out';

      const { data, error } = await supabase
        .from('attendance')
        .update({
          morning_out: currentTime,
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else if (!existingRecord.afternoon_in) {
      // 3rd scan - Afternoon In
      action = 'afternoon_in';

      const { data, error } = await supabase
        .from('attendance')
        .update({
          afternoon_in: currentTime,
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else if (!existingRecord.afternoon_out) {
      // 4th scan - Afternoon Out
      action = 'afternoon_out';

      // Calculate hours worked
      const morningIn = existingRecord.morning_in ? new Date(existingRecord.morning_in) : null;
      const morningOut = existingRecord.morning_out ? new Date(existingRecord.morning_out) : null;
      const afternoonIn = existingRecord.afternoon_in ? new Date(existingRecord.afternoon_in) : null;
      
      let totalHours = 0;
      if (morningIn && morningOut) {
        totalHours += (morningOut.getTime() - morningIn.getTime()) / (1000 * 60 * 60);
      }
      if (afternoonIn) {
        totalHours += (now.getTime() - afternoonIn.getTime()) / (1000 * 60 * 60);
      }

      // Calculate undertime
      const endTime = new Date(`${today}T${afternoonEnd}`);
      let undertimeMinutes = 0;
      if (now < endTime) {
        undertimeMinutes = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));
      }

      // Calculate overtime (hours beyond 8)
      let overtimeHours = 0;
      if (totalHours > 8) {
        overtimeHours = totalHours - 8;
      }

      const { data, error } = await supabase
        .from('attendance')
        .update({
          time_out: currentTime,
          afternoon_out: currentTime,
          rfid_time_out: rfid_card_number,
          hours_worked: Math.round(totalHours * 100) / 100,
          undertime_minutes: undertimeMinutes,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Already completed all 4 punches
      return new Response(
        JSON.stringify({ 
          error: 'Already completed attendance for today',
          employee_name: `${employee.first_name} ${employee.last_name}`,
          morning_in: existingRecord.morning_in,
          morning_out: existingRecord.morning_out,
          afternoon_in: existingRecord.afternoon_in,
          afternoon_out: existingRecord.afternoon_out,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map action to display text
    const actionLabels = {
      morning_in: 'MORNING IN',
      morning_out: 'MORNING OUT',
      afternoon_in: 'AFTERNOON IN',
      afternoon_out: 'AFTERNOON OUT',
    };

    console.log(`Attendance ${action} recorded for ${employee.first_name} ${employee.last_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        action_label: actionLabels[action],
        employee_id: employee.employee_id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        timestamp: currentTime,
        record: result,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('RFID Attendance Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process attendance' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
