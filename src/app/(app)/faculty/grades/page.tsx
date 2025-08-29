
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
import { Loader2, Save, UserSearch, PlusCircle, Trash2 } from 'lucide-react';
import { auth as clientAuth } from '@/lib/firebase/client';
import { searchStudents } from '@/services/classroomService';
import { getGrades, updateStudentGrade, getUniqueCourseNames, deleteStudentGrade } from '@/services/grades';
import type { StudentSearchResultItem } from '@/types/classroom';
import type { Grade } from '@/types/grades';

export default function ManageGradesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResultItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResultItem | null>(null);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [isAddingNewGrade, setIsAddingNewGrade] = useState(false);
  const [newGradeInfo, setNewGradeInfo] = useState({ courseName: '', grade: '' });
  const [customCourseName, setCustomCourseName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || !clientAuth.currentUser) return;
      try {
        const idToken = await clientAuth.currentUser.getIdToken();
        const courses = await getUniqueCourseNames(idToken);
        setUniqueCourses(courses);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch existing course names.", variant: "destructive" });
      }
    };
    if (user && !authLoading) {
      fetchCourses();
    }
  }, [user, authLoading, toast]);
  
  const handleSearchStudents = async () => {
    if (!searchTerm.trim() || !user || !clientAuth.currentUser) return;
    setLoadingSearch(true);
    try {
      // Note: searchStudents requires a classroomId, which we don't have here.
      // This service method needs to be adapted or a new one created.
      // For now, let's assume a global student search exists or adapt it.
      // We will pass a dummy classroomId, and the service will ignore it for this type of search.
      const idToken = await clientAuth.currentUser.getIdToken();
      const results = await searchStudents(idToken, '__GLOBAL_SEARCH__', searchTerm);
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No Results", description: "No students found matching your search." });
      }
    } catch (error) {
      toast({ title: "Search Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectStudentForGrading = async (student: StudentSearchResultItem) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchTerm('');
    setLoadingGrades(true);
    try {
      const fetchedGrades = await getGrades(student.uid);
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
        
        // Refresh grades for the selected student
        if (selectedStudent) {
            selectStudentForGrading(selectedStudent);
        }
        // Reset new grade form if it was used
        if (isAddingNewGrade) {
            setIsAddingNewGrade(false);
            setNewGradeInfo({ courseName: '', grade: '' });
            setCustomCourseName('');
        }
        // Refresh unique courses list
        const courses = await getUniqueCourseNames(idToken);
        setUniqueCourses(courses);

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
        selectStudentForGrading(selectedStudent); // Refresh grades
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
            <CardDescription>Search for a student to view, add, or update their grades for any subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 max-w-lg mb-4">
              <Input
                type="search"
                placeholder="Search students by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
              />
              <Button onClick={handleSearchStudents} disabled={loadingSearch || !searchTerm.trim()}>
                {loadingSearch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserSearch className="mr-2 h-4 w-4" />} Search
              </Button>
            </div>

            {loadingSearch && <Skeleton className="h-20 w-full" />}

            {searchResults.length > 0 && (
              <Card className="mt-4">
                <CardHeader><CardTitle className="text-base">Search Results</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {searchResults.map(student => (
                        <TableRow key={student.uid}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => selectStudentForGrading(student)}>
                              Manage Grades
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Grading for: {selectedStudent.name}</CardTitle>
              <CardDescription>Student ID: {selectedStudent.studentId}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGrades ? (
                <Skeleton className="h-40 w-full" />
              ) : (
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
                                selectedStudent.uid, 
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
        )}
      </div>
    </>
  );
}
