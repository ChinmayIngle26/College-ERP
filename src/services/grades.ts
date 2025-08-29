
'use server';

import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server';
import type { Grade } from '@/types/grades';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';

/**
 * Retrieves the grades for a given student.
 * This is a Server Action intended to be called from the student's grade viewing page.
 * @param studentId The UID of the student whose grades are to be fetched.
 * @returns A promise that resolves to an array of Grade objects.
 */
export async function getGrades(studentId: string): Promise<Grade[]> {
  if (adminInitializationError) {
    console.error("getGrades SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb) {
    throw new Error("Server error: Admin DB not initialized.");
  }

  try {
    const gradesCollectionRef = adminDb.collection('grades');
    const q = gradesCollectionRef.where('studentId', '==', studentId).orderBy('updatedAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            updatedAt: data.updatedAt.toDate()
        } as Grade;
    });

  } catch (error) {
    console.error(`Error fetching grades for student ${studentId}:`, error);
    throw new Error("Could not fetch grades.");
  }
}

/**
 * Retrieves all grades for a specific course/exam within a classroom.
 * This is a Server Action for faculty to see current grades.
 * @param idToken - Faculty's Firebase ID token.
 * @param classroomId - The ID of the classroom.
 * @param courseName - The specific course or exam name.
 * @returns A promise that resolves to an array of Grade objects.
 */
export async function getGradesForClassroom(idToken: string, classroomId: string, courseName: string): Promise<Grade[]> {
    if (adminInitializationError) {
        console.error("getGradesForClassroom SA Error: Admin SDK init failed:", adminInitializationError.message);
        throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
        throw new Error("Server error: Admin services not initialized.");
    }

    try {
        await adminAuth.verifyIdToken(idToken);
    } catch (error) {
        throw new Error("Authentication failed.");
    }

    try {
        const gradesCollectionRef = adminDb.collection('grades');
        const q = gradesCollectionRef
            .where('classroomId', '==', classroomId)
            .where('courseName', '==', courseName);
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            updatedAt: docSnap.data().updatedAt.toDate(),
        } as Grade));

    } catch (error) {
        console.error(`Error fetching grades for classroom ${classroomId} and course ${courseName}:`, error);
        throw new Error("Could not fetch grades for the classroom.");
    }
}

/**
 * Updates or creates a grade for a student in a specific course.
 * This is a Server Action for faculty.
 * @param idToken - Faculty's Firebase ID token.
 * @param gradeInfo - The grade information to save.
 */
export async function updateStudentGrade(idToken: string, gradeInfo: Omit<Grade, 'id' | 'updatedAt' | 'facultyId'>): Promise<void> {
    if (adminInitializationError) {
        console.error("updateStudentGrade SA Error: Admin SDK init failed:", adminInitializationError.message);
        throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
        throw new Error("Server error: Admin services not initialized.");
    }

    let facultyId: string;
    try {
        facultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
        throw new Error("Authentication failed.");
    }

    const { classroomId, studentId, courseName, grade } = gradeInfo;

    // Use a composite ID for the grade document to ensure one grade per student per course
    const gradeDocId = `${classroomId}_${studentId}_${courseName.replace(/\s+/g, '-')}`;
    const gradeDocRef = adminDb.collection('grades').doc(gradeDocId);

    try {
        await gradeDocRef.set({
            ...gradeInfo,
            facultyId,
            updatedAt: AdminFieldValue.serverTimestamp(),
        }, { merge: true });

    } catch (error) {
        console.error(`Error updating grade for student ${studentId} in course ${courseName}:`, error);
        throw new Error("Failed to save the grade.");
    }
}
