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

// Navigation items with permission keys
// IMPORTANT: Include 'employee' in roles for all pages that should be permission-configurable
const navigationItems: { 
  title: string; 
  url: string; 
  icon: React.ComponentType<{ className?: string }>; 
  roles: string[]; 
  permissionKey?: PermissionKey;
  external?: boolean;
}[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_dashboard' },
  { title: 'Employees', url: '/employees', icon: Users, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_employees' },
  { title: 'Positions', url: '/positions', icon: Briefcase, roles: ['hr_admin', 'employee'], permissionKey: 'page_positions' },
  { title: 'Branches', url: '/branches', icon: Building2, roles: ['hr_admin', 'employee'], permissionKey: 'page_branches' },
  { title: 'Time Schedule', url: '/time-schedule', icon: CalendarClock, roles: ['hr_admin', 'employee'], permissionKey: 'page_time_schedule' },
  { title: 'DTR', url: '/dtr', icon: ClipboardList, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_dtr' },
  { title: 'My Attendance', url: '/my-attendance', icon: IdCard, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_my_attendance' },
  { title: 'Attendance Terminal', url: '/attendance-terminal', icon: MonitorSmartphone, roles: ['hr_admin'], external: true },
  { title: 'Attendance', url: '/attendance', icon: Clock, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_attendance' },
  { title: 'Leaves', url: '/leaves', icon: CalendarDays, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_leaves' },
  { title: 'Payroll', url: '/payroll', icon: DollarSign, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_payroll' },
  { title: 'Reports', url: '/reports', icon: FileText, roles: ['hr_admin', 'branch_manager', 'employee'], permissionKey: 'page_reports' },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['hr_admin', 'employee'], permissionKey: 'page_settings' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role, profile, signOut } = useAuth();
  const { data: permissions, isLoading: permissionsLoading } = useRolePermissionsByRole(role);
  const collapsed = state === 'collapsed';

  // Filter navigation items based on role and permissions
  const filteredItems = navigationItems.filter((item) => {
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
        const employeeOnlyPages = ['page_dashboard', 'page_dtr', 'page_my_attendance', 'page_leaves', 'page_payroll'];
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

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sidebar-foreground truncate">MVC</span>
              <span className="text-xs text-sidebar-foreground/70 truncate">HR & Payroll</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {!collapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
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
                        className="flex items-center gap-3"
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </a>
                    ) : (
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
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
