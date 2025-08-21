
import type { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id?: string; // Firestore document ID
  classroomId: string;
  senderId: string; // Firebase UID of the sender
  senderName: string; // Display name of the sender
  text: string;
  timestamp: Timestamp | Date | any; // Firestore Server Timestamp on send, Date on retrieval
}
