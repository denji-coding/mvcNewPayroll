import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PasswordInput } from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, User, Lock, Phone, Mail, Loader2 } from 'lucide-react';

export default function Profile() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: profile?.firstName || '',
    last_name: profile?.lastName || '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Load phone from database
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();
      if (data) {
        setForm(prev => ({ ...prev, phone: data.phone || '' }));
      }
    };
    loadProfile();
  }, [user?.id]);

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        first_name: profile.firstName || '',
        last_name: profile.lastName || '',
      }));
    }
  }, [profile]);

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    setLoading(false);
    if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
    toast({ title: 'Profile Updated' });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match' });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    
    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || '',
      password: passwordForm.current_password,
    });

    if (signInError) {
      setPasswordLoading(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Current password is incorrect' });
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new_password,
    });

    setPasswordLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }

    toast({ title: 'Password Updated', description: 'Your password has been changed successfully' });
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header"><h1 className="page-title">My Profile</h1></div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{profile?.firstName} {profile?.lastName}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {profile?.email}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input 
                    id="first_name"
                    value={form.first_name} 
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name"
                    value={form.last_name} 
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    value={profile?.email || ''} 
                    disabled 
                    className="pl-10 bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone"
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="Enter your phone number"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <PasswordInput 
                  id="current_password"
                  value={passwordForm.current_password} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} 
                  placeholder="Enter your current password"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <PasswordInput 
                  id="new_password"
                  value={passwordForm.new_password} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} 
                  placeholder="Enter your new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <PasswordInput 
                  id="confirm_password"
                  value={passwordForm.confirm_password} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} 
                  placeholder="Confirm your new password"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
