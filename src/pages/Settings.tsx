import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Calendar, Megaphone, Users, Building, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from '@/hooks/useHolidays';
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useToggleAnnouncementPublish, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useUsersWithRoles, useBranchManagers, useUpdateUserRole, useAssignBranchManager, useRemoveBranchManager } from '@/hooks/useUserRoles';
import { useTerminalSettings, useUpdateTerminalSettings, TerminalSettings } from '@/hooks/useSettings';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export default function Settings() {
  const { role } = useAuth();
  const isHR = role === 'hr_admin';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:flex lg:w-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isHR && <TabsTrigger value="terminal">Terminal</TabsTrigger>}
          {isHR && <TabsTrigger value="holidays">Holidays</TabsTrigger>}
          {isHR && <TabsTrigger value="announcements">Announcements</TabsTrigger>}
          {isHR && <TabsTrigger value="users">Users</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-4">
          <PayrollSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <NotificationSettings />
        </TabsContent>

        {isHR && (
          <TabsContent value="terminal" className="mt-4 space-y-4">
            <TerminalSettingsTab />
          </TabsContent>
        )}

        {isHR && (
          <TabsContent value="holidays" className="mt-4 space-y-4">
            <HolidayManagement />
          </TabsContent>
        )}

        {isHR && (
          <TabsContent value="announcements" className="mt-4 space-y-4">
            <AnnouncementManagement />
          </TabsContent>
        )}

        {isHR && (
          <TabsContent value="users" className="mt-4 space-y-4">
            <UserRoleManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Basic company settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Company Name</Label>
            <p className="text-sm text-muted-foreground">Migrants Venture Corporation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Settings</CardTitle>
        <CardDescription>Configure payroll computation rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-compute SSS</Label>
            <p className="text-sm text-muted-foreground">Automatically calculate SSS contributions</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-compute PhilHealth</Label>
            <p className="text-sm text-muted-foreground">Automatically calculate PhilHealth contributions</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-compute Pag-IBIG</Label>
            <p className="text-sm text-muted-foreground">Automatically calculate Pag-IBIG contributions</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-compute Tax</Label>
            <p className="text-sm text-muted-foreground">Automatically calculate withholding tax</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Configure email notification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Leave Request Notifications</Label>
            <p className="text-sm text-muted-foreground">Email when leave requests are submitted/approved</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Payroll Notifications</Label>
            <p className="text-sm text-muted-foreground">Email when payroll is processed</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

function TerminalSettingsTab() {
  const { data: settings, isLoading } = useTerminalSettings();
  const updateSettings = useUpdateTerminalSettings();
  
  const [form, setForm] = useState<TerminalSettings>({
    work_start_time: '08:00',
    work_end_time: '17:00',
    grace_period_minutes: 0,
    allow_manual_entry: true,
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(form);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Attendance Terminal Settings
        </CardTitle>
        <CardDescription>Configure work hours and attendance rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Work Start Time</Label>
            <Input
              type="time"
              value={form.work_start_time}
              onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">When the work day begins</p>
          </div>
          <div className="space-y-2">
            <Label>Work End Time</Label>
            <Input
              type="time"
              value={form.work_end_time}
              onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">When the work day ends</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Grace Period (minutes)</Label>
          <Input
            type="number"
            min="0"
            max="60"
            value={form.grace_period_minutes}
            onChange={(e) => setForm({ ...form, grace_period_minutes: parseInt(e.target.value) || 0 })}
            className="max-w-32"
          />
          <p className="text-xs text-muted-foreground">Minutes after start time before marking as late</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow Manual Entry</Label>
            <p className="text-sm text-muted-foreground">Allow employees to clock in using Employee ID</p>
          </div>
          <Switch
            checked={form.allow_manual_entry}
            onCheckedChange={(v) => setForm({ ...form, allow_manual_entry: v })}
          />
        </div>
        
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

function HolidayManagement() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [form, setForm] = useState({ name: '', date: '', type: 'regular' });

  const { data: holidays, isLoading } = useHolidays(year);
  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const handleSubmit = async () => {
    const holidayData = {
      name: form.name,
      date: form.date,
      type: form.type,
      year: new Date(form.date).getFullYear(),
    };

    if (editingHoliday) {
      await updateHoliday.mutateAsync({ id: editingHoliday.id, ...holidayData });
    } else {
      await createHoliday.mutateAsync(holidayData);
    }
    
    setDialogOpen(false);
    setEditingHoliday(null);
    setForm({ name: '', date: '', type: 'regular' });
  };

  const handleEdit = (holiday: any) => {
    setEditingHoliday(holiday);
    setForm({ name: holiday.name, date: holiday.date, type: holiday.type });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      await deleteHoliday.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Holiday Management
            </CardTitle>
            <CardDescription>Manage company holidays for payroll computation</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto" onClick={() => { setEditingHoliday(null); setForm({ name: '', date: '', type: 'regular' }); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Holiday Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., New Year's Day"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Holiday</SelectItem>
                        <SelectItem value="special">Special Non-Working</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!form.name || !form.date} className="w-full sm:w-auto">
                    {editingHoliday ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : holidays?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No holidays configured for {year}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays?.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>{format(new Date(holiday.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>
                      <Badge variant={holiday.type === 'regular' ? 'default' : 'secondary'}>
                        {holiday.type === 'regular' ? 'Regular' : 'Special'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnnouncementManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', branch_id: '' });

  const { data: announcements, isLoading } = useAnnouncements();
  const { data: branches } = useBranches();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const togglePublish = useToggleAnnouncementPublish();
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleSubmit = async () => {
    const data = {
      title: form.title,
      content: form.content,
      branch_id: form.branch_id === 'all' || !form.branch_id ? null : form.branch_id,
    };

    if (editingAnnouncement) {
      await updateAnnouncement.mutateAsync({ id: editingAnnouncement.id, ...data });
    } else {
      await createAnnouncement.mutateAsync(data);
    }
    
    setDialogOpen(false);
    setEditingAnnouncement(null);
    setForm({ title: '', content: '', branch_id: '' });
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      branch_id: announcement.branch_id || 'all',
    });
    setDialogOpen(true);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await togglePublish.mutateAsync({ id, is_published: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      await deleteAnnouncement.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcement Management
            </CardTitle>
            <CardDescription>Create and manage company announcements</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => { setEditingAnnouncement(null); setForm({ title: '', content: '', branch_id: '' }); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Announcement title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write your announcement..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Branch (optional)</Label>
                  <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleSubmit} disabled={!form.title || !form.content} className="w-full sm:w-auto">
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : announcements?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No announcements yet</p>
        ) : (
          <div className="space-y-4">
            {announcements?.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <Badge variant={announcement.is_published ? 'default' : 'secondary'}>
                          {announcement.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                        {announcement.published_at && ` • Published: ${format(new Date(announcement.published_at), 'MMM dd, yyyy')}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(announcement.id, announcement.is_published)}
                      >
                        {announcement.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserRoleManagement() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  const { data: users, isLoading: usersLoading } = useUsersWithRoles();
  const { data: branchManagers, isLoading: managersLoading } = useBranchManagers();
  const { data: branches } = useBranches();
  const updateRole = useUpdateUserRole();
  const assignManager = useAssignBranchManager();
  const removeManager = useRemoveBranchManager();

  const handleRoleChange = async (user: any, newRole: AppRole) => {
    await updateRole.mutateAsync({
      userId: user.id,
      role: newRole,
      existingRoleId: user.role_id,
    });
  };

  const handleAssignBranch = async () => {
    if (selectedUser && selectedBranch) {
      await assignManager.mutateAsync({
        userId: selectedUser.id,
        branchId: selectedBranch,
      });
      setAssignDialogOpen(false);
      setSelectedUser(null);
      setSelectedBranch('');
    }
  };

  const handleRemoveManager = async (id: string) => {
    if (confirm('Remove this branch manager assignment?')) {
      await removeManager.mutateAsync(id);
    }
  };

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case 'hr_admin': return 'default';
      case 'branch_manager': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Roles
          </CardTitle>
          <CardDescription>Manage user access levels and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role || 'No Role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || ''}
                          onValueChange={(v) => handleRoleChange(user, v as AppRole)}
                        >
                          <SelectTrigger className="w-32 sm:w-40">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="branch_manager">Branch Manager</SelectItem>
                            <SelectItem value="hr_admin">HR Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Branch Manager Assignments
              </CardTitle>
              <CardDescription>Assign managers to specific branches</CardDescription>
            </div>
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Manager
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Branch Manager</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select
                      value={selectedUser?.id || ''}
                      onValueChange={(v) => setSelectedUser(users?.find(u => u.id === v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.role === 'branch_manager').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Branch</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button onClick={handleAssignBranch} disabled={!selectedUser || !selectedBranch} className="w-full sm:w-auto">
                    Assign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {managersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : branchManagers?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No branch managers assigned yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchManagers?.map((manager) => {
                    const user = users?.find(u => u.id === manager.user_id);
                    return (
                      <TableRow key={manager.id}>
                        <TableCell className="font-medium">
                          {user ? `${user.first_name} ${user.last_name}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {manager.branch?.name} ({manager.branch?.code})
                        </TableCell>
                        <TableCell>
                          {format(new Date(manager.assigned_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveManager(manager.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}