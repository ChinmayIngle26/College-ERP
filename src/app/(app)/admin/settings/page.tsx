
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client'; // Import db
import { ShieldAlert, Settings, AlertTriangle, CheckCircle, UserPlus, Type, ListFilter, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { SystemSettings } from '@/services/system-settings'; // Import the type
import { getSystemSettings, updateSystemSettings } from '@/services/system-settings'; // Import service functions
import { Textarea } from '@/components/ui/textarea';

// Define the specific admin email address
const ADMIN_EMAIL = "admin@gmail.com";

// Debounce utility function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}


export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);

  // Local state for debounced input to avoid too many Firestore writes
  const [tempAppName, setTempAppName] = useState('');
  const [tempAnnouncementTitle, setTempAnnouncementTitle] = useState('');
  const [tempAnnouncementContent, setTempAnnouncementContent] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push('/signin');
      setCheckingRole(false); // Ensure checkingRole is updated
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;
      if (user.email === ADMIN_EMAIL) { // First check hardcoded admin email
        userIsCurrentlyAdmin = true;
      } else {
        if (db) { // Check Firestore role only if db is available
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
              userIsCurrentlyAdmin = true;
            }
          } catch (error) {
            console.error("Error fetching user role for admin settings:", error);
            toast({ title: "Error", description: "Could not verify admin role. Check Firestore permissions.", variant: "destructive" });
          }
        } else {
            toast({ title: "Database Error", description: "Firestore is not available. Cannot verify admin role.", variant: "destructive" });
        }
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
        router.push('/');
      }
      setCheckingRole(false);
    };
    checkAdminAccess();
  }, [user, authLoading, router, toast]);


  useEffect(() => {
    if (isAdmin && !checkingRole && !authLoading) { // Fetch settings only if admin and all checks passed
      const fetchSettings = async () => {
        setLoadingSettings(true);
        setErrorSettings(null);
        if (!db) { // Check db again before service call
          setErrorSettings("Database connection is not available for settings.");
          setLoadingSettings(false);
          toast({ title: "Database Error", description: "Cannot load system settings.", variant: "destructive" });
          return;
        }
        try {
          const currentSettings = await getSystemSettings();
          setSettings(currentSettings);
          setTempAppName(currentSettings.applicationName);
          setTempAnnouncementTitle(currentSettings.announcementTitle);
          setTempAnnouncementContent(currentSettings.announcementContent);
        } catch (error) {
          console.error("Error fetching system settings:", error);
          setErrorSettings("Could not load system settings. Please ensure Firestore rules allow reading 'systemSettings/appConfiguration'.");
          toast({
            title: "Error Loading Settings",
            description: "Failed to load system settings. Check permissions.",
            variant: "destructive",
          });
        } finally {
          setLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [isAdmin, checkingRole, authLoading, toast]);

  const handleSettingUpdate = async (key: keyof SystemSettings, value: any, successMessage: string) => {
    if (!settings || !isAdmin) return; // Ensure user is admin
    if (!db) { // Check db before service call
        toast({ title: "Database Error", description: "Cannot update settings.", variant: "destructive" });
        return;
    }

    const newSettings: Partial<SystemSettings> = { [key]: value };
    try {
      await updateSystemSettings(newSettings);
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast({
        title: "Settings Updated",
        description: successMessage,
        variant: "default",
      });
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast({
        title: "Update Failed",
        description: `Could not update ${key}. Ensure Firestore rules allow writing to 'systemSettings/appConfiguration' for admins.`,
        variant: "destructive",
      });
      // Revert UI change on error by refetching if db is available
      if(db) {
        const currentSettings = await getSystemSettings();
        setSettings(currentSettings);
        if (key === 'applicationName') setTempAppName(currentSettings.applicationName);
        if (key === 'announcementTitle') setTempAnnouncementTitle(currentSettings.announcementTitle);
        if (key === 'announcementContent') setTempAnnouncementContent(currentSettings.announcementContent);
      }
    }
  };

  const handleMaintenanceModeToggle = (checked: boolean) => {
    handleSettingUpdate('maintenanceMode', checked, `Maintenance mode ${checked ? 'enabled' : 'disabled'}.`);
  };

  const handleAllowNewUserRegistrationToggle = (checked: boolean) => {
    handleSettingUpdate('allowNewUserRegistration', checked, `New user registration ${checked ? 'enabled' : 'disabled'}.`);
  };
  
  const debouncedUpdateApplicationName = useCallback(
    debounce((newName: string) => {
      handleSettingUpdate('applicationName', newName, `Application name updated to "${newName}".`);
    }, 1000), 
    [settings, isAdmin] // Recreate if settings or isAdmin changes
  );
    const debouncedUpdateAnnouncementTitle = useCallback(
        debounce((newTitle: string) => {
            handleSettingUpdate('announcementTitle', newTitle, `Announcement title updated to "${newTitle}".`);
        }, 1000), 
        [settings, isAdmin] 
    );

    const debouncedUpdateAnnouncementContent = useCallback(
        debounce((newContent: string) => {
            handleSettingUpdate('announcementContent', newContent, 'Announcement content updated.');
        }, 1000), 
        [settings, isAdmin] 
    );

  const handleTempApplicationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setTempAppName(newName);
    debouncedUpdateApplicationName(newName);
  };
    const handleTempAnnouncementTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTempAnnouncementTitle(newTitle);
        debouncedUpdateAnnouncementTitle(newTitle);
    };

    const handleTempAnnouncementContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setTempAnnouncementContent(newContent);
        debouncedUpdateAnnouncementContent(newContent);
    };

  const handleDefaultItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      handleSettingUpdate('defaultItemsPerPage', value, `Default items per page set to ${value}.`);
    } else if (e.target.value === '') {
      // Allow clear, but maybe set a default if empty? Or validate on blur.
    }
  };


  if (authLoading || checkingRole || (isAdmin && loadingSettings)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" /> System Settings
            </CardTitle>
            <CardDescription>Loading settings...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) { // This should be caught by useEffect redirect, but as a fallback
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (errorSettings) {
     return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" /> Error Loading Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{errorSettings}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
     )
  }
  
  if (!settings && !loadingSettings) { // Handle case where settings are null after loading (e.g. error during fetch handled by returning default)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">System settings could not be loaded. Defaults are in effect. Please check console.</p>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" /> System Settings
          </CardTitle>
          <CardDescription>Configure system-wide settings for the application.</CardDescription>
        </CardHeader>
      </Card>
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="maintenance-mode" className="text-base font-medium flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Maintenance Mode
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            When enabled, users will see a maintenance page. Only admins can access the site.
                        </p>
                    </div>
                    {settings && (
                        <Switch
                            id="maintenance-mode"
                            checked={settings.maintenanceMode}
                            onCheckedChange={handleMaintenanceModeToggle}
                            aria-label="Toggle maintenance mode"
                        />
                    )}
                </div>

                {/* Allow New User Registration */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="allow-registration" className="text-base font-medium flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-500" />
                            Allow New User Registration
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Enable or disable the ability for new users to sign up.
                        </p>
                    </div>
                    {settings && (
                        <Switch
                            id="allow-registration"
                            checked={settings.allowNewUserRegistration}
                            onCheckedChange={handleAllowNewUserRegistrationToggle}
                            aria-label="Toggle new user registration"
                        />
                    )}
                </div>

                {/* Application Name */}
                <div className="rounded-lg border p-4 space-y-2">
                    <Label htmlFor="application-name" className="text-base font-medium flex items-center gap-2">
                        <Type className="h-5 w-5 text-green-500" />
                        Application Name
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        This name will be displayed in various parts of the application, like the page title.
                    </p>
                    {settings && (
                        <Input
                            id="application-name"
                            value={tempAppName}
                            onChange={handleTempApplicationNameChange}
                            placeholder="e.g., My Awesome ERP"
                        />
                    )}
                </div>

                {/* Default Items Per Page */}
                <div className="rounded-lg border p-4 space-y-2">
                    <Label htmlFor="items-per-page" className="text-base font-medium flex items-center gap-2">
                        <ListFilter className="h-5 w-5 text-purple-500" />
                        Default Items Per Page
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Set the default number of items to display in paginated lists (e.g., user lists).
                    </p>
                    {settings && (
                        <Input
                            id="items-per-page"
                            type="number"
                            value={settings.defaultItemsPerPage}
                            onChange={handleDefaultItemsPerPageChange}
                            placeholder="e.g., 10"
                            min="1"
                        />
                    )}
                </div>
            </CardContent>
        </Card>
      <Card>
        <CardHeader>
          <CardTitle>Announcement Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Announcement Title */}
          <div className="rounded-lg border p-4 space-y-2">
            <Label htmlFor="announcement-title" className="text-base font-medium flex items-center gap-2">
              <Type className="h-5 w-5 text-green-500" />
              Announcement Title
            </Label>
            <p className="text-sm text-muted-foreground">
              The title of the announcement displayed on the dashboard.
            </p>
            {settings && (
              <Input
                id="announcement-title"
                value={tempAnnouncementTitle}
                onChange={handleTempAnnouncementTitleChange}
                placeholder="e.g., Welcome to the Dashboard!"
              />
            )}
          </div>

          {/* Announcement Content */}
          <div className="rounded-lg border p-4 space-y-2">
            <Label htmlFor="announcement-content" className="text-base font-medium flex items-center gap-2">
              <Type className="h-5 w-5 text-purple-500" />
              Announcement Content
            </Label>
            <p className="text-sm text-muted-foreground">
              The main content of the announcement displayed on the dashboard.
            </p>
            {settings && (
              <Textarea
                id="announcement-content"
                value={tempAnnouncementContent}
                onChange={handleTempAnnouncementContentChange}
                placeholder="e.g., Stay tuned for upcoming events and important updates."
              />
            )}
          </div>
        </CardContent>
      </Card>

       {/* Placeholder for more settings categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings (Placeholder)</CardTitle>
          <CardDescription>Configure email and SMS notification preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Notification settings will be configurable here in a future update.
          </p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>API Integration (Placeholder)</CardTitle>
          <CardDescription>Manage API keys for third-party services.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            API key management will be available here.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

