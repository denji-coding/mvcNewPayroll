import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  gender?: string | null;
  className?: string;
}

export function EmployeeAvatar({ firstName, lastName, avatarUrl, gender, className }: EmployeeAvatarProps) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  
  // Default avatar based on gender
  const getDefaultAvatar = () => {
    if (gender?.toLowerCase() === 'female') {
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=b6e3f4';
    }
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=c0aede';
  };

  return (
    <Avatar className={cn('h-8 w-8', className)}>
      <AvatarImage 
        src={avatarUrl || getDefaultAvatar()} 
        alt={`${firstName} ${lastName}`}
      />
      <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
