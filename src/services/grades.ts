
'use server';

import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server';
import type { Grade } from '@/types/grades';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';

/**
 * Retrieves the grades for a given student.
 * This is a Server Action intended to be called from the student's grade viewing page
 * and the faculty's grade management page for a specific student.
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
 * Retrieves the grades for a specific student, intended for use by an authenticated faculty member.
 * This is a Server Action for the faculty student detail page.
 * @param facultyIdToken - The Firebase ID token of the authenticated faculty member.
 * @param studentId - The UID of the student whose grades are to be fetched.
 * @returns A promise that resolves to an array of Grade objects for the specified student.
 */
export async function getGradesForStudent(facultyIdToken: string, studentId: string): Promise<Grade[]> {
  if (adminInitializationError) {
    console.error("getGradesForStudent SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    throw new Error("Server error: Admin services not initialized.");
  }

  // Verify the faculty's token to ensure this action is authorized
  try {
    await adminAuth.verifyIdToken(facultyIdToken);
    // In a more complex scenario, you might add a check here to ensure
    // the faculty member is actually associated with the student (e.g., via a classroom).
  } catch (error) {
    console.error("getGradesForStudent SA Error: Invalid faculty ID token", error);
    throw new Error("Authentication failed for this action.");
  }

  // Reuse the existing getGrades logic now that permission is confirmed.
  return getGrades(studentId);
}


/**
 * Retrieves all grades for a list of student UIDs.
 * This is a Server Action for faculty to generate a classroom-wide grade report.
 * @param idToken - Faculty's Firebase ID token.
 * @param studentUids - An array of student UIDs.
 * @returns A promise that resolves to an array of Grade objects for all specified students.
 */
export async function getGradesForClassroom(idToken: string, studentUids: string[]): Promise<Grade[]> {
    if (adminInitializationError) {
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
    
    if (studentUids.length === 0) {
        return [];
    }

    try {
        const gradesCollectionRef = adminDb.collection('grades');
        // Firestore 'in' queries are limited to 30 elements per query.
        // We need to chunk the studentUids array if it's larger than that.
        const chunks: string[][] = [];
        for (let i = 0; i < studentUids.length; i += 30) {
            chunks.push(studentUids.slice(i, i + 30));
        }

        const allGrades: Grade[] = [];
        for (const chunk of chunks) {
            const q = gradesCollectionRef.where('studentId', 'in', chunk);
            const snapshot = await q.get();
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                allGrades.push({
                    id: docSnap.id,
                    ...data,
                    updatedAt: data.updatedAt.toDate(),
                } as Grade);
            });
        }
        
        return allGrades;

    } catch (error) {
        console.error("Error fetching grades for classroom:", error);
        throw new Error("Could not fetch classroom grades.");
    }
}


/**
 * Retrieves all unique course names from the grades collection.
 * This is a Server Action for faculty to populate selection dropdowns.
 * @param idToken - Faculty's Firebase ID token.
 * @returns A promise that resolves to an array of unique course name strings.
 */
export async function getUniqueCourseNames(idToken: string): Promise<string[]> {
    if (adminInitializationError) {
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
        const snapshot = await adminDb.collection('grades').select('courseName').get();
        const courseNames = new Set<string>();
        snapshot.forEach(doc => {
            courseNames.add(doc.data().courseName);
        });
        return Array.from(courseNames).sort();
    } catch (error) {
        console.error("Error fetching unique course names:", error);
        throw new Error("Could not fetch course names.");
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

    const { studentId, courseName, grade, maxMarks } = gradeInfo;

    // Use a composite ID for the grade document to ensure one grade per student per course
    const gradeDocId = `${studentId}_${courseName.trim().replace(/\s+/g, '-')}`;
    const gradeDocRef = adminDb.collection('grades').doc(gradeDocId);

    try {
        await gradeDocRef.set({
            studentId,
            courseName,
            grade,
            maxMarks: maxMarks ?? null, // Save maxMarks or null if undefined
            facultyId,
            updatedAt: AdminFieldValue.serverTimestamp(),
        }, { merge: true });

    } catch (error) {
        console.error(`Error updating grade for student ${studentId} in course ${courseName}:`, error);
        throw new Error("Failed to save the grade.");
    }
}

/**
 * Deletes a student's grade record from Firestore.
 * This is a Server Action for faculty.
 * @param idToken - Faculty's Firebase ID token.
 * @param gradeId - The ID of the grade document to delete.
 */
export async function deleteStudentGrade(idToken: string, gradeId: string): Promise<void> {
    if (adminInitializationError) {
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
        await adminDb.collection('grades').doc(gradeId).delete();
    } catch (error) {
        console.error(`Error deleting grade ${gradeId}:`, error);
        throw new Error("Failed to delete the grade.");
    }
}

// This function is no longer needed as grades are decoupled from classrooms
// export async function getGradesForClassroom(idToken: string, classroomId: string, courseName: string): Promise<Grade[]> { ... }
