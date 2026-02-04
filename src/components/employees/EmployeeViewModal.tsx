import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmployeeAvatar } from '@/components/employees/EmployeeAvatar';
import { format } from 'date-fns';
import { User, Briefcase, Building2, CreditCard, Phone, Mail, MapPin, Calendar, Shield, Wallet } from 'lucide-react';

interface EmployeeViewModalProps {
  employee: any;
  open: boolean;
  onClose: () => void;
}

export function EmployeeViewModal({ employee, open, onClose }: EmployeeViewModalProps) {
  if (!employee) return null;

  const formatCurrency = (amount: number | null) => 
    `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/20 text-success border-success/30',
      inactive: 'bg-warning/20 text-warning border-warning/30',
      resigned: 'bg-muted/20 text-muted-foreground',
      terminated: 'bg-destructive/20 text-destructive border-destructive/30',
      on_leave: 'bg-info/20 text-info border-info/30',
    };
    return <Badge variant="outline" className={styles[status] || 'bg-muted'}>{status}</Badge>;
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '-'}</span>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="font-semibold text-sm">{title}</h4>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              firstName={employee.first_name}
              lastName={employee.last_name}
              avatarUrl={employee.avatar_url}
              gender={employee.gender}
              className="h-16 w-16"
            />
            <div>
              <DialogTitle className="text-xl">
                {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}{employee.last_name}
              </DialogTitle>
              <p className="text-muted-foreground">{employee.position}</p>
              <div className="mt-1">{getStatusBadge(employee.employment_status)}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-4">
          {/* Personal Information */}
          <div className="space-y-2">
            <SectionHeader icon={User} title="Personal Information" />
            <div className="bg-muted/30 rounded-lg p-3">
              <InfoRow label="Employee ID" value={employee.employee_id} />
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Date of Birth" value={formatDate(employee.date_of_birth)} />
              <InfoRow label="Gender" value={employee.gender} />
              <InfoRow label="Civil Status" value={employee.civil_status} />
              <InfoRow label="Address" value={employee.address} />
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-2">
            <SectionHeader icon={Briefcase} title="Employment Details" />
            <div className="bg-muted/30 rounded-lg p-3">
              <InfoRow label="Position" value={employee.position} />
              <InfoRow label="Branch" value={employee.branches?.name} />
              <InfoRow label="Date Hired" value={formatDate(employee.date_hired)} />
              <InfoRow label="Basic Salary" value={formatCurrency(employee.basic_salary)} />
              <InfoRow label="RFID Card" value={employee.rfid_card_number} />
            </div>
          </div>

          {/* Government IDs */}
          <div className="space-y-2">
            <SectionHeader icon={Shield} title="Government IDs" />
            <div className="bg-muted/30 rounded-lg p-3">
              <InfoRow label="SSS Number" value={employee.sss_number} />
              <InfoRow label="PhilHealth Number" value={employee.philhealth_number} />
              <InfoRow label="Pag-IBIG Number" value={employee.pagibig_number} />
              <InfoRow label="TIN Number" value={employee.tin_number} />
            </div>
          </div>

          {/* Banking & Emergency Contact */}
          <div className="space-y-4">
            <div className="space-y-2">
              <SectionHeader icon={Wallet} title="Banking Information" />
              <div className="bg-muted/30 rounded-lg p-3">
                <InfoRow label="Bank Name" value={employee.bank_name} />
                <InfoRow label="Account Number" value={employee.bank_account_number} />
              </div>
            </div>

            <div className="space-y-2">
              <SectionHeader icon={Phone} title="Emergency Contact" />
              <div className="bg-muted/30 rounded-lg p-3">
                <InfoRow label="Contact Name" value={employee.emergency_contact_name} />
                <InfoRow label="Contact Phone" value={employee.emergency_contact_phone} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
