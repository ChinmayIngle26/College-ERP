
import type { Timestamp } from 'firebase/firestore';

export interface LectureAttendanceRecord {
  id?: string; // Firestore document ID, optional for creation
  classroomId: string;
  classroomName: string; // Denormalized for easier querying/display
  facultyId: string; // UID of faculty who submitted this specific attendance
  facultyName?: string; // Denormalized name of the faculty for display
  date: string; // YYYY-MM-DD
  lectureName: string; // This will now represent the Subject/Topic of the lecture
  studentId: string; // UID of the student
  studentName: string; // Denormalized for easier querying/display
  studentIdNumber?: string; // The official student ID/roll number
  status: 'present' | 'absent';
  batch?: string; // Optional: The batch for which attendance was taken (e.g., "A", "Practical Batch 1")
  submittedAt?: Timestamp | Date;
}
