import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "Migrants Venture Corporation";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/employees": "Employees",
  "/employees/new": "New Employee",
  "/branches": "Branches",
  "/positions": "Positions",
  "/attendance": "Attendance",
  "/clock-in-out": "Clock In / Out",
  "/my-attendance": "My Attendance",
  "/dtr": "Daily Time Record",
  "/time-schedule": "Time Schedule",
  "/leaves": "Leaves",
  "/leave-approvals": "Leave Approvals",
  "/leave-credits": "Leave Credits",
  "/my-payslips": "My Payslips",
  "/payroll": "Payroll",
  "/reports": "Reports",
  "/settings": "Settings",
  "/profile": "Profile",
  "/attendance-terminal": "Attendance Terminal",
  "/auth": "Sign In",
  "/change-password": "Change Password",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }
  // Match /employees/:id (edit employee)
  if (/^\/employees\/[^/]+$/.test(pathname)) {
    return "Edit Employee";
  }
  return ROUTE_TITLES[pathname] ?? "Not Found";
}

export function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = getPageTitle(pathname);
    document.title =
      pageTitle === APP_NAME ? pageTitle : `${pageTitle} | ${APP_NAME}`;
  }, [pathname]);
}
