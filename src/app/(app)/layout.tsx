
'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { FacultyLayout } from '@/components/layout/faculty-layout';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';

type UserRole = 'admin' | 'faculty' | 'student' | null;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const [isStudentSidebarCollapsed, setIsStudentSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCollapsedState = localStorage.getItem('sidebar-collapsed');
      if (storedCollapsedState) {
        setIsStudentSidebarCollapsed(JSON.parse(storedCollapsedState));
      }
    }
  }, []);

  useEffect(() => {
    if (loading) {
      setCheckingRole(true); // Reset checkingRole if auth loading state changes
      return;
    }

    if (!user) {
      // If no user, auth is done loading, so no role to check.
      setUserRole(null);
      setCheckingRole(false);
      // Trigger redirect
      if (pathname !== '/signin' && pathname !== '/signup' && pathname !== '/maintenance') {
        console.log(`AppLayout (No User Branch): Attempting to redirect from ${pathname} to /signin.`);
        router.push('/signin');
      }
      return;
    }

    // User exists, proceed with role checking
    setCheckingRole(true);
    if (user.email === 'admin@gmail.com') {
      setUserRole('admin');
      setCheckingRole(false);
    } else if (db) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then(userDocSnap => {
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Ensure role is one of the expected UserRole types
          const roleFromDb = userData.role;
          if (roleFromDb === 'admin' || roleFromDb === 'faculty' || roleFromDb === 'student') {
            setUserRole(roleFromDb);
          } else {
            setUserRole('student'); // Default if role is invalid or missing
          }
        } else {
          setUserRole('student'); // Default if no user document
        }
      }).catch(error => {
        console.error("Error fetching user role:", error);
        setUserRole('student'); // Default on error
      }).finally(() => {
        setCheckingRole(false);
      });
    } else {
        console.error("Firestore db instance is not available for role checking. Defaulting to student role.");
        setUserRole('student');
        setCheckingRole(false);
    }
  }, [user, loading, router, pathname, db]); // Added db and pathname to dependencies

  const toggleStudentSidebarCollapse = () => {
    setIsStudentSidebarCollapsed(prevState => {
      const newState = !prevState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };

  if (loading || checkingRole || isMobile === undefined) {
    return (
      <div className="flex h-screen">
        {!isMobile && (
          <aside className={cn(
              "bg-sidebar-background h-full p-6 flex flex-col justify-between shadow-lg border-r border-sidebar-border transition-all duration-300 ease-in-out",
              isStudentSidebarCollapsed ? "w-20" : "w-64"
            )}>
             <div>
               <div className="flex items-center space-x-3 mb-10">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  {!isStudentSidebarCollapsed && (
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  )}
               </div>
               <nav className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className={cn("h-10 w-full rounded-md", isStudentSidebarCollapsed && "w-10 mx-auto")} />
                  ))}
               </nav>
             </div>
             <Skeleton className={cn("h-10 w-full rounded-md", isStudentSidebarCollapsed && "w-10 mx-auto")} />
          </aside>
        )}
        <main className="flex-1 p-6 overflow-auto">
           <Skeleton className="h-16 w-full mb-6" />
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
           </div>
           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-[590px] w-full" />
                </div>
            </div>
        </main>
      </div>
    );
  }

  if (!user && !loading && !checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Redirecting to sign in...</p>
      </div>
    );
  }

  if (user) {
    if (userRole === 'admin') {
      return <AdminLayout>{children}</AdminLayout>;
    }
    if (userRole === 'faculty') {
      return <FacultyLayout>{children}</FacultyLayout>;
    }
    
    return (
      <div className="flex h-screen bg-background">
        {!isMobile && (
          <Sidebar isCollapsed={isStudentSidebarCollapsed} toggleCollapse={toggleStudentSidebarCollapse} />
        )}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
              {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Preparing application...</p>
      </div>
  );
}
