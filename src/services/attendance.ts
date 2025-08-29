
'use server';
import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server'; 
import { FieldValue as AdminFieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { LectureAttendanceRecord } from '@/types/lectureAttendance';

/**
 * Represents a student's attendance record for a specific date (structure for student view).
 */
export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  lectureName?: string;
  classroomName?: string;
  facultyName?: string;
}

/**
 * Asynchronously retrieves the attendance records for a given student from the 'lectureAttendance' collection.
 * This is a Server Action called from client-side (student attendance page and dashboard).
 *
 * @param idToken The Firebase ID token of the authenticated student.
 * @returns A promise that resolves to an array of AttendanceRecord objects.
 */
export async function getAttendanceRecords(idToken: string): Promise<AttendanceRecord[]> {
  if (adminInitializationError) {
    console.error("getAttendanceRecords SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("getAttendanceRecords SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  let studentId: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    studentId = decodedToken.uid;
  } catch (error) {
    console.error("getAttendanceRecords SA Error: Invalid ID token", error);
    throw new Error("Authentication failed.");
  }

  try {
    const lectureAttendanceCollectionRef = adminDb.collection('lectureAttendance');
    const q = lectureAttendanceCollectionRef
      .where('studentId', '==', studentId)
      .orderBy('date', 'desc')
      .orderBy('submittedAt', 'desc');

    const snapshot = await q.get();
    
    if (snapshot.empty) {
      return []; 
    }

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let dateStr = data.date; // Expects YYYY-MM-DD string

      // If date is an AdminTimestamp, format it (though it should be string from submission)
      if (data.date instanceof AdminTimestamp) { 
        dateStr = data.date.toDate().toISOString().split('T')[0];
      }
      
      return {
        date: dateStr,
        status: data.status as 'present' | 'absent',
        lectureName: data.lectureName,
        classroomName: data.classroomName,
        facultyName: data.facultyName,
      };
    });
  } catch (error) {
    console.error(`Error fetching attendance records for student ${studentId} (Admin SDK):`, error);
    throw error; 
  }
}

/**
 * Retrieves lecture attendance records for a specific classroom on a specific date.
 * This is a Server Action called by faculty to check for existing records before marking.
 * @param idToken - Faculty's Firebase ID token.
 * @param classroomId - The ID of the classroom.
 * @param date - The date in "yyyy-MM-dd" format.
 * @returns A promise that resolves to an array of LectureAttendanceRecord objects or an empty array if none found.
 */
export async function getLectureAttendanceForDate(idToken: string, classroomId: string, date: string): Promise<LectureAttendanceRecord[]> {
  if (adminInitializationError) {
    console.error("getLectureAttendanceForDate SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("getLectureAttendanceForDate SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("getLectureAttendanceForDate SA Error: Invalid ID token", error);
    throw new Error("Authentication failed.");
  }

  try {
    const lectureAttendanceCollectionRef = adminDb.collection('lectureAttendance');
    const q = lectureAttendanceCollectionRef
      .where('classroomId', '==', classroomId)
      .where('date', '==', date);

    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const submittedAt = data.submittedAt as AdminTimestamp | undefined;
      return {
        id: docSnap.id,
        classroomId: data.classroomId,
        classroomName: data.classroomName,
        facultyId: data.facultyId,
        facultyName: data.facultyName,
        date: data.date,
        lectureName: data.lectureName,
        studentId: data.studentId,
        studentName: data.studentName,
        studentIdNumber: data.studentIdNumber,
        status: data.status,
        batch: data.batch,
        submittedAt: submittedAt?.toDate(),
      } as LectureAttendanceRecord;
    });

  } catch (error) {
    console.error(`Error fetching lecture attendance for classroom ${classroomId} on ${date}:`, error);
    throw error;
  }
}

/**
 * Retrieves lecture attendance records for a specific classroom within a given date range.
 * This is a Server Action called by faculty to view historical attendance.
 * @param idToken - Faculty's Firebase ID token.
 * @param classroomId - The ID of the classroom.
 * @param startDate - The start date in "yyyy-MM-dd" format.
 * @param endDate - The end date in "yyyy-MM-dd" format.
 * @returns A promise that resolves to an array of LectureAttendanceRecord objects.
 */
export async function getLectureAttendanceForDateRange(
  idToken: string,
  classroomId: string,
  startDate: string,
  endDate: string
): Promise<LectureAttendanceRecord[]> {
  if (adminInitializationError) {
    console.error("getLectureAttendanceForDateRange SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("getLectureAttendanceForDateRange SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("getLectureAttendanceForDateRange SA Error: Invalid ID token", error);
    throw new Error("Authentication failed.");
  }

  try {
    const lectureAttendanceCollectionRef = adminDb.collection('lectureAttendance');
    const q = lectureAttendanceCollectionRef
      .where('classroomId', '==', classroomId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .orderBy('submittedAt', 'desc');

    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const submittedAt = data.submittedAt as AdminTimestamp | undefined;
      return {
        id: docSnap.id,
        classroomId: data.classroomId,
        classroomName: data.classroomName,
        facultyId: data.facultyId,
        facultyName: data.facultyName,
        date: data.date,
        lectureName: data.lectureName,
        studentId: data.studentId,
        studentName: data.studentName,
        studentIdNumber: data.studentIdNumber,
        status: data.status,
        batch: data.batch,
        submittedAt: submittedAt?.toDate(),
      } as LectureAttendanceRecord;
    });

  } catch (error) {
    console.error(`Error fetching lecture attendance for classroom ${classroomId} in range ${startDate} to ${endDate}:`, error);
    throw error;
  }
}


/**
 * Submits lecture attendance for multiple students. This handles both creating new records
 * and updating existing ones for a given day by deleting old records and creating new ones in a batch.
 * This is a Server Action called by faculty.
 * @param records - An array of LectureAttendanceRecord objects to be submitted.
 */
export async function submitLectureAttendance(records: Omit<LectureAttendanceRecord, 'id' | 'submittedAt'>[]): Promise<void> {
  if (adminInitializationError) {
    console.error("submitLectureAttendance SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb) {
    console.error("submitLectureAttendance SA Error: Admin DB not initialized.");
    throw new Error("Server error: Admin DB not initialized.");
  }

  if (records.length === 0) {
    console.warn("submitLectureAttendance SA: called with an empty records array. No action taken.");
    return; 
  }

  const { classroomId, date } = records[0];

  const batch = adminDb.batch();
  const lectureAttendanceCollectionRef = adminDb.collection('lectureAttendance');
  
  // 1. Find and delete all existing records for this classroom and date
  try {
    const existingRecordsQuery = lectureAttendanceCollectionRef
      .where('classroomId', '==', classroomId)
      .where('date', '==', date);
    
    const snapshot = await existingRecordsQuery.get();
    
    if (!snapshot.empty) {
      console.log(`submitLectureAttendance SA: Found ${snapshot.docs.length} existing records for classroom ${classroomId} on ${date}. Deleting them.`);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

  } catch (error) {
    console.error(`submitLectureAttendance SA: Error querying for existing records to delete:`, error);
    throw error;
  }

  // 2. Add the new records
  const adminServerTimestamp = AdminFieldValue.serverTimestamp();
  records.forEach(record => {
    if (!record.facultyId || !record.classroomId || !record.studentId || !record.lectureName || !record.date) {
        console.error("submitLectureAttendance SA: Attempted to submit incomplete attendance record:", record);
        throw new Error("Faculty ID, Classroom ID, Student ID, Lecture Name, and Date are required for each attendance record.");
    }
    const newRecordRef = lectureAttendanceCollectionRef.doc(); 
    batch.set(newRecordRef, {
      ...record,
      submittedAt: adminServerTimestamp,
    });
  });

  try {
    await batch.commit();
    console.log(`submitLectureAttendance SA: Batch of ${records.length} new/updated attendance records committed successfully for classroom ${classroomId} on ${date}.`);
  } catch (error) {
    console.error("submitLectureAttendance SA: Error committing attendance batch (Admin SDK):", error);
    throw error;
  }
}
