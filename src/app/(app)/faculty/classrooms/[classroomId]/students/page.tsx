
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Search, UserPlus, Loader2, ArrowLeft, Edit } from 'lucide-react';
import { auth as clientAuth } from '@/lib/firebase/client'; // For getIdToken
import { 
    getStudentsInClassroom,
    removeStudentFromClassroom, 
    addStudentsToClassroom,
    searchStudents,
    getClassroomsByFaculty,
    updateStudentBatchInClassroom
} from '@/services/classroomService';
import type { ClassroomStudentInfo, StudentSearchResultItem } from '@/types/classroom';

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
  const [selectedStudents, setSelectedStudents] = useState<{[key: string]: StudentSearchResultItem}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingStudent, setEditingStudent] = useState<ClassroomStudentInfo | null>(null);
  const [newBatchValue, setNewBatchValue] = useState('');
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);

  const fetchClassroomDetailsAndStudents = async () => {
    if (!user || !clientAuth.currentUser || !classroomId) return;
    setLoadingStudents(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      
      const facultyClassrooms = await getClassroomsByFaculty(idToken);
      const currentClassroom = facultyClassrooms.find(c => c.id === classroomId);
      if (currentClassroom) {
        setClassroom({ id: currentClassroom.id, name: currentClassroom.name, subject: currentClassroom.subject });
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
  
  useEffect(() => {
    if (user && !authLoading && classroomId) {
      fetchClassroomDetailsAndStudents();
    }
  }, [user, authLoading, classroomId]);
  
  const handleSearchStudents = async () => {
    if (!searchTerm.trim() || !user || !clientAuth.currentUser) return;
    setLoadingSearch(true);
    setSelectedStudents({});
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

  const handleAddSelectedStudents = async () => {
    if (!user || !clientAuth.currentUser) return;
    const studentUidsToAdd = Object.keys(selectedStudents);
    if(studentUidsToAdd.length === 0){
        toast({ title: "No Students Selected", description: "Please select students to add." });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const studentsDetails = studentUidsToAdd.map(uid => selectedStudents[uid]);
      await addStudentsToClassroom(idToken, classroomId, studentsDetails);

      toast({ title: "Students Added", description: `${studentUidsToAdd.length} student(s) have been added to the classroom.` });
      fetchClassroomDetailsAndStudents(); 
      setSearchTerm(''); 
      setSearchResults([]);
      setSelectedStudents({});
    } catch (error) {
      toast({ title: "Error Adding Students", description: (error as Error).message, variant: "destructive" });
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

  const handleSelectStudent = (student: StudentSearchResultItem, isSelected: boolean) => {
    setSelectedStudents(prev => {
        const newSelection = {...prev};
        if(isSelected){
            newSelection[student.uid] = student;
        } else {
            delete newSelection[student.uid];
        }
        return newSelection;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
      if(isSelected){
          const allSelected = searchResults.reduce((acc, student) => {
              acc[student.uid] = student;
              return acc;
          }, {} as {[key: string]: StudentSearchResultItem});
          setSelectedStudents(allSelected);
      } else {
          setSelectedStudents({});
      }
  };
  
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
          Manage Students: {loadingStudents ? <Skeleton className="inline-block h-8 w-48" /> : classroom?.name || 'Classroom'}
        </h2>

        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Current Students ({currentStudents.length})</CardTitle>
                <CardDescription>Students currently enrolled. Batches can be assigned by editing a student.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingStudents ? (
                <Skeleton className="h-40 w-full" />
                ) : currentStudents.length > 0 ? (
                <div className="overflow-auto max-h-[60vh] relative">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
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
                </div>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
                    className="flex-grow"
                />
                <Button onClick={handleSearchStudents} disabled={loadingSearch || !searchTerm.trim()}>
                    {loadingSearch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
                </Button>
                </div>

                {loadingSearch && <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Searching...</span></div>}
                
                {!loadingSearch && searchResults.length > 0 && (
                <>
                <div className="mb-4">
                    <Button onClick={handleAddSelectedStudents} disabled={isSubmitting || Object.keys(selectedStudents).length === 0}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Add Selected ({Object.keys(selectedStudents).length})
                    </Button>
                </div>
                <div className="overflow-auto max-h-[50vh] relative">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={Object.keys(selectedStudents).length === searchResults.length && searchResults.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {searchResults.map((student) => (
                            <TableRow key={student.uid} data-state={selectedStudents[student.uid] ? "selected" : ""}>
                                <TableCell>
                                    <Checkbox
                                        checked={!!selectedStudents[student.uid]}
                                        onCheckedChange={(checked) => handleSelectStudent(student, !!checked)}
                                        aria-label={`Select ${student.name}`}
                                    />
                                </TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.studentId}</TableCell>
                                <TableCell>{student.email}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                </>
                )}
                {!loadingSearch && searchTerm.trim() && searchResults.length === 0 && (
                    <p className="text-muted-foreground text-center p-4">No students found matching "{searchTerm}" or they are already in this classroom.</p>
                )}
            </CardContent>
            </Card>
        </div>
        
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

    
    