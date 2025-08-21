
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a student enrolled in a classroom, including their assigned batch.
 */
export interface ClassroomStudentInfo {
  userId: string;          // Firebase UID of the student
  studentIdNumber: string; // Official student ID (e.g., "A-001", "B-102")
  name: string;            // Full name of the student
  email?: string;           // Optional: student email
  batch?: string;           // Assigned batch (e.g., "A", "B", or manually assigned name)
}

/**
 * Represents a classroom created by a faculty member.
 */
export interface Classroom {
  id: string; // Firestore document ID (set manually after fetching the doc)
  
  name: string; // Name of the classroom (e.g., "AIML Year 1")
  
  subject: string; // Subject or short description of the classroom (e.g., "Data Structures")
  
  ownerFacultyId: string; // UID of the faculty member who created the classroom
  
  invitedFacultyIds: string[]; // UIDs of other faculty members allowed to access and manage this classroom
  
  students: ClassroomStudentInfo[]; // Array of student objects with their details and batch

  createdAt?: Timestamp | Date; // Optional timestamp, set on creation
}

/**
 * Represents a student in a classroom, for UI display purposes when listing students.
 * This is often derived from ClassroomStudentInfo.
 */
export interface ClassroomStudent extends ClassroomStudentInfo {
  // Inherits all fields from ClassroomStudentInfo
  // id is equivalent to userId from ClassroomStudentInfo
  // This type might be more for UI components if they expect an 'id' field specifically.
  // For service layer, ClassroomStudentInfo might be sufficient.
}

/**
 * Simplified representation of a faculty member, used in selection components.
 */
export interface FacultyUser {
  uid: string; // Firebase UID of the faculty user
  name: string; // Name of the faculty member
  email: string; // Email of the faculty member (used for display or contact)
}

/**
 * Represents a student found via search, for adding to a classroom.
 */
export interface StudentSearchResultItem {
  uid: string; // Firebase UID of the student
  name: string;
  studentId: string; // User-facing student ID (from users collection, e.g. "A-001")
  email: string;
}

/**
 * Information about a classroom a student is enrolled in, including their specific batch.
 */
export interface StudentClassroomEnrollmentInfo {
  classroomId: string;
  classroomName: string;
  classroomSubject: string;
  studentBatchInClassroom?: string; // The student's batch within this specific classroom
}

/**
 * Basic information about a classmate for display.
 */
export interface ClassmateInfo {
    userId: string;
    name: string;
    studentIdNumber: string;
    batch?: string; // Their batch within the common classroom
}

