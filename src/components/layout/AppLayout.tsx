import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useSidebar } from '@/components/ui/sidebar';

export default function AppLayout() {
  const { state } = useSidebar();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className={`flex-1 overflow-auto transition-all duration-300`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
