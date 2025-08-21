
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose 
} from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Users, Edit, UserPlus, LinkIcon, Trash2, Loader2, MessageSquare } from 'lucide-react'; // Added MessageSquare
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClassroom, getClassroomsByFaculty, addInvitedFacultyToClassroom, getAllFacultyUsers, deleteClassroom } from '@/services/classroomService';
import type { Classroom, FacultyUser } from '@/types/classroom';
import { Skeleton } from '@/components/ui/skeleton';
import { auth as clientAuth } from '@/lib/firebase/client';
import Link from 'next/link';
import { ChatRoom } from '@/components/chat/ChatRoom'; // Import ChatRoom


export default function FacultyClassroomsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomSubject, setNewClassroomSubject] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [classroomToInviteTo, setClassroomToInviteTo] = useState<Classroom | null>(null);
  const [allFaculty, setAllFaculty] = useState<FacultyUser[]>([]);
  const [selectedFacultyToInvite, setSelectedFacultyToInvite] = useState<string | undefined>();
  const [loadingAllFaculty, setLoadingAllFaculty] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);

  const [selectedClassroomForChat, setSelectedClassroomForChat] = useState<Classroom | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);


  const fetchClassrooms = async () => {
    if (!user || !clientAuth.currentUser) {
      console.log("[FacultyClassroomsPage:fetchClassrooms] Attempted to fetch but no user or clientAuth.currentUser.");
      setLoadingClassrooms(false);
      return;
    }
    console.log(`[FacultyClassroomsPage:fetchClassrooms] Fetching classrooms for faculty UID: ${user.uid}`);
    setLoadingClassrooms(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      const fetchedClassrooms = await getClassroomsByFaculty(idToken);
      setClassrooms(fetchedClassrooms);
      console.log(`[FacultyClassroomsPage:fetchClassrooms] Fetched ${fetchedClassrooms.length} classrooms.`);
    } catch (error) {
      console.error("[FacultyClassroomsPage:fetchClassrooms] Error fetching classrooms:", error);
      toast({ title: "Error Loading Classrooms", description: (error as Error).message || "Could not load classrooms. Check console for details.", variant: "destructive" });
      setClassrooms([]);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      console.log("[FacultyClassroomsPage] User authenticated. UID:", user.uid, "Email:", user.email);
      fetchClassrooms();
    } else if (!authLoading && !user) {
      console.log("[FacultyClassroomsPage] No user authenticated, not fetching classrooms.");
      setLoadingClassrooms(false); 
      setClassrooms([]); 
    }
  }, [user, authLoading]);


  const handleCreateClassroom = async () => {
    if (!clientAuth.currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!newClassroomName.trim() || !newClassroomSubject.trim()) {
      toast({ title: "Validation Error", description: "Name and subject are required.", variant: "destructive" });
      return;
    }
    setIsSubmittingCreate(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await createClassroom(idToken, newClassroomName, newClassroomSubject);
      toast({ title: "Success", description: `Classroom "${newClassroomName}" created.` });
      setIsCreateModalOpen(false);
      setNewClassroomName('');
      setNewClassroomSubject('');
      fetchClassrooms(); 
    } catch (error) {
      console.error("Error creating classroom:", error);
      toast({ title: "Creation Failed", description: (error as Error).message || "Could not create classroom.", variant: "destructive" });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const openInviteModal = async (classroom: Classroom) => {
    if (!user || !clientAuth.currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to invite faculty.", variant: "destructive" });
        return;
    }
    setClassroomToInviteTo(classroom);
    setIsInviteModalOpen(true);
    setLoadingAllFaculty(true);
    
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        const facultyList = await getAllFacultyUsers(idToken);
        const ownerId = user?.uid; 
        const alreadyInvitedIds = classroom.invitedFacultyIds || [];
        const eligibleFaculty = facultyList.filter(f => f.uid !== ownerId && !alreadyInvitedIds.includes(f.uid));
        setAllFaculty(eligibleFaculty);
    } catch (error) {
        toast({ title: "Error", description: "Could not load faculty list for inviting.", variant: "destructive" });
        setAllFaculty([]);
    } finally {
        setLoadingAllFaculty(false);
    }
  };

  const handleInviteFaculty = async () => {
    if (!clientAuth.currentUser || !classroomToInviteTo || !selectedFacultyToInvite) {
        toast({ title: "Error", description: "Missing information for invite.", variant: "destructive" });
        return;
    }
    setIsSubmittingInvite(true);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        await addInvitedFacultyToClassroom(idToken, classroomToInviteTo.id, selectedFacultyToInvite);
        toast({ title: "Success", description: `Faculty invited to ${classroomToInviteTo.name}.` });
        setIsInviteModalOpen(false);
        setSelectedFacultyToInvite(undefined);
        fetchClassrooms(); 
    } catch (error) {
        toast({ title: "Invite Failed", description: (error as Error).message || "Could not invite faculty.", variant: "destructive" });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!clientAuth.currentUser || !classroomToDelete) {
      toast({ title: "Error", description: "No classroom selected for deletion or not authenticated.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      const idToken = await clientAuth.currentUser.getIdToken();
      await deleteClassroom(idToken, classroomToDelete.id);
      toast({ title: "Classroom Deleted", description: `Classroom "${classroomToDelete.name}" has been deleted.` });
      fetchClassrooms(); // Refresh the list
    } catch (error) {
      toast({ title: "Deletion Failed", description: (error as Error).message || "Could not delete classroom.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setClassroomToDelete(null); // Close dialog by resetting state
    }
  };

  const openChatModal = (classroom: Classroom) => {
    setSelectedClassroomForChat(classroom);
    setIsChatModalOpen(true);
  };


  if (authLoading || (loadingClassrooms && !user && classrooms.length === 0)) { 
    return (
        <>
            <MainHeader />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between"><Skeleton className="h-9 w-64" /><Skeleton className="h-10 w-48" /></div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="mt-2 h-4 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader><Skeleton className="h-5 w-1/2" /></CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="mt-1 h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
  }
  
  return (
    <>
      <MainHeader />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Manage Classrooms</h2>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Classroom</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Classroom</DialogTitle><DialogDescription>Enter details for your new classroom.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="classroomName" className="text-right">Name</Label><Input id="classroomName" value={newClassroomName} onChange={(e) => setNewClassroomName(e.target.value)} className="col-span-3" placeholder="e.g., CS101 - Section A" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="classroomSubject" className="text-right">Subject/Desc</Label><Input id="classroomSubject" value={newClassroomSubject} onChange={(e) => setNewClassroomSubject(e.target.value)} className="col-span-3" placeholder="e.g., Data Structures (Fall 2024)" /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSubmittingCreate}>Cancel</Button></DialogClose>
                <Button onClick={handleCreateClassroom} disabled={isSubmittingCreate}>
                  {isSubmittingCreate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Classroom
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Your Classrooms</CardTitle><CardDescription>View, manage, and invite faculty to your classrooms.</CardDescription></CardHeader>
          <CardContent>
            {loadingClassrooms && user ? <Skeleton className="h-40 w-full" /> : classrooms.length > 0 ? (
              <div className="space-y-4">
                {classrooms.map(classroom => (
                  <Card key={classroom.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <CardTitle className="text-base font-medium">{classroom.name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2"> {/* Use flex-wrap and items-center */}
                           {user && classroom.ownerFacultyId === user.uid && (
                             <>
                               <Button variant="outline" size="sm" onClick={() => openInviteModal(classroom)}>
                                 <LinkIcon className="mr-2 h-3 w-3" /> Invite Faculty
                               </Button>
                               <AlertDialog open={classroomToDelete?.id === classroom.id} onOpenChange={(isOpen) => { if (!isOpen) setClassroomToDelete(null); }}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" onClick={() => setClassroomToDelete(classroom)}>
                                      <Trash2 className="mr-2 h-3 w-3" /> Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  {classroomToDelete?.id === classroom.id && (
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the classroom "{classroomToDelete.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setClassroomToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteClassroom} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Delete Classroom
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                  )}
                                </AlertDialog>
                             </>
                           )}
                           <Button variant="outline" size="sm" asChild>
                             <Link href={`/faculty/classrooms/${classroom.id}/students`}>
                               <Users className="mr-2 h-3 w-3" /> Manage Students
                             </Link>
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => openChatModal(classroom)}>
                                <MessageSquare className="mr-2 h-3 w-3" /> Chat
                           </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Description: {classroom.subject}</p>
                      <p className="text-sm text-muted-foreground">Owner: {classroom.ownerFacultyId === user?.uid ? 'You' : classroom.ownerFacultyId}</p>
                      <p className="text-sm text-muted-foreground">Invited Faculty: {classroom.invitedFacultyIds?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Students: {classroom.students?.length || 0}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground mt-2 mb-2">
                  {user ? "You are not part of any classrooms yet, or no classrooms could be fetched." : "Please sign in to view classrooms."}
                </p>
                {user && 
                    <Button variant="default" onClick={() => setIsCreateModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Create Your First Classroom</Button>
                }
              </div>)}
          </CardContent>
        </Card>

        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Faculty to {classroomToInviteTo?.name}</DialogTitle>
                    <DialogDescription>Select a faculty member to invite to this classroom. They will be able to take attendance.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loadingAllFaculty ? <Skeleton className="h-10 w-full" /> : allFaculty.length > 0 ? (
                        <Select value={selectedFacultyToInvite} onValueChange={setSelectedFacultyToInvite}>
                            <SelectTrigger><SelectValue placeholder="Select faculty to invite" /></SelectTrigger>
                            <SelectContent>
                                {allFaculty.map(f => (
                                    <SelectItem key={f.uid} value={f.uid}>{f.name} ({f.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-muted-foreground">No other faculty available to invite or all eligible faculty already invited.</p>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" onClick={() => setSelectedFacultyToInvite(undefined)} disabled={isSubmittingInvite}>Cancel</Button></DialogClose>
                    <Button onClick={handleInviteFaculty} disabled={!selectedFacultyToInvite || loadingAllFaculty || isSubmittingInvite}>
                      {isSubmittingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Invite to Classroom
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {selectedClassroomForChat && user && (
         <Dialog open={isChatModalOpen} onOpenChange={(isOpen) => {
            setIsChatModalOpen(isOpen);
            if(!isOpen) setSelectedClassroomForChat(null);
         }}>
            <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
                <div className="p-4 border-b">
                     <DialogTitle>Chat: {selectedClassroomForChat.name}</DialogTitle>
                     <DialogDescription>Subject: {selectedClassroomForChat.subject}</DialogDescription>
                </div>
                <div className="flex-grow overflow-hidden"> {/* Ensure this div allows ChatRoom to take space */}
                    <ChatRoom
                        classroomId={selectedClassroomForChat.id}
                        currentUserId={user.uid}
                        currentUserName={user.displayName || user.email || 'Faculty'}
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

      </div>
    </>
  );
}


    