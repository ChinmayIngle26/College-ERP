
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { auth as clientAuth } from '@/lib/firebase/client';
import { getStudentClassroomsWithBatchInfo, getClassmatesInfo } from '@/services/classroomService';
import type { StudentClassroomEnrollmentInfo, ClassmateInfo } from '@/types/classroom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2, Network, MessageSquare } from 'lucide-react'; // Added MessageSquare
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChatRoom } from '@/components/chat/ChatRoom'; // Import ChatRoom

function StudentClassroomsLoader() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<StudentClassroomEnrollmentInfo[]>([]);
  const [loadingClassrooms, setLoadingClassroomsState] = useState(true);

  const [selectedClassroomForClassmates, setSelectedClassroomForClassmates] = useState<StudentClassroomEnrollmentInfo | null>(null);
  const [classmates, setClassmates] = useState<ClassmateInfo[]>([]);
  const [loadingClassmatesView, setLoadingClassmatesView] = useState(false);
  const [classmatesError, setClassmatesError] = useState<string | null>(null);
  const [isClassmatesModalOpen, setIsClassmatesModalOpen] = useState(false);

  const [selectedClassroomForChat, setSelectedClassroomForChat] = useState<StudentClassroomEnrollmentInfo | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);


  useEffect(() => {
    if (!authLoading && user && clientAuth.currentUser) {
      const fetchClassrooms = async () => {
        setLoadingClassroomsState(true);
        try {
          const idToken = await clientAuth.currentUser.getIdToken();
          const fetchedClassrooms = await getStudentClassroomsWithBatchInfo(idToken);
          setEnrolledClassrooms(fetchedClassrooms);
        } catch (err) {
          console.error("Failed to fetch student classroom data:", err);
          toast({
            title: "Loading Error",
            description: "Could not load your classroom information. Please try refreshing.",
            variant: "destructive",
          });
        } finally {
          setLoadingClassroomsState(false);
        }
      };
      fetchClassrooms();
    } else if (!authLoading && !user) {
      setLoadingClassroomsState(false);
    }
  }, [user, authLoading, toast]);

  const handleViewClassmates = async (classroom: StudentClassroomEnrollmentInfo) => {
    if (!clientAuth.currentUser) {
      toast({ title: "Authentication Error", description: "Please sign in again.", variant: "destructive" });
      return;
    }
    setSelectedClassroomForClassmates(classroom);
    setIsClassmatesModalOpen(true);
    setLoadingClassmatesView(true);
    setClassmatesError(null);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const fetchedClassmates = await getClassmatesInfo(idToken, classroom.classroomId);
      setClassmates(fetchedClassmates);
    } catch (err) {
      console.error("Error fetching classmates:", err);
      setClassmatesError((err as Error).message || "Could not load classmates for this classroom.");
      toast({ title: "Error", description: (err as Error).message || "Failed to fetch classmates.", variant: "destructive" });
    } finally {
      setLoadingClassmatesView(false);
    }
  };

  const openChatModal = (classroom: StudentClassroomEnrollmentInfo) => {
    setSelectedClassroomForChat(classroom);
    setIsChatModalOpen(true);
  };


  if (loadingClassrooms || authLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Network className="mr-3 h-6 w-6 text-primary" />
            My Enrolled Classrooms
          </CardTitle>
          <CardDescription>Loading your classroom and batch details...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <Network className="mr-3 h-6 w-6 text-primary" />
                My Enrolled Classrooms
            </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center">Please sign in to view your classrooms.</p>
            </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Network className="mr-3 h-6 w-6 text-primary" />
            My Enrolled Classrooms
          </CardTitle>
          <CardDescription>View your classroom enrollments, assigned batches, classmates, and join chats.</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledClassrooms.length > 0 ? (
            <ul className="space-y-4">
              {enrolledClassrooms.map((enrollment) => (
                <li key={enrollment.classroomId} className="rounded-md border p-4 shadow-sm">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">{enrollment.classroomName}</h4>
                      <p className="text-sm text-muted-foreground">Subject: {enrollment.classroomSubject}</p>
                      <p className="text-sm text-muted-foreground">
                        Your Batch: <span className="font-medium text-primary">{enrollment.studentBatchInClassroom || 'N/A (Whole Class)'}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewClassmates(enrollment)}>
                          <Users className="mr-2 h-4 w-4" /> View Classmates
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openChatModal(enrollment)}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Chat
                        </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">You are not currently enrolled in any classrooms.</p>
          )}
        </CardContent>
      </Card>

      {selectedClassroomForClassmates && (
        <Dialog open={isClassmatesModalOpen} onOpenChange={(isOpen) => {
          setIsClassmatesModalOpen(isOpen);
          if (!isOpen) {
            setSelectedClassroomForClassmates(null);
            setClassmates([]);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Classmates in {selectedClassroomForClassmates.classroomName}</DialogTitle>
              <DialogDescription>
                Subject: {selectedClassroomForClassmates.classroomSubject}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {loadingClassmatesView && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading classmates...</span>
                </div>
              )}
              {classmatesError && <p className="text-destructive text-center">{classmatesError}</p>}
              {!loadingClassmatesView && !classmatesError && classmates.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Batch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classmates.map((classmate) => (
                      <TableRow key={classmate.userId}>
                        <TableCell>{classmate.name}</TableCell>
                        <TableCell>{classmate.studentIdNumber}</TableCell>
                        <TableCell>{classmate.batch || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loadingClassmatesView && !classmatesError && classmates.length === 0 && (
                <p className="text-muted-foreground text-center">No other classmates found in this classroom.</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedClassroomForChat && user && (
         <Dialog open={isChatModalOpen} onOpenChange={(isOpen) => {
            setIsChatModalOpen(isOpen);
            if(!isOpen) setSelectedClassroomForChat(null);
         }}>
            <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
                {/* DialogHeader can be integrated into ChatRoom or kept minimal here */}
                <div className="p-4 border-b">
                     <DialogTitle>Chat: {selectedClassroomForChat.classroomName}</DialogTitle>
                     <DialogDescription>Subject: {selectedClassroomForChat.classroomSubject}</DialogDescription>
                </div>
                <div className="flex-grow overflow-hidden">
                    <ChatRoom
                        classroomId={selectedClassroomForChat.classroomId}
                        currentUserId={user.uid}
                        currentUserName={user.displayName || user.email || 'You'}
                    />
                </div>
                <DialogFooter className="p-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Close Chat</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      )}
    </>
  );
}

export default function StudentClassroomsPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          My Classrooms
        </h2>
        <Suspense fallback={
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Network className="mr-3 h-6 w-6 text-primary" />
                My Enrolled Classrooms
              </CardTitle>
              <CardDescription>Loading your classroom and batch details...</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full rounded-lg" />
            </CardContent>
          </Card>
        }>
          <StudentClassroomsLoader />
        </Suspense>
      </div>
    </>
  );
}
