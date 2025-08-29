
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  Users, 
  CheckSquare, 
  Eye, 
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Settings, 
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSystemSettings } from '@/services/system-settings'; 
import { useIsMobile } from '@/hooks/use-is-mobile'; // Import useIsMobile

const facultyNavigationItems = [
  { href: '/faculty', label: 'Dashboard', icon: Home },
  { href: '/faculty/classrooms', label: 'Manage Classrooms', icon: Users },
  { href: '/faculty/attendance', label: 'Update Attendance', icon: CheckSquare },
  { href: '/faculty/grades', label: 'Manage Grades', icon: GraduationCap },
  { href: '/', label: 'Student View', icon: Eye },
];

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile); // Initialize based on isMobile
  const [collegeName, setCollegeName] = useState('AISSMS Industrial Training Institute'); 
  const [appNameLoading, setAppNameLoading] = useState(true);

  useEffect(() => {
    if (isMobile === undefined) return; // Wait for isMobile to be determined

    if (isMobile) {
      setIsSidebarCollapsed(true);
    } else {
      if (typeof window !== 'undefined') {
        const storedCollapsedState = localStorage.getItem('faculty-sidebar-collapsed');
        if (storedCollapsedState !== null) {
          setIsSidebarCollapsed(JSON.parse(storedCollapsedState));
        } else {
          setIsSidebarCollapsed(false); // Default to expanded on desktop
        }
      }
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchAppName = async () => {
      setAppNameLoading(true);
      try {
        const settings = await getSystemSettings();
        if (settings && settings.applicationName) {
          setCollegeName(settings.applicationName);
        }
      } catch (error) {
        console.error("Error fetching application name for faculty sidebar:", error);
      } finally {
        setAppNameLoading(false);
      }
    };
    fetchAppName();
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prevState => {
      const newState = !prevState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('faculty-sidebar-collapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        deleteCookie('firebaseAuthToken');
        toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out.',
        });
        router.push('/signin');
      } catch (error) {
        console.error('Logout failed:', error);
        toast({
          title: 'Logout Failed',
          description: 'Could not log you out. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      console.error('Firebase auth is not initialized for logout');
      toast({
        title: 'Logout Failed',
        description: 'Authentication system is not properly initialized.',
        variant: 'destructive',
      });
    }
  };
  
  if (loading || appNameLoading || isMobile === undefined) {
    const initialSkeletonCollapse = (typeof window !== 'undefined' && window.innerWidth < 768) || false;
    return (
      <div className="flex h-screen">
        <aside className={cn(
            "bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
            initialSkeletonCollapse ? "w-20" : "w-64"
          )}>
          <div>
            <div className={cn("flex items-center mb-10", initialSkeletonCollapse ? "justify-center" : "space-x-3")}>
              <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
              {!initialSkeletonCollapse && (
                <div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              )}
            </div>
            <nav className="space-y-2">
              {facultyNavigationItems.map((_, i) => (
                <div key={i} className={cn("h-10 bg-muted rounded-md animate-pulse", initialSkeletonCollapse ? "w-10 mx-auto" : "w-full")}></div>
              ))}
            </nav>
          </div>
          <div className={cn("h-10 bg-muted rounded-md animate-pulse", initialSkeletonCollapse ? "w-10 mx-auto" : "w-full")}></div>
        </aside>
        <main className="flex-1 overflow-auto bg-background p-6">
            <div className="h-full w-full bg-muted rounded-md animate-pulse"></div>
        </main>
      </div>
    );
  }


  return (
    <TooltipProvider delayDuration={0}>
    <div className="flex h-screen">
      <aside className={cn(
        "bg-sidebar-background h-screen p-4 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20 items-center" : "w-64"
      )}>
        <div>
          <div className={cn("flex items-center mb-10", isSidebarCollapsed ? "justify-center pt-2" : "space-x-3")}>
            <Image
              src="/college-logo.png"
              alt={`${collegeName} Faculty Logo`}
              width={isSidebarCollapsed ? 32 : 40}
              height={isSidebarCollapsed ? 32 : 40}
              className={cn(isSidebarCollapsed ? "h-8 w-8" : "h-10 w-10")}
              data-ai-hint="college crest logo"
            />
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-sm font-semibold text-sidebar-foreground">
                  {appNameLoading ? 'Loading...' : collegeName}
                </h1>
                <p className="text-xs text-sidebar-foreground/80">Faculty Panel</p>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {facultyNavigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
               const finalIsActive = item.href === '/' ? pathname === '/' : isActive;

              return (
                 <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                        <Link
                        href={item.href}
                        className={cn(
                            'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isSidebarCollapsed ? "justify-center" : "",
                            finalIsActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )}
                        >
                        <item.icon className={cn('w-5 h-5 shrink-0', finalIsActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-primary')} />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                    </TooltipTrigger>
                    {isSidebarCollapsed && (
                    <TooltipContent side="right" className="bg-background text-foreground border-border">
                        <p>{item.label}</p>
                    </TooltipContent>
                    )}
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-2 flex flex-col items-center">
            <div className={cn(isSidebarCollapsed ? "w-full flex justify-center" : "")}>
                 {isSidebarCollapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ThemeToggle />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-background text-foreground border-border">
                            <p>Toggle theme</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <ThemeToggle />
                )}
            </div>
           {user ? (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            isSidebarCollapsed ? "justify-center" : ""
                        )}
                    >
                        <LogOut className="w-5 h-5 text-sidebar-primary shrink-0" />
                        {!isSidebarCollapsed && <span>Logout</span>}
                    </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                <TooltipContent side="right" className="bg-background text-foreground border-border">
                    <p>Logout</p>
                </TooltipContent>
                )}
            </Tooltip>
           ) : (
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/signin')}
                        className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            isSidebarCollapsed ? "justify-center" : ""
                        )}
                        >
                        <Home className="w-5 h-5 text-sidebar-primary shrink-0" /> 
                        {!isSidebarCollapsed && <span>Sign In</span>}
                    </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                <TooltipContent side="right" className="bg-background text-foreground border-border">
                    <p>Sign In</p>
                </TooltipContent>
                )}
            </Tooltip>
           )}
            <Button
                variant="ghost"
                onClick={toggleSidebarCollapse}
                className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    isSidebarCollapsed ? "justify-center" : ""
                )}
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5 text-sidebar-primary shrink-0" /> : <ChevronsLeft className="w-5 h-5 text-sidebar-primary shrink-0" />}
                {!isSidebarCollapsed && <span>Collapse</span>}
            </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-6">
        {children}
      </main>
    </div>
    </TooltipProvider>
  );
}
