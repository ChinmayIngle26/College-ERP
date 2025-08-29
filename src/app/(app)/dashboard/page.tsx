
'use client'; 

import { getStudentProfile } from '@/services/profile';
import { getAttendanceRecords } from '@/services/attendance';
import { getGrades } from '@/services/grades';
import { getAnnouncements } from '@/services/announcements'; 
import { ProfileCard } from '@/components/dashboard/profile-card'; 
import { AttendanceOverviewCard } from '@/components/dashboard/attendance-overview-card'; 
import { GradesChartCard } from '@/components/dashboard/grades-chart-card'; 
import { AnnouncementsCard } from '@/components/dashboard/announcements-card'; 
import { SummaryCard } from '@/components/dashboard/summary-card'; 
import { Suspense, useEffect, useState } from 'react'; 
import { Skeleton } from '@/components/ui/skeleton';
import { MainHeader } from '@/components/layout/main-header';
import { Award, CalendarClock, CheckCircle, DoorOpen, AlertTriangle } from 'lucide-react'; 
import { useAuth } from '@/context/auth-context'; 
import { auth as clientAuth, db } from '@/lib/firebase/client'; // Import clientAuth
import type { StudentProfile } from '@/services/profile';
import type { AttendanceRecord } from '@/services/attendance';
import type { Grade } from '@/services/grades';
import type { Announcement } from '@/services/announcements';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeGrades, type GradeAnalysisOutput } from '@/ai/flows/analyze-grades-flow';


interface DashboardData {
  profile: StudentProfile | null;
  attendanceRecords: AttendanceRecord[];
  grades: Grade[];
  gradeAnalysis: GradeAnalysisOutput;
  announcements: Announcement[];
  attendancePercentage: number;
  gpa: string;
  upcomingAppointments: number; 
  activeGatePasses: number; 
}

const calculateGPA = (grades: Grade[]): string => {
  if (grades.length === 0) return 'N/A';
  const gradePoints: { [key: string]: number } = { 'A+': 4.0, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
  const totalPoints = grades.reduce((sum, grade) => sum + (gradePoints[grade.grade.toUpperCase()] || 0), 0);
  const validGradesCount = grades.filter(grade => gradePoints[grade.grade.toUpperCase()] !== undefined).length;
  if (validGradesCount === 0) return 'N/A'; 
  return (totalPoints / validGradesCount).toFixed(1);
};


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); 
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && clientAuth.currentUser && db) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
           const userDocRef = doc(db, "users", user.uid);
           const userDocSnap = await getDoc(userDocRef);
           let profileData: StudentProfile | null = null;

           if (userDocSnap.exists()) {
             profileData = { ...userDocSnap.data() } as StudentProfile;
             if (!profileData.studentId) profileData.studentId = user.uid;
             if (!profileData.name) profileData.name = user.displayName || "Student";
             if (!profileData.email) profileData.email = user.email || "N/A";
           } else {
               console.warn(`User document not found for UID: ${user.uid}`);
               profileData = { name: user.displayName || 'Student', studentId: user.uid, courseProgram: 'Unknown', email: user.email || "N/A" } as StudentProfile;
           }

          const idToken = await clientAuth.currentUser!.getIdToken(true); // Force refresh token
          const attendancePromise = getAttendanceRecords(idToken);
          
          // Conditionally fetch grades only if studentId exists and is not the same as the UID fallback
          const gradesPromise = (profileData?.studentId && profileData.studentId !== user.uid)
                ? getGrades(profileData.studentId)
                : Promise.resolve([]);

          const announcementsPromise = getAnnouncements();

          const [attendanceRecords, grades, announcements] = await Promise.all([
            attendancePromise,
            gradesPromise,
            announcementsPromise,
          ]);

          // Fetch grade analysis after grades are available
          const gradeAnalysisPromise = analyzeGrades(grades);

          const totalDays = attendanceRecords.length;
          const presentDays = attendanceRecords.filter(
            (record) => record.status === 'present'
          ).length;
          const attendancePercentage =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          const gpa = calculateGPA(grades);
          const upcomingAppointments = 0; // Replace with actual data
          const activeGatePasses = 0; // Replace with actual data
          
          const gradeAnalysis = await gradeAnalysisPromise;


          setData({
            profile: profileData,
            attendanceRecords,
            grades,
            gradeAnalysis,
            announcements,
            attendancePercentage,
            gpa,
            upcomingAppointments,
            activeGatePasses,
          });
        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
          const errorMessage = (err as Error).message || "An unknown error occurred.";
          if (errorMessage.includes("Admin SDK initialization failed")) {
             setError("Could not load all dashboard data because the server is not configured correctly. Please contact the administrator or check the GOOGLE_APPLICATION_CREDENTIALS_JSON variable in your .env.local file.");
          } else {
             setError("Failed to load dashboard data. Please try refreshing the page.");
          }
           toast({
              title: "Dashboard Error",
              description: "Could not load all dashboard data.",
              variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
      console.log("User not logged in, dashboard won't load.");
    } else if (!authLoading && user && (!clientAuth.currentUser || !db)){
        setLoading(false);
        setError("Firebase services not fully initialized. Please try again.");
        console.error("Dashboard: Firebase clientAuth.currentUser or db is null/undefined when user object exists.");
    }
  }, [user, authLoading, toast]); 

  if (loading || authLoading) {
    return (
      <>
        <MainHeader />
        <div className="space-y-6">
           <Skeleton className="h-8 w-48" /> 
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
                <div className="lg:col-span-1">
                     <Skeleton className="h-[590px] w-full" /> 
                </div>
            </div>
        </div>
      </>
    );
  }

   if (error) {
      return (
          <>
              <MainHeader />
              <div className="flex h-[calc(100vh-150px)] items-center justify-center p-6"> 
                  <Card className="w-full max-w-2xl border-destructive">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-destructive">
                              <AlertTriangle className="h-6 w-6" />
                              Dashboard Error
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p>{error}</p>
                      </CardContent>
                  </Card>
              </div>
          </>
      )
  }

   if (!user || !data || !data.profile) {
     return (
          <>
              <div className="flex h-screen items-center justify-center"> 
                  {user ? (
                     <p className="text-muted-foreground">Could not load dashboard information.</p>
                  ) : (
                     <p className="text-muted-foreground">Redirecting to sign in...</p> 
                  )}
              </div>
          </>
      )
  }

  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome, {data.profile.name}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Attendance Percentage"
            value={`${data.attendancePercentage}%`}
            icon={CheckCircle}
          />
          <SummaryCard
            title="GPA"
            value={data.gpa}
            icon={Award}
          />
          <SummaryCard
            title="Upcoming Appointments"
            value={data.upcomingAppointments.toString()}
            icon={CalendarClock}
          />
          <SummaryCard
            title="Active Gate Passes"
            value={data.activeGatePasses.toString()}
            icon={DoorOpen}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <AttendanceOverviewCard attendanceRecords={data.attendanceRecords} />
            <GradesChartCard grades={data.grades} analysis={data.gradeAnalysis} />
          </div>
          <div className="lg:col-span-1">
            <AnnouncementsCard announcements={data.announcements} />
          </div>
        </div>
      </div>
    </>
  );
}
