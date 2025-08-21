
export type ProfileChangeRequestStatus = 'pending' | 'approved' | 'denied';

export interface ProfileChangeRequest {
  id: string; // Firestore document ID
  userId: string; // UID of the student
  userName?: string; // Name of the student, for display in admin panel
  userEmail?: string; // Email of the student, for display
  fieldName: string; // e.g., 'email', 'contactNumber'
  oldValue: any;
  newValue: any;
  requestedAt: Date | any; // Firestore Timestamp
  status: ProfileChangeRequestStatus;
  adminNotes?: string; // Notes from admin on approval/denial
  resolvedAt?: Date | any; // Firestore Timestamp
}
