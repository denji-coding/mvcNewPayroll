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
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
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
import { Button } from '@/components/ui/button';

const navigationItems: { title: string; url: string; icon: React.ComponentType<{ className?: string }>; roles: string[]; external?: boolean }[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, roles: ['hr_admin', 'branch_manager', 'employee'] },
  { title: 'Employees', url: '/employees', icon: Users, roles: ['hr_admin', 'branch_manager'] },
  { title: 'Positions', url: '/positions', icon: Briefcase, roles: ['hr_admin'] },
  { title: 'Branches', url: '/branches', icon: Building2, roles: ['hr_admin'] },
  { title: 'Time Schedule', url: '/time-schedule', icon: CalendarClock, roles: ['hr_admin'] },
  { title: 'My Attendance', url: '/my-attendance', icon: IdCard, roles: ['employee'] },
  { title: 'Attendance Terminal', url: '/attendance-terminal', icon: MonitorSmartphone, roles: ['hr_admin'], external: true },
  { title: 'Attendance', url: '/attendance', icon: Clock, roles: ['hr_admin', 'branch_manager'] },
  { title: 'Leaves', url: '/leaves', icon: CalendarDays, roles: ['hr_admin', 'branch_manager', 'employee'] },
  { title: 'Payroll', url: '/payroll', icon: DollarSign, roles: ['hr_admin', 'branch_manager', 'employee'] },
  { title: 'Reports', url: '/reports', icon: FileText, roles: ['hr_admin', 'branch_manager'] },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['hr_admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role, profile, signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const filteredItems = navigationItems.filter(
    (item) => !role || item.roles.includes(role)
  );

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
