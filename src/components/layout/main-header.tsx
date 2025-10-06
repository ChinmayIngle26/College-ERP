
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle, Menu } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';
import { getSystemSettings } from '@/services/system-settings';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from './sidebar';

export function MainHeader() {
  const [collegeName, setCollegeName] = useState('AISSMS Industrial Training Institute');
  const [appNameLoading, setAppNameLoading] = useState(true);
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              {/* The actual sidebar component needs to be rendered here */}
              <div className="h-full">
                <Sidebar isCollapsed={false} toggleCollapse={() => {}} />
              </div>
            </SheetContent>
          </Sheet>
        )}
        {!isMobile && (
          <Image
            src="/college-logo.png"
            alt="College Logo"
            width={40}
            height={40}
            className="h-8 w-8 md:h-10 md:w-10"
            data-ai-hint="college crest logo"
          />
        )}
        <div>
            <h1 className="text-base font-semibold md:text-xl">{appNameLoading ? "Loading..." : collegeName}</h1>
            <p className="text-xs text-muted-foreground">Student Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
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
