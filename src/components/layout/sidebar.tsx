
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  User,
  CheckSquare,
  GraduationCap,
  CalendarCheck,
  Vote,
  LogIn,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSystemSettings } from '@/services/system-settings';
import { useIsMobile } from '@/hooks/use-is-mobile';

const navigationItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/classrooms', label: 'My Classrooms', icon: Network },
  { href: '/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { href: '/voting', label: 'Voting System', icon: Vote },
];

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [collegeName, setCollegeName] = useState('AISSMS Industrial Training Institute'); 
  const [appNameLoading, setAppNameLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAppName = async () => {
      setAppNameLoading(true);
      try {
        const settings = await getSystemSettings();
        if (settings && settings.applicationName) {
          setCollegeName(settings.applicationName);
        }
      } catch (error) {
        console.error("Error fetching application name for sidebar:", error);
      } finally {
        setAppNameLoading(false);
      }
    };
    fetchAppName();
  }, []);

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
      console.error('Firebase auth is not initialized');
      toast({
        title: 'Logout Failed',
        description: 'Authentication system is not properly initialized.',
        variant: 'destructive',
      });
    }
  };

  if ((loading || appNameLoading) && isCollapsed === undefined) { 
    return (
      <aside className={cn(
        "bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div>
          <div className={cn("flex items-center mb-10", isCollapsed ? "justify-center" : "space-x-3")}>
            <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
            {!isCollapsed && (
              <div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
                <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
              </div>
            )}
          </div>
          <nav className="space-y-2">
            {navigationItems.map((_, i) => (
              <div key={i} className={cn("h-10 bg-muted rounded-md animate-pulse", isCollapsed ? "w-10 mx-auto" : "w-full")}></div>
            ))}
          </nav>
        </div>
        <div className={cn("h-10 bg-muted rounded-md animate-pulse", isCollapsed ? "w-10 mx-auto" : "w-full")}></div>
      </aside>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
    <aside className={cn(
      "bg-sidebar-background h-screen p-4 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20 items-center" : "w-64"
    )}>
      <div>
        <div className={cn("flex items-center mb-10", isCollapsed ? "justify-center pt-2" : "space-x-3")}>
          <Image
            src="/college-logo.png"
            alt={`${collegeName} Logo`}
            width={isCollapsed ? 32 : 40}
            height={isCollapsed ? 32 : 40}
            className={cn(isCollapsed ? "h-8 w-8" : "h-10 w-10")}
            data-ai-hint="college crest logo"
          />
          {!isCollapsed && (
            <div>
              <h1 className="text-sm font-semibold text-sidebar-foreground">
                {appNameLoading ? 'Loading...' : collegeName}
              </h1>
              <p className="text-xs text-sidebar-foreground/80">Student Portal</p>
            </div>
          )}
        </div>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === '/dashboard' : true);
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isCollapsed ? "justify-center" : "",
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-primary')} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
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
        <div className={cn(isCollapsed ? "w-full flex justify-center" : "")}>
            {isCollapsed ? (
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
                    isCollapsed ? "justify-center" : ""
                )}
              >
                <LogOut className="w-5 h-5 text-sidebar-primary shrink-0" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
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
                    isCollapsed ? "justify-center" : ""
                )}
              >
                <LogIn className="w-5 h-5 text-sidebar-primary shrink-0" />
                {!isCollapsed && <span>Sign In</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="bg-background text-foreground border-border">
                <p>Sign In</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
        {!isMobile && (
            <Button
            variant="ghost"
            onClick={toggleCollapse}
            className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center" : ""
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
            {isCollapsed ? <ChevronsRight className="w-5 h-5 text-sidebar-primary shrink-0" /> : <ChevronsLeft className="w-5 h-5 text-sidebar-primary shrink-0" />}
            {!isCollapsed && <span>Collapse</span>}
            </Button>
        )}
      </div>
    </aside>
    </TooltipProvider>
  );
}
