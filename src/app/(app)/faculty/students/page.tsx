
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Eye } from 'lucide-react';
import { auth as clientAuth } from '@/lib/firebase/client';
import { getClassroomsByFaculty, getStudentsInClassroom } from '@/services/classroomService';
import type { Classroom, ClassroomStudentInfo } from '@/types/classroom';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FacultyViewStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  
  // Initialize selectedClassroomId from URL search params
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>(() => searchParams.get('classroomId') || undefined);
  
  const [studentsInClassroom, setStudentsInClassroom] = useState<ClassroomStudentInfo[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchFacultyClassrooms();
    }
  }, [user, authLoading]);

  // When classrooms are loaded, if there's a selected ID from the URL, fetch its students
  useEffect(() => {
      if (selectedClassroomId && classrooms.length > 0) {
          // Check if the selectedClassroomId is valid
          if(classrooms.some(c => c.id === selectedClassroomId)) {
            fetchStudentsForClassroom(selectedClassroomId);
          } else {
            // If the classroomId from URL is not valid, clear it
            updateUrlWithClassroomId(undefined);
            setSelectedClassroomId(undefined);
          }
      }
  }, [selectedClassroomId, classrooms]);


  const fetchFacultyClassrooms = async () => {
    if (!user || !clientAuth.currentUser) return;
    setLoadingClassrooms(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const fetchedClassrooms = await getClassroomsByFaculty(idToken);
      setClassrooms(fetchedClassrooms);
    } catch (error) {
      toast({ title: "Error", description: "Could not load your classrooms.", variant: "destructive" });
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const fetchStudentsForClassroom = async (classroomId: string) => {
    if (!classroomId || !clientAuth.currentUser) return;
    setLoadingStudents(true);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        const students = await getStudentsInClassroom(idToken, classroomId);
        const sortedStudents = students.sort((a, b) => 
            (a.studentIdNumber || '').localeCompare(b.studentIdNumber || '', undefined, { numeric: true })
        );
        setStudentsInClassroom(sortedStudents);
    } catch (error) {
        toast({ title: "Error", description: "Could not load students for this classroom.", variant: "destructive" });
    } finally {
        setLoadingStudents(false);
    }
  }

  const updateUrlWithClassroomId = (classroomId: string | undefined) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (!classroomId) {
        current.delete('classroomId');
    } else {
        current.set('classroomId', classroomId);
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    // Using replace to avoid adding to browser history for simple state changes
    router.replace(`${pathname}${query}`);
  };


  const handleClassroomSelect = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    updateUrlWithClassroomId(classroomId); // Update URL when selection changes
  };

  if (authLoading) return <Skeleton className="h-screen w-full" />;

  return (
    <>
      <MainHeader />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>View Student Profiles</CardTitle>
            <CardDescription>Select a classroom to view its students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
                <Select value={selectedClassroomId} onValueChange={handleClassroomSelect} disabled={loadingClassrooms || classrooms.length === 0}>
                    <SelectTrigger id="classroom-select">
                        <SelectValue placeholder={loadingClassrooms ? "Loading classrooms..." : "Select a classroom"} />
                    </SelectTrigger>
                    <SelectContent>
                        {classrooms.map(cr => (<SelectItem key={cr.id} value={cr.id}>{cr.name} ({cr.subject})</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>

        {selectedClassroomId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Students in Classroom
              </CardTitle>
              <CardDescription>Select a student to view their detailed profile and performance.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudents ? <Skeleton className="h-40 w-full" /> : 
                studentsInClassroom.length > 0 ? (
                    <div className="overflow-auto max-h-[60vh] relative border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Roll No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsInClassroom.map(student => (
                                    <TableRow 
                                        key={student.userId}
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => router.push(`/faculty/students/${student.userId}`)}
                                    >
                                        <TableCell>{student.studentIdNumber}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.email || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/faculty/students/${student.userId}?classroomId=${selectedClassroomId}`} passHref>
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-6">No students found in this classroom.</p>
                )
              }
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
