
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserSquare, BarChart, CheckSquare, GraduationCap, AlertTriangle, Lightbulb } from 'lucide-react';
import { auth as clientAuth } from '@/lib/firebase/client';
import { getStudentProfile } from '@/services/profile';
import { getAttendanceRecords } from '@/services/attendance';
import { getGrades } from '@/services/grades';
import { analyzeGrades } from '@/ai/flows/analyze-grades-flow';
import type { StudentProfile } from '@/services/profile';
import type { AttendanceRecord } from '@/services/attendance';
import type { Grade } from '@/services/grades';
import type { GradeAnalysisOutput } from '@/types/grade-analysis';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { GradesChartCard } from '@/components/dashboard/grades-chart-card';
import { AttendanceCalendarCard } from '@/components/profile/attendance-calendar-card';

interface StudentData {
  profile: StudentProfile;
  attendance: AttendanceRecord[];
  grades: Grade[];
  analysis: GradeAnalysisOutput;
}

export default function FacultyStudentDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = params.studentId as string;

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading && studentId) {
      fetchStudentData();
    }
  }, [user, authLoading, studentId]);

  const fetchStudentData = async () => {
    if (!user || !clientAuth.currentUser) return;
    setLoadingData(true);
    setError(null);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      
      // A new service function `getStudentAttendanceForFaculty(facultyToken, studentId)` would be ideal.
      // For now, we fetch all records for the student, which is what we need for the calendar.
      const attendancePromise = getAttendanceRecords(idToken, studentId); 
      const profilePromise = getStudentProfile(idToken, studentId);
      const gradesPromise = getGrades(studentId);

      const [profile, attendance, grades] = await Promise.all([profilePromise, attendancePromise, gradesPromise]);

      if (!profile) {
        throw new Error("Student profile not found.");
      }

      const analysis = await analyzeGrades(grades);

      setStudentData({ profile, attendance, grades, analysis });

    } catch (err) {
      setError((err as Error).message || "Failed to load student data.");
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  if (loadingData || authLoading) {
    return (
      <>
        <MainHeader />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
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
        <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Error Loading Data</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
      </>
    );
  }
  
  if (!studentData) {
      return (
           <>
            <MainHeader />
            <div className="p-6 text-center">
                <p>No data available for this student.</p>
                 <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
           </>
      )
  }

  const { profile, attendance, grades, analysis } = studentData;

  return (
    <>
      <MainHeader />
      <div className="p-6 space-y-6">
        <div>
            <Button variant="outline" onClick={() => router.push('/faculty/students')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
            </Button>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl mt-4">
              Student Profile: {profile.name}
            </h2>
            <p className="text-muted-foreground">Roll No: {profile.studentId}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            <UserSquare className="mr-3 h-6 w-6 text-primary" />
                            Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-center mb-4">
                            <Image
                                src={profile.profilePhotoUrl || "https://placehold.co/150x150.png"}
                                alt="Profile Photo"
                                width={120}
                                height={120}
                                className="rounded-full object-cover shadow-md"
                                data-ai-hint="student headshot"
                            />
                        </div>
                        <div><strong className="text-muted-foreground">Email:</strong> {profile.email}</div>
                        <div><strong className="text-muted-foreground">Contact:</strong> {profile.contactNumber}</div>
                        <div><strong className="text-muted-foreground">Course:</strong> {profile.courseProgram}</div>
                        <div><strong className="text-muted-foreground">Batch:</strong> {profile.sectionOrBatch}</div>
                    </CardContent>
                </Card>
            </div>
             <div className="md:col-span-2 space-y-6">
                <GradesChartCard grades={grades} analysis={analysis} />
                <AttendanceCalendarCard attendanceRecords={attendance} />
            </div>
        </div>
      </div>
    </>
  );
}
