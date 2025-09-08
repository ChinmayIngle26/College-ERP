
'use server';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server';

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
  parentEmail?: string;
}

/**
 * Asynchronously retrieves the profile information for a given student UID from Firestore.
 * This is now a SERVER ACTION using the Admin SDK.
 * @param idToken The Firebase ID token of the authenticated student.
 * @returns A promise that resolves to a StudentProfile object or null if not found/error.
 * @throws Throws an error if Firestore is not initialized or if there's a Firebase error.
 */
export async function getStudentProfile(idToken: string): Promise<StudentProfile | null> {
  if (adminInitializationError) {
    console.error("[ServerAction:getStudentProfile] Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("[ServerAction:getStudentProfile] Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("[ServerAction:getStudentProfile] Invalid ID token:", error);
    throw new Error("Authentication failed. Invalid or expired token.");
  }
  const uid = decodedToken.uid;

  try {
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()!; // Non-null assertion as we checked exists()
      // Construct and return the profile object
      return {
        studentId: userData.studentId || uid,
        name: userData.name || 'N/A',
        
        // Personal Information
        profilePhotoUrl: userData.profilePhotoUrl || 'https://placehold.co/150x150.png',
        dateOfBirth: userData.dateOfBirth || 'N/A',
        gender: userData.gender || 'N/A',
        contactNumber: userData.contactNumber || 'N/A',
        email: userData.email,
        permanentAddress: userData.permanentAddress || 'N/A',
        currentAddress: userData.currentAddress || 'N/A',
        bloodGroup: userData.bloodGroup || 'N/A',
        emergencyContactName: userData.emergencyContactName || 'N/A',
        emergencyContactNumber: userData.emergencyContactNumber || 'N/A',

        // Academic Details
        enrollmentNumber: userData.enrollmentNumber || userData.studentId || uid,
        courseProgram: userData.major || userData.courseProgram || 'N/A',
        department: userData.department || 'N/A',
        currentYear: userData.currentYear || 0,
        currentSemester: userData.currentSemester || 0,
        academicAdvisorName: userData.academicAdvisorName || 'N/A',
        sectionOrBatch: userData.sectionOrBatch || 'N/A',
        admissionDate: userData.admissionDate || 'N/A',
        modeOfAdmission: userData.modeOfAdmission || 'N/A',
        
        // Documents
        idCardUrl: userData.idCardUrl || '#view-id-card',
        admissionLetterUrl: userData.admissionLetterUrl || '#view-admission-letter',
        marksheet10thUrl: userData.marksheet10thUrl || '#view-marksheet-10th',
        marksheet12thUrl: userData.marksheet12thUrl || '#view-marksheet-12th',
        migrationCertificateUrl: userData.migrationCertificateUrl || '#view-migration-cert',
        bonafideCertificateUrl: userData.bonafideCertificateUrl || '#download-bonafide',
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
        parentEmail: userData.parentEmail || 'N/A',
      };
    } else {
      console.warn(`No profile document found for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching student profile from Firestore (Admin SDK):", error);
    throw error;
  }
}


/**
 * Updates a student's profile in Firestore.
 * This is a Server Action called from the client-side profile page.
 * @param idToken The Firebase ID token of the authenticated user.
 * @param profileData A partial object of the StudentProfile to update.
 */
export async function updateStudentProfile(
  idToken: string,
  profileData: Partial<StudentProfile>
): Promise<void> {
  if (adminInitializationError) {
    console.error("[ServerAction:updateStudentProfile] Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("[ServerAction:updateStudentProfile] Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("[ServerAction:updateStudentProfile] Invalid ID token:", error);
    throw new Error("Authentication failed. Invalid or expired token.");
  }

  const userId = decodedToken.uid;
  const userDocRef = adminDb.collection('users').doc(userId);

  // Sanitize data: remove fields that should not be directly updated by the user
  const sanitizedData = { ...profileData };
  delete sanitizedData.role;
  delete sanitizedData.email;
  delete sanitizedData.name;
  delete sanitizedData.studentId;
  // Add any other fields that should be protected and only changed via admin request

  try {
    await userDocRef.update(sanitizedData);
    console.log(`[ServerAction:updateStudentProfile] Profile updated successfully for UID: ${userId}`);
  } catch (error) {
    console.error(`[ServerAction:updateStudentProfile] Error updating profile for UID ${userId}:`, error);
    throw new Error("Could not update your profile. Please try again.");
  }
}
