
'use client'; // Add this directive

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle'; // Import ThemeToggle
import { getSystemSettings } from '@/services/system-settings';
import { useEffect, useState } from 'react';

export function MainHeader() {
  const [collegeName, setCollegeName] = useState('AISSMS Industrial Training Institute');
  const [appNameLoading, setAppNameLoading] = useState(true);

   useEffect(() => {
    const fetchAppName = async () => {
      setAppNameLoading(true);
      try {
        const settings = await getSystemSettings();
        if (settings && settings.applicationName) {
          setCollegeName(settings.applicationName);
        }
      } catch (error) {
        console.error("Error fetching application name for main header:", error);
      } finally {
        setAppNameLoading(false);
      }
    };
    fetchAppName();
  }, []);


  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-4">
         <Image
            src="/college-logo.png"
            alt="College Logo"
            width={40}
            height={40}
            className="h-8 w-8 md:h-10 md:w-10"
            data-ai-hint="college crest logo"
          />
        <div>
            <h1 className="text-lg font-semibold md:text-xl">{appNameLoading ? "Loading..." : collegeName}</h1>
            <p className="text-xs text-muted-foreground md:text-sm">Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[300px]"
            />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
          <span className="sr-only">User profile</span>
        </Button>
      </div>
    </header>
  );
}

// Add placeholder SVG logo if actual logo is not available
export function PlaceholderLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="15" fill="#E0E0E0"/>
      <path d="M30 70 L50 30 L70 70 Z" fill="#A0A0A0"/>
      <circle cx="50" cy="50" r="10" fill="#FFFFFF"/>
    </svg>
  );
}

// Create a dummy file for the placeholder logo if needed for build process
// fs.writeFileSync('public/placeholder-logo.svg', PlaceholderLogo().toString()); // Example: Run this logic if needed, e.g., in a script
