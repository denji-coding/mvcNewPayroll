import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import companyLogo from "@/assets/company-logo.png";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeForm from "./pages/EmployeeForm";
import Branches from "./pages/Branches";
import Attendance from "./pages/Attendance";
import ClockInOut from "./pages/ClockInOut";
import MyAttendance from "./pages/MyAttendance";
import AttendanceTerminal from "./pages/AttendanceTerminal";
import Leaves from "./pages/Leaves";
import LeaveApprovals from "./pages/LeaveApprovals";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TimeSchedule from "./pages/TimeSchedule";
import Positions from "./pages/Positions";
import ChangePassword from "./pages/ChangePassword";
import DailyTimeRecord from "./pages/DailyTimeRecord";
import MyPayslips from "./pages/MyPayslips";
import LeaveCredits from "./pages/LeaveCredits";

// Layout
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  useDocumentTitle();
  return (
    <Routes>
      {/* Public attendance terminal - no auth required */}
      <Route path="/attendance-terminal" element={<AttendanceTerminal />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <AppLayout />
            </SidebarProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeForm />} />
        <Route path="branches" element={<Branches />} />
        <Route path="positions" element={<Positions />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="clock-in-out" element={<ClockInOut />} />
        <Route path="my-attendance" element={<MyAttendance />} />
        <Route path="dtr" element={<DailyTimeRecord />} />
        <Route path="time-schedule" element={<TimeSchedule />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="leave-approvals" element={<LeaveApprovals />} />
        <Route path="leave-credits" element={<LeaveCredits />} />
        <Route path="my-payslips" element={<MyPayslips />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="mvc-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
