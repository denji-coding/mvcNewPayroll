import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmployeeData {
  employee_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  civil_status?: string;
  address?: string;
  position: string;
  department?: string;
  date_hired: string;
  basic_salary: number;
  branch_id?: string;
  sss_number?: string;
  philhealth_number?: string;
  pagibig_number?: string;
  tin_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  rfid_card_number?: string;
  role: 'employee' | 'branch_manager' | 'hr_admin';
  password: string;
}

// Clean empty strings to null for optional fields
function cleanData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === undefined) {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const employeeData: EmployeeData = await req.json();
    
    // 1. Create user account in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: employeeData.email,
      password: employeeData.password,
      email_confirm: true,
      user_metadata: {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // 2. Update user_roles to set the correct role (trigger creates 'employee' by default)
    if (employeeData.role !== 'employee') {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: employeeData.role })
        .eq('user_id', userId);

      if (roleError) {
        console.error("Role update error:", roleError);
      }
    }

    // 3. If branch_manager, add to branch_managers table
    if (employeeData.role === 'branch_manager' && employeeData.branch_id) {
      const { error: bmError } = await supabaseAdmin
        .from('branch_managers')
        .insert({ user_id: userId, branch_id: employeeData.branch_id });

      if (bmError) {
        console.error("Branch manager assignment error:", bmError);
      }
    }

    // 4. Create employee record linked to the user
    const { password, role, ...employeeFields } = employeeData;
    const cleanedFields = cleanData(employeeFields);
    
    // Remove any undefined/empty optional fields
    const insertData: Record<string, unknown> = {
      ...cleanedFields,
      user_id: userId,
      basic_salary: employeeData.basic_salary || 0,
    };
    
    console.log("Inserting employee:", JSON.stringify(insertData));
    
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (employeeError) {
      console.error("Employee creation error:", employeeError);
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: employeeError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, employee, userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
