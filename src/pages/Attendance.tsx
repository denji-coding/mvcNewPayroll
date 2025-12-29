import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Search, Download } from 'lucide-react';

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div className="flex gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Present</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">142</div></CardContent></Card>
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Late</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-warning">8</div></CardContent></Card>
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Absent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">6</div></CardContent></Card>
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">On Leave</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-info">4</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daily Attendance - {new Date(date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Employee ID</TableHead><TableHead>Name</TableHead><TableHead>Time In</TableHead><TableHead>Time Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Select a date to view attendance records. RFID API integration will populate this data.</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
