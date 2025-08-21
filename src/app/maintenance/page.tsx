
'use client';

import { useEffect, useState } from 'react';
import { Settings, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getSystemSettings } from '@/services/system-settings';
import type { SystemSettings } from '@/services/system-settings';
import Image from 'next/image';

export default function MaintenancePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentSettings = await getSystemSettings();
        setSettings(currentSettings);
        // If maintenance mode is somehow off, redirect to home
        if (!currentSettings.maintenanceMode) {
          router.replace('/');
        }
      } catch (error) {
        console.error("Error fetching system settings for maintenance page:", error);
        // Fallback: assume maintenance is on if settings can't be fetched on this page
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <Settings className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading system status...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background p-6 text-center">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="items-center">
           <Image
            src="/college-logo.png"
            alt="Site Logo"
            width={60}
            height={60}
            className="mb-4"
            data-ai-hint="college crest logo"
          />
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            Under Maintenance
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            {settings?.applicationName || 'AISSMS Industrial Training Institute'} is currently undergoing scheduled maintenance.
            We should be back online shortly. Thank you for your patience!
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="rounded-lg border border-dashed border-border p-4">
            <h3 className="font-semibold text-primary">Why am I seeing this?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We are working hard to improve your experience. During this time, access to most parts of the site is temporarily restricted.
            </p>
          </div>
          {/* Optional: Add a link for admins to log in if they land here by mistake */}
          {/* This assumes an admin might try to navigate directly and hit the maintenance wall */}
           <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => router.push('/signin')}
           >
            Admin Sign In
           </Button>
        </CardContent>
      </Card>
       <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {settings?.applicationName || 'AISSMS Industrial Training Institute'}. All rights reserved.
      </p>
    </div>
  );
}

