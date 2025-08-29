
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Search, UserPlus, Loader2, ArrowLeft, Edit, BookOpen, Save } from 'lucide-react';
import { auth as clientAuth } from '@/lib/firebase/client'; // For getIdToken
import { 
    getStudentsInClassroom,
    removeStudentFromClassroom, 
    addStudentToClassroom,
    searchStudents,
    getClassroomsByFaculty,
    updateStudentBatchInClassroom
} from '@/services/classroomService';
import { getGradesForClassroom, updateStudentGrade } from '@/services/grades'; // Import grade services
import type { ClassroomStudentInfo, StudentSearchResultItem } from '@/types/classroom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import type { Grade } from '@/types/grades'; // Import Grade type
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManageClassroomStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const classroomId = params.classroomId as string;

  const [classroom, setClassroom] = useState<{id: string, name: string, subject: string} | null>(null);
  const [currentStudents, setCurrentStudents] = useState<ClassroomStudentInfo[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  // Student Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResultItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingStudent, setEditingStudent] = useState<ClassroomStudentInfo | null>(null);
  const [newBatchValue, setNewBatchValue] = useState('');
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);

  // Grade Management State
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeInput, setGradeInput] = useState<{ [studentId: string]: string }>({});
  const [isSavingGrade, setIsSavingGrade] = useState<string | null>(null); // Tracks which student's grade is being saved
  const [courseOrExamName, setCourseOrExamName] = useState<string>("");


  const fetchClassroomDetailsAndStudents = async () => {
    if (!user || !clientAuth.currentUser || !classroomId) return;
    setLoadingStudents(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      
      const facultyClassrooms = await getClassroomsByFaculty(idToken);
      const currentClassroom = facultyClassrooms.find(c => c.id === classroomId);
      if (currentClassroom) {
        setClassroom({ id: currentClassroom.id, name: currentClassroom.name, subject: currentClassroom.subject });
        setCourseOrExamName(currentClassroom.subject || ""); // Default grade course name to classroom subject
      } else {
        toast({ title: "Error", description: "Classroom not found or not accessible.", variant: "destructive" });
        router.push('/faculty/classrooms'); 
        return;
      }

      const students = await getStudentsInClassroom(idToken, classroomId);
      setCurrentStudents(students);
    } catch (error) {
      toast({ title: "Error", description: `Could not load classroom data: ${(error as Error).message}`, variant: "destructive" });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchGrades = async () => {
    if (!user || !clientAuth.currentUser || !classroomId || !courseOrExamName.trim()) return;
    setLoadingGrades(true);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        const fetchedGrades = await getGradesForClassroom(idToken, classroomId, courseOrExamName.trim());
        setGrades(fetchedGrades);
        const initialGradeInput: { [studentId: string]: string } = {};
        fetchedGrades.forEach(grade => {
            initialGradeInput[grade.studentId] = grade.grade;
        });
        setGradeInput(initialGradeInput);
    } catch (error) {
        toast({ title: "Error Fetching Grades", description: (error as Error).message, variant: "destructive" });
    } finally {
        setLoadingGrades(false);
    }
  };
  
  useEffect(() => {
    if (user && !authLoading && classroomId) {
      fetchClassroomDetailsAndStudents();
    }
  }, [user, authLoading, classroomId]);
  
  // Refetch grades when course/exam name changes
  useEffect(() => {
    if (courseOrExamName.trim()) {
        fetchGrades();
    } else {
        setGrades([]);
        setGradeInput({});
    }
  }, [courseOrExamName]);


  const handleSearchStudents = async () => {
    if (!searchTerm.trim() || !user || !clientAuth.currentUser) return;
    setLoadingSearch(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const results = await searchStudents(idToken, classroomId, searchTerm);
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No Results", description: "No students found matching your search criteria or eligible to be added." });
      }
    } catch (error) {
      toast({ title: "Search Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddStudent = async (studentUid: string) => {
    if (!user || !clientAuth.currentUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await addStudentToClassroom(idToken, classroomId, studentUid);
      toast({ title: "Student Added", description: "The student has been added to the classroom." });
      fetchClassroomDetailsAndStudents(); 
      setSearchTerm(''); 
      setSearchResults([]); 
    } catch (error) {
      toast({ title: "Error Adding Student", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentUid: string) => {
    if (!user || !clientAuth.currentUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await removeStudentFromClassroom(idToken, classroomId, studentUid);
      toast({ title: "Student Removed", description: "The student has been removed from the classroom." });
      fetchClassroomDetailsAndStudents(); 
    } catch (error) {
      toast({ title: "Error Removing Student", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openBatchEditModal = (student: ClassroomStudentInfo) => {
    setEditingStudent(student);
    setNewBatchValue(student.batch || '');
    setIsBatchEditModalOpen(true);
  };

  const handleSaveBatch = async () => {
    if (!editingStudent || !user || !clientAuth.currentUser) return;
    setIsSubmitting(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await updateStudentBatchInClassroom(idToken, classroomId, editingStudent.userId, newBatchValue.trim());
      toast({ title: "Batch Updated", description: `${editingStudent.name}'s batch updated to "${newBatchValue.trim() || 'N/A'}".` });
      fetchClassroomDetailsAndStudents();
      setIsBatchEditModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      toast({ title: "Error Updating Batch", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeInputChange = (studentId: string, value: string) => {
    setGradeInput(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveGrade = async (studentId: string) => {
    if (!user || !clientAuth.currentUser || !classroomId || !courseOrExamName.trim()) {
        toast({ title: "Error", description: "Missing required information to save grade.", variant: "destructive" });
        return;
    }
    
    const grade = gradeInput[studentId];
    if (grade === undefined) return; // No change

    const student = currentStudents.find(s => s.userId === studentId);
    if (!student) return;

    setIsSavingGrade(studentId);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        await updateStudentGrade(idToken, {
            classroomId,
            studentId,
            courseName: courseOrExamName.trim(),
            grade
        });
        toast({ title: "Grade Saved", description: `Grade for ${student.name} saved as "${grade}".` });
        fetchGrades(); // Refresh grades to get latest timestamp/confirm save
    } catch (error) {
        toast({ title: "Error Saving Grade", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSavingGrade(null);
    }
  };
  
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (searchTerm.trim().length > 2) { 
          handleSearchStudents();
        } else if (searchTerm.trim().length === 0) {
            setSearchResults([]); 
        }
      }, 500); 
    };
  }, [searchTerm, classroomId, user]);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, debouncedSearch]);


  if (authLoading || (!user && !authLoading)) { 
    return (
      <>
        <MainHeader />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-1/3" /> 
          <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-60 w-full" /></CardContent>
          </Card>
        </div>
      </>
    );
  }


  return (
    <>
      <MainHeader />
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.push('/faculty/classrooms')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classrooms
        </Button>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Manage: {loadingStudents ? <Skeleton className="inline-block h-8 w-48" /> : classroom?.name || 'Classroom'}
        </h2>

        <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Manage Students</TabsTrigger>
                <TabsTrigger value="grades">Manage Grades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="students" className="mt-6 space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>Current Students ({currentStudents.length})</CardTitle>
                    <CardDescription>Students currently enrolled. Batches are auto-assigned if student ID format is like 'A-123'.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingStudents ? (
                    <Skeleton className="h-40 w-full" />
                    ) : currentStudents.length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {currentStudents.map((student) => (
                            <TableRow key={student.userId}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.studentIdNumber}</TableCell>
                            <TableCell>{student.email || 'N/A'}</TableCell>
                            <TableCell>{student.batch || 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => openBatchEditModal(student)} disabled={isSubmitting} className="text-blue-600 hover:text-blue-700">
                                <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveStudent(student.userId)} disabled={isSubmitting} className="text-destructive hover:text-destructive/80">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    ) : (
                    <p className="text-muted-foreground">No students currently in this classroom.</p>
                    )}
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>Add Students</CardTitle>
                    <CardDescription>Search for students by name, email, or student ID to add them to this classroom.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                    <Input 
                        type="search" 
                        placeholder="Search students..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleSearchStudents} disabled={loadingSearch || !searchTerm.trim()}>
                        {loadingSearch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
                    </Button>
                    </div>

                    {loadingSearch && <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Searching...</span></div>}
                    
                    {!loadingSearch && searchResults.length > 0 && (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {searchResults.map((student) => (
                            <TableRow key={student.uid}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleAddStudent(student.uid)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus className="h-4 w-4" />} Add
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    )}
                    {!loadingSearch && searchTerm.trim() && searchResults.length === 0 && (
                        <p className="text-muted-foreground text-center p-4">No students found matching "{searchTerm}" or they are already in this classroom.</p>
                    )}
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="grades" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Enter Student Grades</CardTitle>
                        <CardDescription>
                            Enter a course or exam name, then input and save grades for each student.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-md mb-6">
                            <Label htmlFor="courseOrExamName">Course / Exam Name*</Label>
                            <Input 
                                id="courseOrExamName"
                                value={courseOrExamName}
                                onChange={(e) => setCourseOrExamName(e.target.value)}
                                placeholder="e.g., Final Exam, Physics 101"
                            />
                        </div>

                        {loadingStudents || (loadingGrades && courseOrExamName.trim()) ? (
                            <Skeleton className="h-40 w-full" />
                        ) : currentStudents.length > 0 && courseOrExamName.trim() ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentStudents.map(student => (
                                        <TableRow key={student.userId}>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.studentIdNumber}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={gradeInput[student.userId] || ""}
                                                    onValueChange={(value) => handleGradeInputChange(student.userId, value)}
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue placeholder="Set Grade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A+">A+</SelectItem>
                                                        <SelectItem value="A">A</SelectItem>
                                                        <SelectItem value="B+">B+</SelectItem>
                                                        <SelectItem value="B">B</SelectItem>
                                                        <SelectItem value="C+">C+</SelectItem>
                                                        <SelectItem value="C">C</SelectItem>
                                                        <SelectItem value="D">D</SelectItem>
                                                        <SelectItem value="F">F</SelectItem>
                                                        <SelectItem value="ABS">Absent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleSaveGrade(student.userId)} 
                                                    disabled={isSavingGrade === student.userId || gradeInput[student.userId] === undefined}
                                                >
                                                    {isSavingGrade === student.userId ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center p-4">
                                {currentStudents.length === 0 ? "No students in this classroom." : "Please enter a course/exam name to manage grades."}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        

        {editingStudent && (
          <Dialog open={isBatchEditModalOpen} onOpenChange={setIsBatchEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Batch for {editingStudent.name}</DialogTitle>
                <DialogDescription>
                  Student ID: {editingStudent.studentIdNumber}. Current Batch: {editingStudent.batch || 'N/A'}. 
                  Enter the new batch name. Leave empty to remove batch assignment.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="batchValue">New Batch</Label>
                <Input 
                  id="batchValue" 
                  value={newBatchValue}
                  onChange={(e) => setNewBatchValue(e.target.value)}
                  placeholder="e.g., A, B, Practical Group 1" 
                />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={() => setEditingStudent(null)} disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button onClick={handleSaveBatch} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Batch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </>
  );
}
