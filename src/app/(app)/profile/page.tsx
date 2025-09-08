
'use client'; 

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, Suspense, useRef } from 'react'; 
import { useAuth } from '@/context/auth-context'; 
import { db, auth as clientAuth } from '@/lib/firebase/client'; 
import type { StudentProfile } from '@/services/profile'; 
import { getStudentProfile } from '@/services/profile';
import { createProfileChangeRequest } from '@/services/profile-change-requests';
import { getStudentClassroomsWithBatchInfo, getClassmatesInfo } from '@/services/classroomService'; // Import new service
import type { StudentClassroomEnrollmentInfo, ClassmateInfo } from '@/types/classroom'; // Import new type
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, UserSquare, BookOpen, FileText, FileImage, ClipboardList, Edit3, UploadCloud, Send, Edit2, Save, Users, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Helper component moved outside ProfileDetailsLoader to prevent re-creation on render
const InfoItem = ({
  label,
  value,
  fieldName,
  isEditable,
  isEditMode,
  onEditRequest,
  editModeRender,
  handleInputChange,
  editableProfileValue,
  profileValue
}: {
  label: string;
  value?: string | number | null;
  fieldName: keyof StudentProfile;
  isEditable?: boolean;
  isEditMode: boolean;
  onEditRequest?: (fieldName: keyof StudentProfile, label: string) => void;
  editModeRender?: (
    currentValue: any,
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void,
    fieldName: keyof StudentProfile
  ) => JSX.Element;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  editableProfileValue: any;
  profileValue: any;
}) => (
  <div className="mb-2">
    <Label htmlFor={fieldName} className="font-semibold text-muted-foreground">{label}:</Label>
    {isEditMode && isEditable ? (
      editModeRender ? (
        editModeRender(editableProfileValue, handleInputChange, fieldName)
      ) : (
        <Input
          id={fieldName}
          name={fieldName}
          className="mt-1"
          value={String(editableProfileValue ?? '')}
          onChange={handleInputChange}
          type={typeof profileValue === 'number' ? 'number' : 'text'}
        />
      )
    ) : isEditMode && onEditRequest ? (
      <div className="flex items-center gap-2 mt-1">
        <span className="text-foreground break-all">{value || 'N/A'}</span>
        <Button variant="outline" size="sm" onClick={() => onEditRequest(fieldName, label)} className="whitespace-nowrap">
          <Send className="mr-2 h-3 w-3" /> Request Change
        </Button>
      </div>
    ) : (
      <span className="ml-2 text-foreground break-all">{value || 'N/A'}</span>
    )}
  </div>
);
  
// Helper component moved outside ProfileDetailsLoader to prevent re-creation on render
const DocumentOrActionItem = ({ 
  label, 
  url, 
  fieldName, 
  actionLabel, 
  icon, 
  isDownloadable = false, 
  actionType = 'link', 
  uploadable = false,
  onFileSelected, 
  acceptFileType,
  isEditMode,
  itemFileInputRef
}: { 
  label: string; 
  url?: string; 
  fieldName: keyof StudentProfile; 
  actionLabel?: string; 
  icon?: React.ElementType;
  isDownloadable?: boolean;
  actionType?: 'link' | 'button';
  uploadable?: boolean;
  onFileSelected?: (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof StudentProfile, label: string) => void;
  acceptFileType?: string;
  isEditMode: boolean;
  itemFileInputRef: React.RefObject<HTMLInputElement>;
}) => {
  const IconComponent = icon;

  return (
      <div className="mb-3 flex flex-col items-start gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {isEditMode && uploadable && onFileSelected && (
              <>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => itemFileInputRef.current?.click()}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload New
                  </Button>
                  <Input
                      type="file"
                      ref={itemFileInputRef}
                      className="hidden"
                      accept={acceptFileType || "image/*,application/pdf"}
                      onChange={(e) => onFileSelected(e, fieldName, label)}
                  />
              </>
          )}
          {url && url !== '#' ? (
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <a href={url} download={isDownloadable} target="_blank" rel="noopener noreferrer">
                  {isDownloadable ? <Download className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} {actionLabel || (isDownloadable ? 'Download' : 'View')}
              </a>
              </Button>
          ) : actionType === 'button' && actionLabel ? (
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {IconComponent && <IconComponent className="mr-2 h-4 w-4" />} {actionLabel}
              </Button>
          ): (
              !isEditMode && !uploadable && <span className="text-sm text-muted-foreground">{actionLabel || 'Not Available'}</span>
          )}
        </div>
      </div>
  );
};


function ProfileDetailsLoader() {
  const { user, loading: authLoading } = useAuth(); 
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<Partial<StudentProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFieldInfo, setRequestFieldInfo] = useState<{ key: keyof StudentProfile; label: string } | null>(null);
  const [requestOldValue, setRequestOldValue] = useState('');
  const [requestNewValue, setRequestNewValue] = useState('');

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadedPhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadedSignatureInputRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLInputElement>(null);
  const admissionLetterRef = useRef<HTMLInputElement>(null);
  const marksheet10thRef = useRef<HTMLInputElement>(null);
  const marksheet12thRef = useRef<HTMLInputElement>(null);
  const migrationCertRef = useRef<HTMLInputElement>(null);
  const bonafideCertRef = useRef<HTMLInputElement>(null);
  const admitCardRef = useRef<HTMLInputElement>(null);
  const internalTimetableRef = useRef<HTMLInputElement>(null);
  const externalTimetableRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLInputElement>(null);
  const revalRef = useRef<HTMLInputElement>(null); // Fixed: declared hook at top level

  const fileInputRefs = {
    idCardUrl: idCardRef,
    admissionLetterUrl: admissionLetterRef,
    marksheet10thUrl: marksheet10thRef,
    marksheet12thUrl: marksheet12thRef,
    migrationCertificateUrl: migrationCertRef,
    bonafideCertificateUrl: bonafideCertRef,
    admitCardUrl: admitCardRef,
    internalExamTimetableUrl: internalTimetableRef,
    externalExamTimetableUrl: externalTimetableRef,
    resultsAndGradeCardsUrl: resultsRef,
  };

  const [enrolledClassrooms, setEnrolledClassrooms] = useState<StudentClassroomEnrollmentInfo[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [classroomsError, setClassroomsError] = useState<string | null>(null);


  // State for View Classmates Modal
  const [selectedClassroomForClassmates, setSelectedClassroomForClassmates] = useState<StudentClassroomEnrollmentInfo | null>(null);
  const [classmates, setClassmates] = useState<ClassmateInfo[]>([]);
  const [loadingClassmates, setLoadingClassmatesView] = useState(false); // Renamed to avoid conflict
  const [fetchClassmatesError, setFetchClassmatesError] = useState<string | null>(null);
  const [isClassmatesModalOpen, setIsClassmatesModalOpen] = useState(false);
  

  useEffect(() => {
    if (!authLoading && user && clientAuth.currentUser) { // Added clientAuth.currentUser check
      const fetchProfileAndClassrooms = async () => {
        setLoading(true);
        setLoadingClassrooms(true);
        setError(null);
        setClassroomsError(null);
        if (!db) {
          setError("Database connection is not available.");
          setLoading(false);
          setLoadingClassrooms(false);
          return;
        }
        try {
          const idToken = await clientAuth.currentUser.getIdToken();
          const fetchedProfile = await getStudentProfile(user.uid);
          setProfile(fetchedProfile);
           if (fetchedProfile) {
            setEditableProfile(fetchedProfile);
          }

          // Fetch classrooms separately and handle its error state independently
          try {
            const fetchedClassrooms = await getStudentClassroomsWithBatchInfo(idToken);
            setEnrolledClassrooms(fetchedClassrooms);
          } catch(classroomErr) {
             const errorMessage = (classroomErr as Error).message || "An unknown error occurred fetching classrooms.";
             if (errorMessage.includes("Admin SDK initialization failed")) {
                setClassroomsError("Could not load classroom data because the server is not configured correctly. Please contact an administrator.");
             } else {
                setClassroomsError("Could not load your classroom information.");
             }
          }

        } catch (err) {
          console.error("Failed to fetch profile or classroom data:", err);
          setError("Could not load your main profile data.");
           toast({
             title: "Loading Error",
             description: "Could not load all your information. Please try refreshing.",
             variant: "destructive",
           });
        } finally {
          setLoading(false);
          setLoadingClassrooms(false);
        }
      };
      fetchProfileAndClassrooms();
    } else if (!authLoading && !user) {
       setLoading(false);
       setLoadingClassrooms(false);
       setError("Please sign in to view your profile.");
    }
  }, [user, authLoading, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['currentYear', 'currentSemester'];
    setEditableProfile(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? undefined : Number(value)) : value
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;
    toast({ title: "Saving Profile (Placeholder)", description: "Profile save functionality for non-critical fields will be implemented later." });
    setProfile(prev => prev ? { ...prev, ...editableProfile } : null);
    setIsEditMode(false);
  };
  
  const openRequestModal = (fieldName: keyof StudentProfile, label: string) => {
    if (!profile || !user) return;
    setRequestFieldInfo({ key: fieldName, label });
    setRequestOldValue(String(profile[fieldName] ?? 'N/A'));
    setRequestNewValue(String(profile[fieldName] ?? '')); 
    setIsRequestModalOpen(true);
  };

  const handleSubmitChangeRequest = async () => {
    if (!user || !profile || !requestFieldInfo || !clientAuth.currentUser) {
        toast({ title: "Error", description: "User not authenticated or profile data missing for request.", variant: "destructive" });
        return;
    }

    toast({ title: "Submitting Request...", description: `Requesting to change ${requestFieldInfo.label}.`});
    try {
        const idToken = await clientAuth.currentUser.getIdToken(true); // Force refresh token
        await createProfileChangeRequest(
            idToken,
            requestFieldInfo.key, 
            requestOldValue, 
            requestNewValue
        );
        toast({ title: "Request Submitted", description: `Your request to change ${requestFieldInfo.label} has been submitted for admin approval.` });
    } catch (error) {
        console.error("Error submitting change request (via Server Action):", error)
        toast({ title: "Submission Failed", description: (error as Error).message || "Could not submit your change request. Please try again.", variant: "destructive" });
    }
    setIsRequestModalOpen(false);
    setRequestNewValue(''); 
    setRequestFieldInfo(null);
  };

  const MAX_FILE_SIZE_KB = 500;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

  const handleFileSelect = (
      event: React.ChangeEvent<HTMLInputElement>,
      fieldName: keyof StudentProfile, 
      label: string
  ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({
              title: 'File Too Large',
              description: `${label}: '${file.name}' exceeds ${MAX_FILE_SIZE_KB}KB limit. Please select a smaller file.`,
              variant: 'destructive',
          });
          if (event.target) {
              event.target.value = ''; 
          }
          return;
      }

      toast({
          title: 'File Selected (Placeholder)',
          description: `${label}: '${file.name}' is ready for upload. Actual upload functionality will be implemented in a future step.`,
      });
      
      if (event.target) {
          event.target.value = '';
      }
  };

  const handleViewClassmates = async (classroom: StudentClassroomEnrollmentInfo) => {
    if (!clientAuth.currentUser) {
        toast({ title: "Authentication Error", description: "Please sign in again.", variant: "destructive"});
        return;
    }
    setSelectedClassroomForClassmates(classroom);
    setIsClassmatesModalOpen(true);
    setLoadingClassmatesView(true);
    setFetchClassmatesError(null);
    try {
        const idToken = await clientAuth.currentUser.getIdToken();
        const fetchedClassmates = await getClassmatesInfo(idToken, classroom.classroomId);
        setClassmates(fetchedClassmates);
    } catch (err) {
        console.error("Error fetching classmates:", err);
        setFetchClassmatesError((err as Error).message || "Could not load classmates for this classroom.");
        toast({ title: "Error", description: (err as Error).message || "Failed to fetch classmates.", variant: "destructive"});
    } finally {
        setLoadingClassmatesView(false);
    }
  };


  if (loading || authLoading) {
     return (
        <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" /> 
            <Skeleton className="h-48 w-full rounded-lg" /> {/* For classrooms card */}
        </div>
     );
  }

  if (error) {
     return <p className="text-center text-destructive">{error}</p>;
  }

   if (!profile) {
     return <p className="text-center text-muted-foreground">Profile not available.</p>;
   }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isEditMode ? (
            <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" /> Save Profile (Placeholder)
            </Button>
        ) : (
            <Button onClick={() => setIsEditMode(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <UserSquare className="mr-3 h-6 w-6 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1 flex flex-col items-center">
            {profile.profilePhotoUrl && (
              <Image
                src={isEditMode && typeof editableProfile.profilePhotoUrl === 'string' ? editableProfile.profilePhotoUrl : profile.profilePhotoUrl}
                alt="Profile Photo"
                width={150}
                height={150}
                className="rounded-full object-cover shadow-md mb-4"
                data-ai-hint="profile photo"
              />
            )}
            {isEditMode && (
              <>
                <Button variant="outline" size="sm" className="mb-2" onClick={() => profilePhotoInputRef.current?.click()}>
                    <UploadCloud className="mr-2 h-4 w-4"/> Change Photo
                </Button>
                <Input
                    type="file"
                    ref={profilePhotoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "profilePhotoUrl", "Profile Photo")}
                />
              </>
            )}
            <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
            <p className="text-sm text-muted-foreground break-all">{profile.email}</p>
          </div>
          <div className="md:col-span-2 space-y-1">
            <InfoItem label="Full Name" value={profile.name} fieldName="name" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.name} profileValue={profile.name}/>
            <InfoItem
                label="Date of Birth"
                value={profile.dateOfBirth}
                fieldName="dateOfBirth"
                isEditable={true}
                isEditMode={isEditMode}
                handleInputChange={handleInputChange}
                editableProfileValue={editableProfile.dateOfBirth}
                profileValue={profile.dateOfBirth}
                editModeRender={(currentValue, handleChange, name) => (
                    <Input
                    id={name as string}
                    name={name as string}
                    type="date"
                    className="mt-1"
                    value={currentValue || ''}
                    onChange={handleChange}
                    />
                )}
            />
            <InfoItem
                label="Gender"
                value={profile.gender}
                fieldName="gender"
                isEditable={true}
                isEditMode={isEditMode}
                handleInputChange={handleInputChange}
                editableProfileValue={editableProfile.gender}
                profileValue={profile.gender}
                editModeRender={(currentValue, handleChange, name) => (
                    <select
                    id={name as string}
                    name={name as string}
                    value={currentValue || ''}
                    onChange={handleChange}
                    className="input-class mt-1 block w-full rounded-md border-input bg-background p-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-10"
                    >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    </select>
                )}
            />
            <InfoItem label="Contact Number" value={profile.contactNumber} fieldName="contactNumber" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.contactNumber} profileValue={profile.contactNumber}
              editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} type="tel" className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="+1234567890"/>
              )}
            />
            <InfoItem label="Email Address" value={profile.email} fieldName="email" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.email} profileValue={profile.email}/>
            <InfoItem 
                label="Permanent Address" 
                value={profile.permanentAddress} 
                fieldName="permanentAddress" 
                isEditable={true} 
                isEditMode={isEditMode}
                handleInputChange={handleInputChange}
                editableProfileValue={editableProfile.permanentAddress}
                profileValue={profile.permanentAddress}
                editModeRender={(currentValue, handleChange, name) => (
                    <Textarea id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="123 Main St, City, Country"/>
                )}
            />
            <InfoItem 
                label="Current Address" 
                value={profile.currentAddress} 
                fieldName="currentAddress" 
                isEditable={true} 
                isEditMode={isEditMode}
                handleInputChange={handleInputChange}
                editableProfileValue={editableProfile.currentAddress}
                profileValue={profile.currentAddress}
                editModeRender={(currentValue, handleChange, name) => (
                    <Textarea id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="Apt 4B, Complex, City"/>
                )}
            />
            <InfoItem label="Blood Group" value={profile.bloodGroup} fieldName="bloodGroup" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.bloodGroup} profileValue={profile.bloodGroup}
              editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="O+"/>
              )}
            />
            <InfoItem label="Emergency Contact Name" value={profile.emergencyContactName} fieldName="emergencyContactName" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.emergencyContactName} profileValue={profile.emergencyContactName}
              editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="Jane Doe"/>
              )}
            />
            <InfoItem label="Emergency Contact Number" value={profile.emergencyContactNumber} fieldName="emergencyContactNumber" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.emergencyContactNumber} profileValue={profile.emergencyContactNumber}
              editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} type="tel" className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="+0987654321"/>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Users className="mr-3 h-6 w-6 text-primary" />
            My Classrooms & Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClassrooms ? (
            <Skeleton className="h-20 w-full" />
          ) : classroomsError ? (
            <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p>{classroomsError}</p>
            </div>
          ) : enrolledClassrooms.length > 0 ? (
            <ul className="space-y-3">
              {enrolledClassrooms.map((enrollment) => (
                <li key={enrollment.classroomId} className="rounded-md border p-3">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                        <h4 className="font-semibold">{enrollment.classroomName}</h4>
                        <p className="text-sm text-muted-foreground">Subject: {enrollment.classroomSubject}</p>
                        <p className="text-sm text-muted-foreground">
                            Your Batch: <span className="font-medium text-primary">{enrollment.studentBatchInClassroom || 'N/A (Whole Class)'}</span>
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewClassmates(enrollment)}>
                        <Users className="mr-2 h-4 w-4" /> View Classmates
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">You are not currently enrolled in any classrooms.</p>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <BookOpen className="mr-3 h-6 w-6 text-primary" />
            Academic Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          <InfoItem label="Enrollment Number / Roll Number" value={profile.enrollmentNumber} fieldName="enrollmentNumber" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.enrollmentNumber} profileValue={profile.enrollmentNumber}/>
          <InfoItem label="Course / Program" value={profile.courseProgram} fieldName="courseProgram" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.courseProgram} profileValue={profile.courseProgram}/>
          <InfoItem label="Department" value={profile.department} fieldName="department" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.department} profileValue={profile.department}/>
          <InfoItem label="Current Year" value={profile.currentYear ? `Year ${profile.currentYear}` : 'N/A'} fieldName="currentYear" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.currentYear} profileValue={profile.currentYear}/>
          <InfoItem label="Current Semester" value={profile.currentSemester ? `Semester ${profile.currentSemester}` : 'N/A'} fieldName="currentSemester" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.currentSemester} profileValue={profile.currentSemester}/>
          <InfoItem label="Academic Advisor" value={profile.academicAdvisorName} fieldName="academicAdvisorName" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.academicAdvisorName} profileValue={profile.academicAdvisorName}
            editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="Dr. Smith"/>
            )}
          />
          <InfoItem label="Section / Batch (Overall)" value={profile.sectionOrBatch} fieldName="sectionOrBatch" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.sectionOrBatch} profileValue={profile.sectionOrBatch}
             editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="A1"/>
            )}
          />
          <InfoItem label="Admission Date" value={profile.admissionDate} fieldName="admissionDate" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.admissionDate} profileValue={profile.admissionDate}/>
          <InfoItem label="Mode of Admission" value={profile.modeOfAdmission} fieldName="modeOfAdmission" isEditable={true} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.modeOfAdmission} profileValue={profile.modeOfAdmission}
             editModeRender={(currentValue, handleChange, name) => (
                <Input id={name as string} name={name as string} className="mt-1" value={currentValue || ''} onChange={handleChange} placeholder="CET"/>
            )}
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileText className="mr-3 h-6 w-6 text-primary" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={idCardRef} label="ID Card" url={profile.idCardUrl} fieldName="idCardUrl" actionLabel="View ID Card" uploadable={true} onFileSelected={handleFileSelect} acceptFileType="image/*,application/pdf" />
                <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={admissionLetterRef} label="Admission Letter" url={profile.admissionLetterUrl} fieldName="admissionLetterUrl" actionLabel="View Admission Letter" uploadable={true} onFileSelected={handleFileSelect} acceptFileType="image/*,application/pdf"/>
                <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={marksheet10thRef} label="10th Mark Sheet" url={profile.marksheet10thUrl} fieldName="marksheet10thUrl" actionLabel="View 10th Mark Sheet" uploadable={true} onFileSelected={handleFileSelect} acceptFileType="image/*,application/pdf"/>
                <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={marksheet12thRef} label="12th Mark Sheet" url={profile.marksheet12thUrl} fieldName="marksheet12thUrl" actionLabel="View 12th Mark Sheet" uploadable={true} onFileSelected={handleFileSelect} acceptFileType="image/*,application/pdf"/>
                <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={migrationCertRef} label="Migration Certificate" url={profile.migrationCertificateUrl} fieldName="migrationCertificateUrl" actionLabel="View Migration Certificate" uploadable={true} onFileSelected={handleFileSelect} acceptFileType="image/*,application/pdf"/>
                <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={bonafideCertRef} label="Bonafide Certificate" url={profile.bonafideCertificateUrl} fieldName="bonafideCertificateUrl" actionLabel="Download Bonafide" isDownloadable={true} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <h4 className="mb-2 flex items-center text-md font-semibold text-foreground">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Uploaded Photo
                    </h4>
                    { (isEditMode && typeof editableProfile.uploadedPhotoUrl === 'string' ? editableProfile.uploadedPhotoUrl : profile.uploadedPhotoUrl) ? (
                    <Image
                        src={isEditMode && typeof editableProfile.uploadedPhotoUrl === 'string' ? editableProfile.uploadedPhotoUrl : profile.uploadedPhotoUrl!}
                        alt="Uploaded Photo"
                        width={100}
                        height={100}
                        className="rounded-md border object-cover shadow-sm"
                        data-ai-hint="passport photo"
                    />
                    ) : <p className="text-sm text-muted-foreground">N/A</p>}
                     {isEditMode && (
                        <>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => uploadedPhotoInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4"/> Upload New Photo
                            </Button>
                             <Input
                                type="file"
                                ref={uploadedPhotoInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, "uploadedPhotoUrl", "Uploaded Photo")}
                            />
                        </>
                    )}
                </div>
                <div>
                    <h4 className="mb-2 flex items-center text-md font-semibold text-foreground">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Uploaded Signature
                    </h4>
                    {(isEditMode && typeof editableProfile.uploadedSignatureUrl === 'string' ? editableProfile.uploadedSignatureUrl : profile.uploadedSignatureUrl) ? (
                    <Image
                        src={isEditMode && typeof editableProfile.uploadedSignatureUrl === 'string' ? editableProfile.uploadedSignatureUrl : profile.uploadedSignatureUrl!}
                        alt="Uploaded Signature"
                        width={200}
                        height={80}
                        className="rounded-md border bg-white object-contain p-1 shadow-sm" 
                        data-ai-hint="signature"
                    />
                    ) : <p className="text-sm text-muted-foreground">N/A</p>}
                    {isEditMode && (
                         <>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => uploadedSignatureInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4"/> Upload New Signature
                            </Button>
                            <Input
                                type="file"
                                ref={uploadedSignatureInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, "uploadedSignatureUrl", "Uploaded Signature")}
                            />
                        </>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <ClipboardList className="mr-3 h-6 w-6 text-primary" />
                Exam Details
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-1 gap-x-4 md:grid-cols-2">
            <InfoItem label="Exam Registration" value={profile.examRegistrationStatus} fieldName="examRegistrationStatus" onEditRequest={openRequestModal} isEditMode={isEditMode} handleInputChange={handleInputChange} editableProfileValue={editableProfile.examRegistrationStatus} profileValue={profile.examRegistrationStatus}/>
            <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={admitCardRef} label="Admit Card" url={profile.admitCardUrl} fieldName="admitCardUrl" actionLabel="Download Admit Card" isDownloadable={true} icon={Download} uploadable={true} onFileSelected={handleFileSelect} acceptFileType="application/pdf"/>
            <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={internalTimetableRef} label="Internal Exam Timetable" url={profile.internalExamTimetableUrl} fieldName="internalExamTimetableUrl" actionLabel="View Timetable" icon={Eye} uploadable={true} onFileSelected={handleFileSelect} acceptFileType="application/pdf"/>
            <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={externalTimetableRef} label="External Exam Timetable" url={profile.externalExamTimetableUrl} fieldName="externalExamTimetableUrl" actionLabel="View Timetable" icon={Eye} uploadable={true} onFileSelected={handleFileSelect} acceptFileType="application/pdf"/>
            <DocumentOrActionItem isEditMode={isEditMode} itemFileInputRef={resultsRef} label="Results and Grade Cards" url={profile.resultsAndGradeCardsUrl} fieldName="resultsAndGradeCardsUrl" actionLabel="View Results" icon={Eye} uploadable={true} onFileSelected={handleFileSelect} acceptFileType="application/pdf"/>
            <div className="md:col-span-1"> 
                <DocumentOrActionItem
                    isEditMode={isEditMode}
                    itemFileInputRef={revalRef}
                    label={`Revaluation (${profile.revaluationRequestStatus || 'N/A'})`}
                    url={profile.revaluationRequestStatus === 'None' && profile.revaluationRequestLink ? profile.revaluationRequestLink : undefined}
                    fieldName="revaluationRequestLink" 
                    actionLabel={profile.revaluationRequestStatus === 'None' ? 'Request Revaluation' : undefined}
                    icon={Edit3}
                    actionType={profile.revaluationRequestStatus === 'None' ? 'link' : 'button'}
                />
            </div>
        </CardContent>
      </Card>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Change for {requestFieldInfo?.label}</DialogTitle>
            <DialogDescription>
              Your request to change "{requestFieldInfo?.label}" will be sent to an administrator for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="currentValue" className="text-left sm:text-right col-span-1">
                Current Value
              </Label>
              <Input id="currentValue" value={requestOldValue} readOnly className="col-span-3 bg-muted" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="newValue" className="text-left sm:text-right col-span-1">
                New Value
              </Label>
              <Input
                id="newValue"
                value={requestNewValue}
                onChange={(e) => setRequestNewValue(e.target.value)}
                className="col-span-3"
                placeholder={`Enter new ${requestFieldInfo?.label.toLowerCase()}`}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => { setRequestFieldInfo(null); setRequestNewValue(''); }}>Cancel</Button></DialogClose>
            <Button onClick={handleSubmitChangeRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedClassroomForClassmates && (
        <Dialog open={isClassmatesModalOpen} onOpenChange={(isOpen) => {
            setIsClassmatesModalOpen(isOpen);
            if (!isOpen) {
                setSelectedClassroomForClassmates(null); // Clear selection when closing
                setClassmates([]); // Clear classmates list
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
                    {loadingClassmates && (
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading classmates...</span>
                        </div>
                    )}
                    {fetchClassmatesError && <p className="text-destructive text-center">{fetchClassmatesError}</p>}
                    {!loadingClassmates && !fetchClassmatesError && classmates.length > 0 && (
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
                    {!loadingClassmates && !fetchClassmatesError && classmates.length === 0 && (
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

    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            My Profile
          </h2>
        </div>
        <Suspense fallback={
            <div className="space-y-6">
                <Skeleton className="h-12 w-32 self-end" /> 
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-72 w-full rounded-lg" />
                <Skeleton className="h-80 w-full rounded-lg" />
                <Skeleton className="h-72 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        }>
          <ProfileDetailsLoader />
        </Suspense>
      </div>
    </>
  );
}
