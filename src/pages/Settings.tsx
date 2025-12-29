import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Settings</h1></div>

      <Tabs defaultValue="general">
        <TabsList><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="payroll">Payroll</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger></TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle><CardDescription>Basic company settings</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><Label>Company Name</Label><p className="text-sm text-muted-foreground">Migrants Venture Corporation</p></div></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Payroll Settings</CardTitle><CardDescription>Configure payroll computation rules</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><Label>Auto-compute SSS</Label><p className="text-sm text-muted-foreground">Automatically calculate SSS contributions</p></div><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><div><Label>Auto-compute PhilHealth</Label><p className="text-sm text-muted-foreground">Automatically calculate PhilHealth contributions</p></div><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><div><Label>Auto-compute Pag-IBIG</Label><p className="text-sm text-muted-foreground">Automatically calculate Pag-IBIG contributions</p></div><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><div><Label>Auto-compute Tax</Label><p className="text-sm text-muted-foreground">Automatically calculate withholding tax</p></div><Switch defaultChecked /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Email Notifications</CardTitle><CardDescription>Configure email notification settings</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><Label>Leave Request Notifications</Label><p className="text-sm text-muted-foreground">Email when leave requests are submitted/approved</p></div><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><div><Label>Payroll Notifications</Label><p className="text-sm text-muted-foreground">Email when payroll is processed</p></div><Switch defaultChecked /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
