
'use server';

import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server';
import { FieldValue as AdminFieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { Classroom, ClassroomStudentInfo, FacultyUser, StudentSearchResultItem, StudentClassroomEnrollmentInfo, ClassmateInfo } from '@/types/classroom';
import type { StudentProfile } from './profile';


async function checkFacultyPermissionForClassroom(
    classroomId: string, 
    facultyId: string
): Promise<{ permitted: boolean; classroomData?: Omit<Classroom, 'id'> }> {
    if (adminInitializationError) {
        console.error("[classroomService:checkFacultyPermissionForClassroom] Admin SDK init error:", adminInitializationError.message);
        throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb) {
        throw new Error("Admin DB not initialized in checkFacultyPermissionForClassroom.");
    }
    const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
    const classroomSnap = await classroomDocRef.get();

    if (!classroomSnap.exists) {
        throw new Error(`Classroom with ID ${classroomId} not found.`);
    }
    const classroomData = classroomSnap.data() as Omit<Classroom, 'id'>;
    const isOwner = classroomData.ownerFacultyId === facultyId;
    const isInvited = classroomData.invitedFacultyIds?.includes(facultyId);

    if (!isOwner && !isInvited) {
        return { permitted: false };
    }
    return { permitted: true, classroomData };
}

export async function createClassroom(idToken: string, name: string, subject: string): Promise<string> {
  if (adminInitializationError) {
    console.error("[classroomService:createClassroom SA] Firebase Admin SDK had a prior initialization error:", adminInitializationError.message);
    throw new Error(`Server error: Firebase Admin SDK failed to initialize: ${adminInitializationError.message}`);
  }
  if (!adminDb || !adminAuth) {
    console.error("[classroomService:createClassroom SA] CRITICAL: Admin DB or Admin Auth instance is NOT available.");
    throw new Error("Server error: Firebase Admin services are not configured or available.");
  }

  let ownerFacultyId: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    ownerFacultyId = decodedToken.uid;
  } catch (error) {
    console.error("[classroomService:createClassroom SA] Error verifying ID token:", error);
    throw new Error("Authentication failed. Invalid ID token.");
  }
  
  try {
    const classroomsCollectionRef = adminDb.collection('classrooms');
    const serverTimestampForCreate = AdminFieldValue.serverTimestamp();

    const docRef = await classroomsCollectionRef.add({
      name,
      subject,
      ownerFacultyId,
      invitedFacultyIds: [],
      students: [], // Initialize with an empty array of student objects
      createdAt: serverTimestampForCreate, 
    });
    console.log(`[classroomService:createClassroom SA] Classroom created successfully with ID: ${docRef.id} using Admin SDK.`);
    return docRef.id;
  } catch (error) {
    console.error("[classroomService:createClassroom SA] Error creating classroom (Admin SDK):", error);
    throw error; 
  }
}

export async function getClassroomsByFaculty(idToken: string): Promise<Classroom[]> {
  if (adminInitializationError) {
    console.error("[classroomService:getClassroomsByFaculty SA] Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("[classroomService:getClassroomsByFaculty SA] Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  let facultyId: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    facultyId = decodedToken.uid;
  } catch (error) {
    console.error("[classroomService:getClassroomsByFaculty] Error verifying ID token:", error);
    throw new Error("Authentication failed. Invalid ID token.");
  }

  try {
    const classroomsCollectionRef = adminDb.collection('classrooms');
    const ownedQuery = classroomsCollectionRef.where('ownerFacultyId', '==', facultyId);
    const invitedQuery = classroomsCollectionRef.where('invitedFacultyIds', 'array-contains', facultyId);

    const [ownedSnapshot, invitedSnapshot] = await Promise.all([ownedQuery.get(), invitedQuery.get()]);
    
    const classroomsMap = new Map<string, Classroom>();

    const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot) => {
        snapshot.docs.forEach(docSnap => {
            if (!classroomsMap.has(docSnap.id)) {
                const data = docSnap.data();
                const createdAtAdmin = data.createdAt as AdminTimestamp | undefined;
                classroomsMap.set(docSnap.id, {
                    id: docSnap.id,
                    name: data.name,
                    subject: data.subject,
                    ownerFacultyId: data.ownerFacultyId,
                    invitedFacultyIds: data.invitedFacultyIds || [],
                    students: (data.students || []).map((s: any) => ({ // Ensure students array is mapped correctly
                        userId: s.userId,
                        studentIdNumber: s.studentIdNumber,
                        name: s.name,
                        email: s.email,
                        batch: s.batch,
                    })),
                    createdAt: createdAtAdmin?.toDate() 
                } as Classroom);
            }
        });
    };

    processSnapshot(ownedSnapshot);
    processSnapshot(invitedSnapshot);

    const sortedClassrooms = Array.from(classroomsMap.values()).sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA; // Sort by creation date, newest first
    });
    return sortedClassrooms;

  } catch (error) {
    console.error(`[classroomService:getClassroomsByFaculty] Error during Firestore query for faculty ${facultyId} (Admin SDK):`, error);
    throw error;
  }
}

export async function getAllFacultyUsers(idToken: string): Promise<FacultyUser[]> {
    if (adminInitializationError) {
      console.error("[classroomService:getAllFacultyUsers SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:getAllFacultyUsers SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }

    try {
      await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("[classroomService:getAllFacultyUsers] Error verifying ID token:", error);
      throw new Error("Authentication failed.");
    }

    try {
        const usersCollectionRef = adminDb.collection('users');
        const q = usersCollectionRef.where('role', '==', 'faculty');
        const snapshot = await q.get();

        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                uid: docSnap.id,
                name: data.name || 'Unknown Faculty',
                email: data.email || 'No email'
            } as FacultyUser;
        });
    } catch (error) {
        console.error("[classroomService:getAllFacultyUsers] Error fetching all faculty users (Admin SDK):", error);
        throw error;
    }
}

// Updated to return ClassroomStudentInfo[] which includes batch
export async function getStudentsInClassroom(idToken: string, classroomId: string): Promise<ClassroomStudentInfo[]> {
  if (adminInitializationError) {
    console.error("[classroomService:getStudentsInClassroom SA] Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("[classroomService:getStudentsInClassroom SA] Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }
  
  let facultyId: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    facultyId = decodedToken.uid;
  } catch (error) {
    throw new Error("Authentication failed. Invalid ID token.");
  }

  try {
    const permCheck = await checkFacultyPermissionForClassroom(classroomId, facultyId);
    if (!permCheck.permitted || !permCheck.classroomData) {
        throw new Error("Permission denied or classroom data not found.");
    }
    // The students array in classroomData already contains all necessary info including batch.
    return permCheck.classroomData.students || [];
  } catch (error) {
    console.error(`Error fetching students for classroom ${classroomId} (Admin SDK):`, error);
    throw error;
  }
}

// Updated to accept student details and batch
export async function addStudentToClassroom(idToken: string, classroomId: string, studentUid: string): Promise<void> {
    if (adminInitializationError) {
      console.error("[classroomService:addStudentToClassroom SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:addStudentToClassroom SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }
    let facultyId: string;
    try {
        facultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
        throw new Error("Authentication failed. Invalid ID token.");
    }

    const permCheck = await checkFacultyPermissionForClassroom(classroomId, facultyId);
    if (!permCheck.permitted) {
        throw new Error("Permission denied to modify this classroom.");
    }
    
    const studentDocRef = adminDb.collection('users').doc(studentUid);
    const studentSnap = await studentDocRef.get();
    if (!studentSnap.exists || studentSnap.data()?.role !== 'student') { 
        throw new Error("Student not found or user is not a student role.");
    }
    const studentData = studentSnap.data() as StudentProfile;

    // Auto-assign batch based on studentId format (e.g., "ET-A-001")
    let assignedBatch: string | undefined = undefined;
    if (studentData.studentId) {
        const parts = studentData.studentId.split('-');
        if (parts.length === 3) {
            // Assuming format is BRANCH-BATCH-ROLLNO
            assignedBatch = parts[1].toUpperCase();
        }
    }

    const studentToAdd: ClassroomStudentInfo = {
        userId: studentUid,
        studentIdNumber: studentData.studentId || 'N/A', 
        name: studentData.name || 'N/A',
        email: studentData.email || 'N/A',
    };

    if (assignedBatch) {
        studentToAdd.batch = assignedBatch;
    }

    const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
    try {
        await classroomDocRef.update({
            students: AdminFieldValue.arrayUnion(studentToAdd)
        });
    } catch (error) {
        console.error("Error adding student to classroom:", error);
        throw error;
    }
}

// Updated to remove student object from array
export async function removeStudentFromClassroom(idToken: string, classroomId: string, studentUserId: string): Promise<void> {
    if (adminInitializationError) {
      console.error("[classroomService:removeStudentFromClassroom SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:removeStudentFromClassroom SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }
    let facultyId: string;
    try {
        facultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
        throw new Error("Authentication failed. Invalid ID token.");
    }

    const permCheck = await checkFacultyPermissionForClassroom(classroomId, facultyId);
    if (!permCheck.permitted || !permCheck.classroomData) {
        throw new Error("Permission denied or classroom data not found.");
    }

    const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
    try {
        const currentClassroomSnap = await classroomDocRef.get();
        if (!currentClassroomSnap.exists) throw new Error("Classroom disappeared.");
        
        const currentClassroomData = currentClassroomSnap.data() as Classroom;
        const updatedStudents = (currentClassroomData.students || []).filter(s => s.userId !== studentUserId);
        
        await classroomDocRef.update({ students: updatedStudents });
    } catch (error) {
        console.error("Error removing student from classroom:", error);
        throw error;
    }
}

export async function searchStudents(idToken: string, classroomId: string, searchTerm: string): Promise<StudentSearchResultItem[]> {
    if (adminInitializationError) {
      console.error("[classroomService:searchStudents SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:searchStudents SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }
    let facultyId: string;
    try {
        facultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
        throw new Error("Authentication failed. Invalid ID token.");
    }
    
    // Global search for grades page does not need classroom permission check
    let studentsCurrentlyInClassroom: string[] = [];
    if (classroomId !== '__GLOBAL_SEARCH__') {
        const permCheck = await checkFacultyPermissionForClassroom(classroomId, facultyId);
        if (!permCheck.permitted || !permCheck.classroomData) {
            throw new Error("Permission denied or classroom data not found.");
        }
        studentsCurrentlyInClassroom = (permCheck.classroomData.students || []).map(s => s.userId);
    }

    try {
        const usersCollectionRef = adminDb.collection('users');
        const q = usersCollectionRef.where('role', '==', 'student');
        const snapshot = await q.get();

        if (snapshot.empty) return [];
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        const results: StudentSearchResultItem[] = [];

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data() as StudentProfile; 
            const studentUid = docSnap.id;
            
            // For classroom-specific searches, filter out students already in the class
            if (classroomId !== '__GLOBAL_SEARCH__' && studentsCurrentlyInClassroom.includes(studentUid)) {
                return;
            }
            
            if (
                (data.name && data.name.toLowerCase().includes(lowerSearchTerm)) ||
                (data.email && data.email.toLowerCase().includes(lowerSearchTerm)) ||
                (data.studentId && data.studentId.toLowerCase().includes(lowerSearchTerm)) 
            ) {
                results.push({
                    uid: studentUid,
                    name: data.name || 'N/A',
                    studentId: data.studentId || 'N/A', 
                    email: data.email || 'N/A',
                });
            }
        });
        return results;
    } catch (error) {
        console.error("Error searching students:", error);
        throw error;
    }
}

export async function addInvitedFacultyToClassroom(idToken: string, classroomId: string, facultyToInviteId: string): Promise<void> {
    if (adminInitializationError) {
      console.error("[classroomService:addInvitedFacultyToClassroom SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:addInvitedFacultyToClassroom SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }

    let currentFacultyId: string;
    try {
        currentFacultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
        throw new Error("Authentication failed. Invalid ID token.");
    }

    const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
    const classroomSnap = await classroomDocRef.get();

    if (!classroomSnap.exists) throw new Error(`Classroom with ID ${classroomId} not found.`);
    const classroomData = classroomSnap.data() as Omit<Classroom, 'id'>;

    if (classroomData.ownerFacultyId !== currentFacultyId) {
        throw new Error("Only the classroom owner can invite other faculty.");
    }
    if (currentFacultyId === facultyToInviteId) {
        throw new Error("Owner cannot invite themselves.");
    }
    if (classroomData.invitedFacultyIds?.includes(facultyToInviteId)) {
        return; // Already invited
    }

    const facultyToInviteDocRef = adminDb.collection('users').doc(facultyToInviteId);
    const facultyToInviteSnap = await facultyToInviteDocRef.get();
    if (!facultyToInviteSnap.exists || facultyToInviteSnap.data()?.role !== 'faculty') { 
        throw new Error("Faculty member to invite not found or is not a faculty.");
    }

    try {
        await classroomDocRef.update({
            invitedFacultyIds: AdminFieldValue.arrayUnion(facultyToInviteId)
        });
    } catch (error) {
        console.error("Error inviting faculty:", error);
        throw error;
    }
}

export async function deleteClassroom(idToken: string, classroomId: string): Promise<void> {
    if (adminInitializationError) {
      console.error("[classroomService:deleteClassroom SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:deleteClassroom SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }
  
    let facultyId: string;
    try {
      facultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
      throw new Error("Authentication failed. Invalid ID token.");
    }
  
    const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
    try {
      const classroomSnap = await classroomDocRef.get();
      if (!classroomSnap.exists) throw new Error(`Classroom with ID ${classroomId} not found.`);
      
      const classroomData = classroomSnap.data() as Omit<Classroom, 'id'>;
      if (classroomData.ownerFacultyId !== facultyId) {
        throw new Error("Permission denied: Only the classroom owner can delete the classroom.");
      }
  
      await classroomDocRef.delete();
    } catch (error) {
      console.error(`Error deleting classroom ${classroomId}:`, error);
      throw error;
    }
}

/**
 * Server Action: Updates a student's batch within a specific classroom.
 */
export async function updateStudentBatchInClassroom(idToken: string, classroomId: string, studentUserId: string, newBatch: string): Promise<void> {
    if (adminInitializationError) {
      console.error("[classroomService:updateStudentBatchInClassroom SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:updateStudentBatchInClassroom SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }

    let facultyId: string;
    try {
        facultyId = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch (error) {
        console.error("[classroomService:updateStudentBatchInClassroom SA] Error verifying ID token:", error);
        throw new Error("Authentication failed. Invalid ID token.");
    }

    const permCheck = await checkFacultyPermissionForClassroom(classroomId, facultyId);
    if (!permCheck.permitted) {
        throw new Error("Permission denied to modify this classroom.");
    }

    const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
    try {
        const classroomSnap = await classroomDocRef.get();
        if (!classroomSnap.exists) {
            throw new Error("Classroom not found.");
        }
        const classroomData = classroomSnap.data() as Classroom; 
        const studentIndex = (classroomData.students || []).findIndex(s => s.userId === studentUserId);

        if (studentIndex === -1) {
            throw new Error("Student not found in this classroom roster.");
        }

        const updatedStudentsArray = [...(classroomData.students || [])];
        const trimmedBatch = newBatch.trim();
        updatedStudentsArray[studentIndex] = {
            ...updatedStudentsArray[studentIndex],
            batch: trimmedBatch === "" ? undefined : trimmedBatch, 
        };

        await classroomDocRef.update({ students: updatedStudentsArray });
        console.log(`[classroomService SA] Batch for student ${studentUserId} in classroom ${classroomId} updated to "${newBatch}".`);
    } catch (error) {
        console.error(`[classroomService:updateStudentBatchInClassroom SA] Error updating student batch:`, error);
        throw error;
    }
}

/**
 * Server Action: Retrieves the list of classrooms a student is enrolled in, along with their batch in each.
 * This is for the student to view their own classroom enrollments.
 * @param idToken - Student's Firebase ID token.
 */
export async function getStudentClassroomsWithBatchInfo(idToken: string): Promise<StudentClassroomEnrollmentInfo[]> {
    if (adminInitializationError) {
      console.error("[classroomService:getStudentClassroomsWithBatchInfo SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:getStudentClassroomsWithBatchInfo SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }

    let studentUid: string;
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        studentUid = decodedToken.uid;
    } catch (error) {
        console.error("[classroomService:getStudentClassroomsWithBatchInfo SA] Error verifying ID token:", error);
        throw new Error("Authentication failed. Invalid ID token.");
    }

    const enrolledClassrooms: StudentClassroomEnrollmentInfo[] = [];
    try {
        const classroomsSnapshot = await adminDb.collection('classrooms').get();
        if (classroomsSnapshot.empty) {
            return [];
        }

        classroomsSnapshot.forEach(docSnap => {
            const classroomData = docSnap.data() as Omit<Classroom, 'id'>; // Type assertion
            const studentEntry = (classroomData.students || []).find(s => s.userId === studentUid);

            if (studentEntry) {
                enrolledClassrooms.push({
                    classroomId: docSnap.id,
                    classroomName: classroomData.name,
                    classroomSubject: classroomData.subject,
                    studentBatchInClassroom: studentEntry.batch,
                });
            }
        });
        
        console.log(`[classroomService:getStudentClassroomsWithBatchInfo SA] Found ${enrolledClassrooms.length} classrooms for student ${studentUid}.`);
        return enrolledClassrooms;

    } catch (error) {
        console.error(`[classroomService:getStudentClassroomsWithBatchInfo SA] Error fetching classrooms for student ${studentUid} (Admin SDK):`, error);
        throw error;
    }
}

/**
 * Server Action: Retrieves classmates' information for a given classroom.
 * Ensures the requesting student is part of the classroom.
 * @param idToken - Student's Firebase ID token.
 * @param classroomId - The ID of the classroom.
 */
export async function getClassmatesInfo(idToken: string, classroomId: string): Promise<ClassmateInfo[]> {
    if (adminInitializationError) {
      console.error("[classroomService:getClassmatesInfo SA] Admin SDK init failed:", adminInitializationError.message);
      throw new Error("Server error: Admin SDK initialization failed.");
    }
    if (!adminDb || !adminAuth) {
      console.error("[classroomService:getClassmatesInfo SA] Admin DB or Auth not initialized.");
      throw new Error("Server error: Admin services not initialized.");
    }

    let studentUid: string;
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        studentUid = decodedToken.uid;
    } catch (error) {
        console.error("[classroomService:getClassmatesInfo SA] Error verifying ID token:", error);
        throw new Error("Authentication failed. Invalid ID token.");
    }

    try {
        const classroomDocRef = adminDb.collection('classrooms').doc(classroomId);
        const classroomSnap = await classroomDocRef.get();

        if (!classroomSnap.exists) {
            throw new Error(`Classroom with ID ${classroomId} not found.`);
        }

        const classroomData = classroomSnap.data() as Omit<Classroom, 'id'>;
        const studentsInClassroom = classroomData.students || [];

        // Verify the requesting student is part of this classroom
        const requestingStudentEntry = studentsInClassroom.find(s => s.userId === studentUid);
        if (!requestingStudentEntry) {
            console.warn(`[classroomService:getClassmatesInfo SA] Student ${studentUid} not found in classroom ${classroomId}. Denying access to classmates list.`);
            throw new Error("Access denied: You are not enrolled in this classroom.");
        }

        // Map to ClassmateInfo, excluding the requesting student
        const classmates = studentsInClassroom
            .filter(student => student.userId !== studentUid) // Exclude the requesting student
            .map(student => ({
                userId: student.userId,
                name: student.name,
                studentIdNumber: student.studentIdNumber,
                batch: student.batch,
            }));
        
        console.log(`[classroomService:getClassmatesInfo SA] Found ${classmates.length} classmates for student ${studentUid} in classroom ${classroomId}.`);
        return classmates;

    } catch (error) {
        console.error(`[classroomService:getClassmatesInfo SA] Error fetching classmates for classroom ${classroomId} (Admin SDK):`, error);
        throw error;
    }
}

    