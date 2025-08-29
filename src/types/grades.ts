
import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a student's grade for a specific course or exam.
 */
export interface Grade {
  id?: string; // Firestore document ID
  studentId: string; // The UID of the student
  courseName: string;
  grade: string;
  facultyId: string; // The UID of the faculty member who entered the grade
  updatedAt: Timestamp | Date;
}
