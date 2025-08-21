
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context'; // Optional: for extra checks or personalization
import { useRouter } from 'next/navigation'; // Optional: for programmatic navigation
import { useEffect } from 'react'; // Optional: for side effects like redirecting if not faculty

export default function FacultyDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Optional: Add a client-side check to ensure only faculty access this page,
  // though the layout should primarily handle this.
  // useEffect(() => {
  //   if (!loading && user) {
  //     // Logic to check if user.role is 'faculty' from Firestore
  //     // If not, router.push('/');
  //   } else if (!loading && !user) {
  //     router.push('/signin');
  //   }
  // }, [user, loading, router]);

  return (
    <>
      <MainHeader /> {/* Reusing MainHeader, or create a FacultyHeader */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Faculty Dashboard
        </h2>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Welcome, Faculty Member!</CardTitle>
            <CardDescription>Manage your classrooms and student attendance from here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>This is your central hub for various faculty-specific tasks and information.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="text-lg">Manage Classrooms</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Create, view, and update your student groups.</p>
                    <Button asChild variant="outline">
                        <Link href="/faculty/classrooms">Go to Classrooms</Link>
                    </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="text-lg">Update Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Record and manage attendance for your lectures.</p>
                    <Button asChild variant="outline">
                        <Link href="/faculty/attendance">Go to Attendance</Link>
                    </Button>
                </CardContent>
              </Card>
            </div>
            {/* More cards/widgets can be added here for quick stats or actions */}
             <Card className="mt-6">
                <CardHeader><CardTitle className="text-lg">Quick Links</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button variant="link" asChild><Link href="/profile">My Profile</Link></Button>
                    <Button variant="link" asChild><Link href="/">Student Dashboard View</Link></Button>
                </CardContent>
             </Card>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
