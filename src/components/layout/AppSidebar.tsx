import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  DollarSign,
  FileText,
  Settings,
  ChevronDown,
  IdCard,
  MonitorSmartphone,
  CalendarClock,
  Briefcase,
  ClipboardList,
  CreditCard,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissionsByRole, PermissionKey } from '@/hooks/usePermissions';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import companyLogo from '@/assets/company-logo.png';

// Navigation item type
type NavItem = { 
  title: string; 
  url: string; 
  icon: React.ComponentType<{ className?: string }>; 
  roles: string[]; 
  permissionKey?: PermissionKey;
  external?: boolean;
};

// Admin/Management navigation items
const adminNavigationItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_dashboard' },
  { title: 'Employees', url: '/employees', icon: Users, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_employees' },
  { title: 'Positions', url: '/positions', icon: Briefcase, roles: ['hr_admin', 'employee'], permissionKey: 'page_positions' },
  { title: 'Branches', url: '/branches', icon: Building2, roles: ['hr_admin', 'employee'], permissionKey: 'page_branches' },
  { title: 'Time Schedule', url: '/time-schedule', icon: CalendarClock, roles: ['hr_admin', 'employee'], permissionKey: 'page_time_schedule' },
  { title: 'Attendance Terminal', url: '/attendance-terminal', icon: MonitorSmartphone, roles: ['hr_admin'], external: true },
  { title: 'Attendance', url: '/attendance', icon: Clock, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_attendance' },
  { title: 'Leave Approvals', url: '/leave-approvals', icon: CalendarDays, roles: ['hr_admin', 'branch_manager'], permissionKey: 'page_leaves' },
  { title: 'Leave Credits', url: '/leave-credits', icon: CreditCard, roles: ['hr_admin'], permissionKey: 'page_leave_credits' },
  { title: 'Payroll', url: '/payroll', icon: DollarSign, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_payroll' },
  { title: 'Reports', url: '/reports', icon: FileText, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_reports' },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['hr_admin', 'employee'], permissionKey: 'page_settings' },
];

// Employee Portal navigation items (accessible by all roles for self-service)
const employeePortalItems: NavItem[] = [
  { title: 'DTR', url: '/dtr', icon: ClipboardList, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_dtr' },
  { title: 'My Attendance', url: '/my-attendance', icon: IdCard, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_my_attendance' },
  { title: 'My Payslips', url: '/my-payslips', icon: FileText, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_my_payslips' },
  { title: 'My Leaves', url: '/leaves', icon: CalendarDays, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_leaves' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role, profile, signOut } = useAuth();
  const { data: permissions, isLoading: permissionsLoading } = useRolePermissionsByRole(role);
  const collapsed = state === 'collapsed';

  // Filter function for navigation items based on role and permissions
  const filterItems = (items: NavItem[]) => items.filter((item) => {
    // Must have a role to see anything
    if (!role) return false;
    
    // HR Admin always has full access - no permission checks needed
    if (role === 'hr_admin') return item.roles.includes('hr_admin');
    
    // For external links (like attendance terminal), just check role
    if (item.external) return item.roles.includes(role);
    
    // If role is not in the allowed roles at all, deny access
    if (!item.roles.includes(role)) return false;
    
    // If no permission key defined, fall back to role check
    if (!item.permissionKey) return true;
    
    // While loading permissions, hide permission-gated items for non-admin roles
    if (permissionsLoading || !permissions) {
      // For employee role, only show items that are employee-specific (like DTR, My Attendance)
      if (role === 'employee') {
        const employeeOnlyPages = ['page_dashboard', 'page_dtr', 'page_my_attendance', 'page_leaves', 'page_payroll', 'page_my_payslips'];
        return employeeOnlyPages.includes(item.permissionKey);
      }
      return true;
    }
    
    // Check if permission is enabled in the database
    const permission = permissions.find(p => p.permission_key === item.permissionKey);
    
    // If permission record exists, use its enabled status
    if (permission) return permission.enabled;
    
    // If no permission record exists for employee, default to hiding (security-first)
    if (role === 'employee') return false;
    
    // For other roles, default to showing (backwards compatibility)
    return true;
  });

  const filteredAdminItems = filterItems(adminNavigationItems);
  const filteredEmployeePortalItems = filterItems(employeePortalItems);

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-2">
      <NavLink
          to="/"
          end
          className="group flex flex-col p-2 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <img 
            src={companyLogo} 
            alt="Migrants Venture Corporation" 
            className={`object-contain flex-shrink-0 aspect-square ${collapsed ? 'h-10 w-10' : 'h-28 w-28'}`}
          />
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground text-center text-xs mt-2 leading-tight group-hover:text-sidebar-accent-foreground block">
              <span className="block text-2xl font-bold ">Migrants Venture</span>
              <span className="block text-2xl font-bold">Corporationmm</span>
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {/* Admin/Management Navigation */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">
              {!collapsed ? 'Management' : ''}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      {item.external ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </a>
                      ) : (
                        <NavLink
                          to={item.url}
                          end={item.url === '/'}
                          className="flex items-center gap-2"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Employee Portal Navigation */}
        {filteredEmployeePortalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">
              {!collapsed ? 'Employee Portal' : ''}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredEmployeePortalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`w-full flex items-center gap-3 rounded-lg hover:bg-sidebar-accent transition-colors ${collapsed ? 'justify-center p-2' : 'p-2'}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                      {role?.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="w-full">My Profile</NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
