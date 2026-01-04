import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttendanceRequest {
  rfid_card_number?: string;
  employee_id?: string;
  timestamp?: string;
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

    const { rfid_card_number, employee_id, timestamp }: AttendanceRequest = await req.json();

    if (!rfid_card_number && !employee_id) {
      return new Response(
        JSON.stringify({ error: 'RFID card number or Employee ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find employee by RFID or Employee ID
    let employeeQuery = supabase
      .from('employees')
      .select('id, first_name, last_name, employee_id, branch_id')
      .eq('employment_status', 'active');

    if (rfid_card_number) {
      employeeQuery = employeeQuery.eq('rfid_card_number', rfid_card_number);
    } else if (employee_id) {
      employeeQuery = employeeQuery.eq('employee_id', employee_id);
    }

    const { data: employee, error: empError } = await employeeQuery.single();

    if (empError || !employee) {
      console.error('Employee lookup error:', empError);
      return new Response(
        JSON.stringify({ error: 'Employee not found or inactive', rfid: rfid_card_number }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toISOString();

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
      
      // Calculate late minutes (assuming 8:00 AM start time)
      const startTime = new Date(today + 'T08:00:00');
      let lateMinutes = 0;
      if (now > startTime) {
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
      
      // Calculate undertime (assuming 8 hours work day, 5 PM end)
      const endTime = new Date(today + 'T17:00:00');
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
