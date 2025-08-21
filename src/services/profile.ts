
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

/**
 * Represents a student's profile information.
 */
export interface StudentProfile {
  // Existing
  studentId: string; // Can represent UID or a specific student ID field from Firestore
  name: string;      // Will be used as Full Name

  // 1. Personal Information
  profilePhotoUrl?: string;
  dateOfBirth?: string; // e.g., "YYYY-MM-DD"
  gender?: string;
  contactNumber?: string;
  email?: string; // Email address (already present, ensure it's used here)
  permanentAddress?: string;
  currentAddress?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;

  // 2. Academic Details
  enrollmentNumber?: string; // Could be same as studentId
  courseProgram?: string; // e.g., B.Tech in AIML (was 'major')
  department?: string;
  currentYear?: number;
  currentSemester?: number;
  academicAdvisorName?: string;
  sectionOrBatch?: string;
  admissionDate?: string; // e.g., "YYYY-MM-DD"
  modeOfAdmission?: string; // e.g., CET, Management

  // 3. Documents (URLs or identifiers for viewing/downloading)
  idCardUrl?: string;
  admissionLetterUrl?: string;
  marksheet10thUrl?: string;
  marksheet12thUrl?: string;
  migrationCertificateUrl?: string;
  bonafideCertificateUrl?: string; // For a downloadable button
  uploadedPhotoUrl?: string;
  uploadedSignatureUrl?: string;

  // 4. Exam Details
  examRegistrationStatus?: string; // e.g., "Registered", "Not Registered"
  admitCardUrl?: string;
  internalExamTimetableUrl?: string;
  externalExamTimetableUrl?: string;
  resultsAndGradeCardsUrl?: string; // Link to results page or a document
  revaluationRequestStatus?: string; // e.g., "None", "In Progress", "Completed"
  revaluationRequestLink?: string; // Link to initiate a revaluation request


  // Internal/System fields (already present)
  role?: string;
}

/**
 * Asynchronously retrieves the profile information for a given student UID from Firestore.
 *
 * @param uid The Firebase Authentication User ID (UID).
 * @returns A promise that resolves to a StudentProfile object or null if not found/error.
 * @throws Throws an error if Firestore is not initialized or if there's a Firebase error.
 */
export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {

  if (!db) {
    console.error("Firestore DB instance is not available.");
    throw new Error("Database connection error.");
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Construct and return the profile object
      // For new fields, provide default/mock values if not in Firestore yet
      return {
        studentId: userData.studentId || uid,
        name: userData.name || 'N/A',
        
        // Personal Information
        profilePhotoUrl: userData.profilePhotoUrl || 'https://placehold.co/150x150.png',
        dateOfBirth: userData.dateOfBirth || 'N/A',
        gender: userData.gender || 'N/A',
        contactNumber: userData.contactNumber || 'N/A',
        email: userData.email, // From existing userData or Firebase Auth user.email
        permanentAddress: userData.permanentAddress || 'N/A',
        currentAddress: userData.currentAddress || 'N/A',
        bloodGroup: userData.bloodGroup || 'N/A',
        emergencyContactName: userData.emergencyContactName || 'N/A',
        emergencyContactNumber: userData.emergencyContactNumber || 'N/A',

        // Academic Details
        enrollmentNumber: userData.enrollmentNumber || userData.studentId || uid,
        courseProgram: userData.major || userData.courseProgram || 'N/A', // Use existing 'major' as 'courseProgram'
        department: userData.department || 'N/A',
        currentYear: userData.currentYear || 0,
        currentSemester: userData.currentSemester || 0,
        academicAdvisorName: userData.academicAdvisorName || 'N/A',
        sectionOrBatch: userData.sectionOrBatch || 'N/A',
        admissionDate: userData.admissionDate || 'N/A',
        modeOfAdmission: userData.modeOfAdmission || 'N/A',
        
        // Documents
        idCardUrl: userData.idCardUrl || '#view-id-card', // Placeholder links
        admissionLetterUrl: userData.admissionLetterUrl || '#view-admission-letter',
        marksheet10thUrl: userData.marksheet10thUrl || '#view-marksheet-10th',
        marksheet12thUrl: userData.marksheet12thUrl || '#view-marksheet-12th',
        migrationCertificateUrl: userData.migrationCertificateUrl || '#view-migration-cert',
        bonafideCertificateUrl: userData.bonafideCertificateUrl || '#download-bonafide', // For download button
        uploadedPhotoUrl: userData.uploadedPhotoUrl || 'https://placehold.co/100x100.png',
        uploadedSignatureUrl: userData.uploadedSignatureUrl || 'https://placehold.co/200x80.png',

        // Exam Details
        examRegistrationStatus: userData.examRegistrationStatus || 'Registered',
        admitCardUrl: userData.admitCardUrl || '#download-admit-card',
        internalExamTimetableUrl: userData.internalExamTimetableUrl || '#view-internal-timetable',
        externalExamTimetableUrl: userData.externalExamTimetableUrl || '#view-external-timetable',
        resultsAndGradeCardsUrl: userData.resultsAndGradeCardsUrl || '#view-results',
        revaluationRequestStatus: userData.revaluationRequestStatus || 'None',
        revaluationRequestLink: userData.revaluationRequestLink || '#request-revaluation',

        role: userData.role,
      };
    } else {
      console.warn(`No profile document found for UID: ${uid}`);
      // Return a default structure if no document, so the page doesn't break
      return {
        studentId: uid,
        name: 'User Data Not Found',
        profilePhotoUrl: 'https://placehold.co/150x150.png',
        dateOfBirth: 'N/A',
        gender: 'N/A',
        contactNumber: 'N/A',
        email: 'N/A',
        permanentAddress: 'N/A',
        currentAddress: 'N/A',
        bloodGroup: 'N/A',
        emergencyContactName: 'N/A',
        emergencyContactNumber: 'N/A',
        enrollmentNumber: uid,
        courseProgram: 'N/A',
        department: 'N/A',
        currentYear: 0,
        currentSemester: 0,
        academicAdvisorName: 'N/A',
        sectionOrBatch: 'N/A',
        admissionDate: 'N/A',
        modeOfAdmission: 'N/A',
        idCardUrl: '#',
        admissionLetterUrl: '#',
        marksheet10thUrl: '#',
        marksheet12thUrl: '#',
        migrationCertificateUrl: '#',
        bonafideCertificateUrl: '#',
        uploadedPhotoUrl: 'https://placehold.co/100x100.png',
        uploadedSignatureUrl: 'https://placehold.co/200x80.png',
        examRegistrationStatus: 'Not Registered',
        admitCardUrl: '#',
        internalExamTimetableUrl: '#',
        externalExamTimetableUrl: '#',
        resultsAndGradeCardsUrl: '#',
        revaluationRequestStatus: 'N/A',
        revaluationRequestLink: '#',
        role: 'student',
      };
    }
  } catch (error) {
    console.error("Error fetching student profile from Firestore:", error);
    throw error;
  }
}
