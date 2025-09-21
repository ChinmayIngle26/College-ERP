
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, UserSearch, PlusCircle, Trash2, Users } from 'lucide-react';
import { auth as clientAuth } from '@/lib/firebase/client';
import { getClassroomsByFaculty, getStudentsInClassroom } from '@/services/classroomService';
import { getGrades, updateStudentGrade, getUniqueCourseNames, deleteStudentGrade } from '@/services/grades';
import type { Classroom, ClassroomStudentInfo } from '@/types/classroom';
import type { Grade } from '@/types/grades';
import { cn } from '@/lib/utils';

export default function ManageGradesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>();
  
  const [studentsInClassroom, setStudentsInClassroom] = useState<ClassroomStudentInfo[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<ClassroomStudentInfo | null>(null);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [isAddingNewGrade, setIsAddingNewGrade] = useState(false);
  const [newGradeInfo, setNewGradeInfo] = useState({ courseName: '', grade: '' });
  const [customCourseName, setCustomCourseName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchFacultyClassrooms();
      fetchUniqueCourses();
    }
  }, [user, authLoading]);

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
  
  const fetchUniqueCourses = async () => {
    if (!user || !clientAuth.currentUser) return;
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const courses = await getUniqueCourseNames(idToken);
      setUniqueCourses(courses);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch existing course names.", variant: "destructive" });
    }
  };

  const handleClassroomSelect = async (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    setSelectedStudent(null);
    setStudentsInClassroom([]);
    if (!classroomId || !clientAuth.currentUser) return;
    
    setLoadingStudents(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const students = await getStudentsInClassroom(idToken, classroomId);
      // Sort students by studentIdNumber (roll number)
      const sortedStudents = students.sort((a, b) => 
        (a.studentIdNumber || '').localeCompare(b.studentIdNumber || '', undefined, { numeric: true })
      );
      setStudentsInClassroom(sortedStudents);
    } catch (error) {
      toast({ title: "Error", description: "Could not load students for this classroom.", variant: "destructive" });
    } finally {
      setLoadingStudents(false);
    }
  };

  const selectStudentForGrading = async (student: ClassroomStudentInfo) => {
    setSelectedStudent(student);
    setLoadingGrades(true);
    try {
      const fetchedGrades = await getGrades(student.userId);
      setStudentGrades(fetchedGrades);
    } catch (error) {
      toast({ title: "Error", description: `Could not fetch grades for ${student.name}.`, variant: "destructive" });
      setStudentGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleSaveGrade = async (studentId: string, courseName: string, grade: string) => {
    if (!user || !clientAuth.currentUser) return;
    if (!courseName.trim() || !grade.trim()) {
        toast({ title: "Validation Error", description: "Course name and grade cannot be empty.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        await updateStudentGrade(idToken, { studentId, courseName: courseName.trim(), grade });
        toast({ title: "Grade Saved", description: `Grade for ${courseName.trim()} saved successfully.` });
        
        if (selectedStudent) {
            selectStudentForGrading(selectedStudent);
        }
        if (isAddingNewGrade) {
            setIsAddingNewGrade(false);
            setNewGradeInfo({ courseName: '', grade: '' });
            setCustomCourseName('');
        }
        fetchUniqueCourses();

    } catch (error) {
        toast({ title: "Error Saving Grade", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!user || !clientAuth.currentUser || !selectedStudent) return;
    
    setIsSubmitting(true);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        await deleteStudentGrade(idToken, gradeId);
        toast({ title: "Grade Deleted", description: "The grade has been successfully deleted." });
        selectStudentForGrading(selectedStudent);
    } catch (error) {
        toast({ title: "Error Deleting Grade", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading) return <Skeleton className="h-screen w-full" />;

  return (
    <>
      <MainHeader />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Student Grades</CardTitle>
            <CardDescription>Select a classroom to view its students and manage their grades.</CardDescription>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Students
                  </CardTitle>
                  <CardDescription>Select a student to manage their grades.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStudents ? <Skeleton className="h-40 w-full" /> : 
                    studentsInClassroom.length > 0 ? (
                        <div className="overflow-auto max-h-[60vh] relative">
                            <Table>
                                <TableBody>
                                    {studentsInClassroom.map(student => (
                                        <TableRow 
                                            key={student.userId} 
                                            onClick={() => selectStudentForGrading(student)}
                                            className={cn("cursor-pointer", selectedStudent?.userId === student.userId && "bg-muted")}
                                        >
                                            <TableCell>
                                                <div>{student.name}</div>
                                                <div className="text-xs text-muted-foreground">{student.studentIdNumber}</div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">No students in this classroom.</p>
                    )
                  }
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {selectedStudent ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Grading for: {selectedStudent.name}</CardTitle>
                    <CardDescription>Student ID: {selectedStudent.studentIdNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingGrades ? <Skeleton className="h-40 w-full" /> : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Course / Subject</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentGrades.map(grade => (
                              <TableRow key={grade.id}>
                                <TableCell>{grade.courseName}</TableCell>
                                <TableCell>{grade.grade}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" disabled={isSubmitting} onClick={() => handleDeleteGrade(grade.id!)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {isAddingNewGrade && (
                              <TableRow>
                                <TableCell>
                                  {newGradeInfo.courseName === '__CUSTOM__' ? (
                                      <Input 
                                          placeholder="Enter new course name" 
                                          value={customCourseName}
                                          onChange={(e) => setCustomCourseName(e.target.value)}
                                      />
                                  ) : (
                                      <Select
                                          value={newGradeInfo.courseName}
                                          onValueChange={(value) => setNewGradeInfo(prev => ({ ...prev, courseName: value }))}
                                      >
                                          <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                                          <SelectContent>
                                              {uniqueCourses.map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                                              <SelectItem value="__CUSTOM__">Add new course...</SelectItem>
                                          </SelectContent>
                                      </Select>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Input 
                                      placeholder="Enter grade"
                                      value={newGradeInfo.grade}
                                      onChange={(e) => setNewGradeInfo(prev => ({...prev, grade: e.target.value.toUpperCase()}))}
                                  />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                   <Button size="sm" disabled={isSubmitting} onClick={() => handleSaveGrade(
                                      selectedStudent.userId, 
                                      newGradeInfo.courseName === '__CUSTOM__' ? customCourseName : newGradeInfo.courseName,
                                      newGradeInfo.grade
                                   )}>
                                      <Save className="h-4 w-4" />
                                   </Button>
                                   <Button variant="outline" size="sm" onClick={() => { setIsAddingNewGrade(false); setNewGradeInfo({ courseName: '', grade: '' }); setCustomCourseName(''); }}>
                                      Cancel
                                   </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        {!isAddingNewGrade && (
                          <Button variant="outline" onClick={() => setIsAddingNewGrade(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Grade
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex items-center justify-center h-full min-h-[20rem]">
                    <div className="text-center text-muted-foreground">
                        <p>Select a student from the list to manage their grades.</p>
                    </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
