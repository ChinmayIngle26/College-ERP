
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Settings, ShieldAlert, Edit, Trash2, CheckCircle, Filter as FilterIcon, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StudentProfile } from '@/services/profile'; 

const ADMIN_EMAIL = "admin@gmail.com";
const ALL_ROLES_VALUE = "__ALL_ROLES__";
const ALL_COURSES_VALUE = "__ALL_COURSES__";

interface UserData extends StudentProfile {
  id: string; 
  createdAt?: any; 
}

const initialNewUserState: Omit<UserData, 'id' | 'createdAt'> = {
  name: '',
  studentId: '', 
  email: '',
  parentEmail: '',
  role: 'student', 
  profilePhotoUrl: '',
  dateOfBirth: '',
  gender: '',
  contactNumber: '',
  permanentAddress: '',
  currentAddress: '',
  bloodGroup: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  enrollmentNumber: '',
  courseProgram: '', 
  department: '',
  currentYear: 0,
  currentSemester: 0,
  academicAdvisorName: '',
  sectionOrBatch: '',
  admissionDate: '',
  modeOfAdmission: '',
  idCardUrl: '',
  admissionLetterUrl: '',
  marksheet10thUrl: '',
  marksheet12thUrl: '',
  migrationCertificateUrl: '',
  bonafideCertificateUrl: '',
  uploadedPhotoUrl: '',
  uploadedSignatureUrl: '',
  examRegistrationStatus: 'Not Registered',
  admitCardUrl: '',
  internalExamTimetableUrl: '',
  externalExamTimetableUrl: '',
  resultsAndGradeCardsUrl: '',
  revaluationRequestStatus: 'None',
  revaluationRequestLink: '',
};


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState<Omit<UserData, 'id' | 'createdAt'>>(initialNewUserState);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(''); // Empty string for 'All Roles'
  const [filterCourse, setFilterCourse] = useState(''); // Empty string for 'All Courses'
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);


  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/signin');
      setCheckingRole(false);
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;

      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else {
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userDataFromDb = userDocSnap.data();
              if (userDataFromDb.role === 'admin') {
                userIsCurrentlyAdmin = true;
              }
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
            toast({
              title: "Error",
              description: "Could not verify admin role. Please check Firestore permissions.",
              variant: "destructive",
            });
          }
        } else {
             toast({
                title: "Database Error",
                description: "Firestore is not available. Cannot verify admin role.",
                variant: "destructive",
            });
        }
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive",
        });
        router.push('/');
      }
      setCheckingRole(false);
    };

    checkAdminAccess();

  }, [user, authLoading, router, toast]);

  const fetchUsers = async () => {
    if (!db || !isAdmin) {
        if (!isAdmin && !checkingRole) {
             // console.log("User is not admin, skipping fetchUsers.");
        }
        if (!db) {
            console.error("Firestore DB instance is not available in fetchUsers.");
        }
        setLoadingUsers(false);
        return;
    }
    setLoadingUsers(true);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const courses = new Set<string>();
      const usersList = usersSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const courseProgramValue = data.courseProgram || data.major || '';
        if (courseProgramValue) {
            courses.add(courseProgramValue);
        }
        return { 
            id: docSnap.id, 
            ...data,
            courseProgram: courseProgramValue,
        } as UserData;
      });
      setUsersData(usersList);
      setUniqueCourses(Array.from(courses).sort());
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error Fetching Users",
        description: "Could not fetch users data. Ensure Firestore rules allow 'list' operation on 'users' collection for admins.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading && !checkingRole) {
      fetchUsers();
    }
  }, [isAdmin, authLoading, checkingRole]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const SPREADSHEET_FIELD_NAMES = ['currentYear', 'currentSemester']
    setNewUser(prev => ({ ...prev, [name]: SPREADSHEET_FIELD_NAMES.includes(name) ? parseInt(value) : value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingUser) return;
    const { name, value } = e.target;
    const SPREADSHEET_FIELD_NAMES = ['currentYear', 'currentSemester']
    setEditingUser(prev => prev ? ({ ...prev, [name]: SPREADSHEET_FIELD_NAMES.includes(name) ? parseInt(value) : value }) : null);
  };

  const validateUserProfile = (profile: Omit<UserData, 'id' | 'createdAt' > | UserData): boolean => {
    if (!profile.name || !profile.studentId || !profile.courseProgram || !profile.email || !profile.parentEmail || !profile.role) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Student ID, Course / Program, Email, Parent's Email, Role).",
          variant: "destructive",
        });
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(profile.email) || (profile.parentEmail && !/\S+@\S+\.\S+/.test(profile.parentEmail))) {
        toast({
          title: "Validation Error",
          description: "Please enter valid email addresses.",
          variant: "destructive",
        });
        return false;
      }
      return true;
  };

  const handleCreateUser = async () => {
    if (!db || !isAdmin) return;
    if (!validateUserProfile(newUser)) return;

    try {
      const usersCollection = collection(db, 'users');
      await addDoc(usersCollection, {
        ...newUser,
        currentYear: Number(newUser.currentYear) || 0,
        currentSemester: Number(newUser.currentSemester) || 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "User profile created successfully in Firestore.",
      });
      fetchUsers();
      setNewUser(initialNewUserState);
    } catch (error) {
      console.error("Error creating user profile:", error);
      toast({
        title: "Error Creating User",
        description: "Could not create user profile. Ensure Firestore rules allow 'create' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (userToEdit: UserData) => {
    setEditingUser({ ...userToEdit });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!db || !isAdmin || !editingUser || !editingUser.id) return;
    if (!validateUserProfile(editingUser)) return;

    try {
      const userDocRef = doc(db, 'users', editingUser.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...userDataToUpdate } = editingUser;
      
      await updateDoc(userDocRef, {
        ...userDataToUpdate,
        currentYear: Number(editingUser.currentYear) || 0,
        currentSemester: Number(editingUser.currentSemester) || 0,
      });

      toast({
        title: "Success",
        description: "User updated successfully.",
      });
      fetchUsers();
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error Updating User",
        description: "Could not update user. Ensure Firestore rules allow 'update' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAdmin) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);

      toast({
        title: "Success",
        description: "User profile deleted successfully from Firestore.",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user profile:", error);
      toast({
        title: "Error Deleting User",
        description: "Could not delete user profile. Ensure Firestore rules allow 'delete' on 'users' for admins.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return usersData.filter(u => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (u.name || '').toLowerCase().includes(searchLower) ||
        (u.studentId || '').toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower)
      );
      const matchesRole = filterRole ? u.role === filterRole : true;
      const matchesCourse = filterCourse ? u.courseProgram === filterCourse : true;
      return matchesSearch && matchesRole && matchesCourse;
    });
  }, [usersData, searchTerm, filterRole, filterCourse]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterCourse('');
  };


  if (authLoading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="p-6">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
              <CardTitle>Loading Admin Panel...</CardTitle>
              <CardDescription>Please wait while we verify your access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const renderProfileFormFields = (data: Omit<UserData, 'id' | 'createdAt'> | UserData, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void) => (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        {/* Personal Information */}
        <div className="md:col-span-2 font-semibold text-lg mb-2 border-b pb-1">Personal Information</div>
        <div><Label htmlFor="formName">Full Name*</Label><Input id="formName" name="name" value={data.name || ''} onChange={onChange} placeholder="John Doe" /></div>
        <div><Label htmlFor="formStudentId">Student ID*</Label><Input id="formStudentId" name="studentId" value={data.studentId || ''} onChange={onChange} placeholder="S12345" /></div>
        <div><Label htmlFor="formEmail">Email*</Label><Input id="formEmail" name="email" type="email" value={data.email || ''} onChange={onChange} placeholder="user@example.com" /></div>
        <div><Label htmlFor="formParentEmail">Parent's Email*</Label><Input id="formParentEmail" name="parentEmail" type="email" value={data.parentEmail || ''} onChange={onChange} placeholder="parent@example.com" /></div>
        <div><Label htmlFor="formProfilePhotoUrl">Profile Photo URL</Label><Input id="formProfilePhotoUrl" name="profilePhotoUrl" value={data.profilePhotoUrl || ''} onChange={onChange} placeholder="https://example.com/photo.jpg" /></div>
        <div><Label htmlFor="formDateOfBirth">Date of Birth</Label><Input id="formDateOfBirth" name="dateOfBirth" type="date" value={data.dateOfBirth || ''} onChange={onChange} /></div>
        <div>
            <Label htmlFor="formGender">Gender</Label>
            <select id="formGender" name="gender" value={data.gender || ''} onChange={onChange} className="input-class mt-1 block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
            </select>
        </div>
        <div><Label htmlFor="formContactNumber">Contact Number</Label><Input id="formContactNumber" name="contactNumber" value={data.contactNumber || ''} onChange={onChange} placeholder="+1234567890" /></div>
        <div className="md:col-span-2"><Label htmlFor="formPermanentAddress">Permanent Address</Label><Textarea id="formPermanentAddress" name="permanentAddress" value={data.permanentAddress || ''} onChange={onChange} placeholder="123 Main St, City, Country" /></div>
        <div className="md:col-span-2"><Label htmlFor="formCurrentAddress">Current Address</Label><Textarea id="formCurrentAddress" name="currentAddress" value={data.currentAddress || ''} onChange={onChange} placeholder="Apt 4B, Complex, City" /></div>
        <div><Label htmlFor="formBloodGroup">Blood Group</Label><Input id="formBloodGroup" name="bloodGroup" value={data.bloodGroup || ''} onChange={onChange} placeholder="O+" /></div>
        <div><Label htmlFor="formEmergencyContactName">Emergency Contact Name</Label><Input id="formEmergencyContactName" name="emergencyContactName" value={data.emergencyContactName || ''} onChange={onChange} placeholder="Jane Doe" /></div>
        <div><Label htmlFor="formEmergencyContactNumber">Emergency Contact Number</Label><Input id="formEmergencyContactNumber" name="emergencyContactNumber" value={data.emergencyContactNumber || ''} onChange={onChange} placeholder="+0987654321" /></div>

        {/* Academic Details */}
        <div className="md:col-span-2 font-semibold text-lg mt-4 mb-2 border-b pb-1">Academic Details</div>
        <div><Label htmlFor="formEnrollmentNumber">Enrollment Number</Label><Input id="formEnrollmentNumber" name="enrollmentNumber" value={data.enrollmentNumber || ''} onChange={onChange} placeholder="ENR123" /></div>
        <div><Label htmlFor="formCourseProgram">Course / Program*</Label><Input id="formCourseProgram" name="courseProgram" value={data.courseProgram || ''} onChange={onChange} placeholder="B.Tech in Computer Science" /></div>
        <div><Label htmlFor="formDepartment">Department</Label><Input id="formDepartment" name="department" value={data.department || ''} onChange={onChange} placeholder="Computer Engineering" /></div>
        <div><Label htmlFor="formCurrentYear">Current Year</Label><Input id="formCurrentYear" name="currentYear" type="number" value={data.currentYear || 0} onChange={onChange} /></div>
        <div><Label htmlFor="formCurrentSemester">Current Semester</Label><Input id="formCurrentSemester" name="currentSemester" type="number" value={data.currentSemester || 0} onChange={onChange} /></div>
        <div><Label htmlFor="formAcademicAdvisorName">Academic Advisor</Label><Input id="formAcademicAdvisorName" name="academicAdvisorName" value={data.academicAdvisorName || ''} onChange={onChange} placeholder="Dr. Smith" /></div>
        <div><Label htmlFor="formSectionOrBatch">Section / Batch</Label><Input id="formSectionOrBatch" name="sectionOrBatch" value={data.sectionOrBatch || ''} onChange={onChange} placeholder="A1" /></div>
        <div><Label htmlFor="formAdmissionDate">Admission Date</Label><Input id="formAdmissionDate" name="admissionDate" type="date" value={data.admissionDate || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formModeOfAdmission">Mode of Admission</Label><Input id="formModeOfAdmission" name="modeOfAdmission" value={data.modeOfAdmission || ''} onChange={onChange} placeholder="CET" /></div>

        {/* Documents */}
        <div className="md:col-span-2 font-semibold text-lg mt-4 mb-2 border-b pb-1">Documents (URLs)</div>
        <div><Label htmlFor="formIdCardUrl">ID Card URL</Label><Input id="formIdCardUrl" name="idCardUrl" value={data.idCardUrl || ''} onChange={onChange} placeholder="https://example.com/id.pdf" /></div>
        <div><Label htmlFor="formAdmissionLetterUrl">Admission Letter URL</Label><Input id="formAdmissionLetterUrl" name="admissionLetterUrl" value={data.admissionLetterUrl || ''} onChange={onChange} placeholder="https://example.com/admission.pdf" /></div>
        <div><Label htmlFor="formMarksheet10thUrl">10th Marksheet URL</Label><Input id="formMarksheet10thUrl" name="marksheet10thUrl" value={data.marksheet10thUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formMarksheet12thUrl">12th Marksheet URL</Label><Input id="formMarksheet12thUrl" name="marksheet12thUrl" value={data.marksheet12thUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formMigrationCertificateUrl">Migration Certificate URL</Label><Input id="formMigrationCertificateUrl" name="migrationCertificateUrl" value={data.migrationCertificateUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formBonafideCertificateUrl">Bonafide Certificate URL</Label><Input id="formBonafideCertificateUrl" name="bonafideCertificateUrl" value={data.bonafideCertificateUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formUploadedPhotoUrl">Uploaded Photo URL</Label><Input id="formUploadedPhotoUrl" name="uploadedPhotoUrl" value={data.uploadedPhotoUrl || ''} onChange={onChange} placeholder="https://example.com/uploaded-photo.jpg" /></div>
        <div><Label htmlFor="formUploadedSignatureUrl">Uploaded Signature URL</Label><Input id="formUploadedSignatureUrl" name="uploadedSignatureUrl" value={data.uploadedSignatureUrl || ''} onChange={onChange} placeholder="https://example.com/signature.png" /></div>
        
        {/* Exam Details */}
        <div className="md:col-span-2 font-semibold text-lg mt-4 mb-2 border-b pb-1">Exam Details</div>
        <div>
            <Label htmlFor="formExamRegistrationStatus">Exam Registration Status</Label>
            <select id="formExamRegistrationStatus" name="examRegistrationStatus" value={data.examRegistrationStatus || 'Not Registered'} onChange={onChange} className="input-class mt-1 block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                <option value="Not Registered">Not Registered</option><option value="Registered">Registered</option><option value="Pending">Pending</option>
            </select>
        </div>
        <div><Label htmlFor="formAdmitCardUrl">Admit Card URL</Label><Input id="formAdmitCardUrl" name="admitCardUrl" value={data.admitCardUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formInternalExamTimetableUrl">Internal Exam Timetable URL</Label><Input id="formInternalExamTimetableUrl" name="internalExamTimetableUrl" value={data.internalExamTimetableUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formExternalExamTimetableUrl">External Exam Timetable URL</Label><Input id="formExternalExamTimetableUrl" name="externalExamTimetableUrl" value={data.externalExamTimetableUrl || ''} onChange={onChange} /></div>
        <div><Label htmlFor="formResultsAndGradeCardsUrl">Results/Grade Cards URL</Label><Input id="formResultsAndGradeCardsUrl" name="resultsAndGradeCardsUrl" value={data.resultsAndGradeCardsUrl || ''} onChange={onChange} /></div>
        <div>
            <Label htmlFor="formRevaluationRequestStatus">Revaluation Request Status</Label>
            <select id="formRevaluationRequestStatus" name="revaluationRequestStatus" value={data.revaluationRequestStatus || 'None'} onChange={onChange} className="input-class mt-1 block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                <option value="None">None</option><option value="Requested">Requested</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
            </select>
        </div>
        <div><Label htmlFor="formRevaluationRequestLink">Revaluation Request Link</Label><Input id="formRevaluationRequestLink" name="revaluationRequestLink" value={data.revaluationRequestLink || ''} onChange={onChange} /></div>
        
        {/* Role Setting */}
        <div className="md:col-span-2 font-semibold text-lg mt-4 mb-2 border-b pb-1">System Role</div>
        <div>
            <Label htmlFor="formRole">Role*</Label>
            <select id="formRole" name="role" value={data.role || 'student'} onChange={onChange} className="input-class mt-1 block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
            </select>
        </div>
    </div>
  );


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>Manage users and system settings.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" /> User Management
          </CardTitle>
          <CardDescription>View, add, edit, or remove user profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Section */}
          <div className="mb-6 space-y-4 rounded-lg border p-4 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-medium">
              <FilterIcon className="h-5 w-5 text-primary" />
              Filters
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Search by Name, ID, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select 
                value={filterRole} 
                onValueChange={(value) => setFilterRole(value === ALL_ROLES_VALUE ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ROLES_VALUE}>All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filterCourse} 
                onValueChange={(value) => setFilterCourse(value === ALL_COURSES_VALUE ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Course/Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COURSES_VALUE}>All Courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Clear Filters
              </Button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto max-h-[60vh] relative">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Course/Program</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{u.name || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.studentId || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.email || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.courseProgram || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{u.role || 'N/A'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(u)} className="mr-2 text-primary hover:text-primary/80">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete the profile for {u.name || u.email}? This action cannot be undone.
                                    This only deletes the Firestore document, not the Firebase Auth user.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button variant="destructive" onClick={() => handleDeleteUser(u.id)}>
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : searchTerm || filterRole || filterCourse ? (
                 <p className="text-center text-muted-foreground">No users match the current filters.</p>
              ) : (
                <p className="text-center text-muted-foreground">No user profiles found. Ensure Firestore rules allow listing users for admins.</p>
              )}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="h-5 w-5" /> Add New User Profile
                  </CardTitle>
                  <CardDescription>Create a new user profile in Firestore. Note: This does not create a Firebase Auth user.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderProfileFormFields(newUser, handleInputChange)}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCreateUser} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Create User Profile
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl"> 
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
              <DialogDescription>Modify the details for this user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2"> 
                {renderProfileFormFields(editingUser, handleEditInputChange)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}>Cancel</Button>
              <Button onClick={handleUpdateUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" /> System Settings
          </CardTitle>
          <CardDescription>Configure application-wide settings and parameters.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">System settings configuration will be available here.</p>
          <Button onClick={() => router.push('/admin/settings')} className="mt-2">
            Configure Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Manage announcements, calendar events, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Content management tools will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}


    