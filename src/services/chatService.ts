
'use server';

import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import type { ChatMessage } from '@/types/chat';

/**
 * Sends a chat message to a specific classroom.
 * This is a Server Action called from the client-side ChatRoom component.
 * @param idToken - The Firebase ID token of the authenticated user sending the message.
 * @param classroomId - The ID of the classroom to send the message to.
 * @param text - The content of the message.
 */
export async function sendMessage(
  idToken: string,
  classroomId: string,
  text: string
): Promise<void> {
  if (adminInitializationError) {
    console.error("sendMessage SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("sendMessage SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  if (!text || text.trim() === '') {
    throw new Error("Message text cannot be empty.");
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("sendMessage SA Error: Invalid ID token", error);
    throw new Error("Authentication failed. Invalid or expired token.");
  }

  const senderId = decodedToken.uid;
  let senderName = decodedToken.name || decodedToken.email || 'Anonymous';
  try {
    const userDoc = await adminDb.collection('users').doc(senderId).get();
    if (userDoc.exists && userDoc.data()?.name) {
      senderName = userDoc.data()!.name;
    }
  } catch (e) {
    console.warn(`sendMessage SA: Could not fetch sender's name for UID ${senderId}. Error: ${(e as Error).message}`);
  }


  const messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp: any } = {
    classroomId,
    senderId,
    senderName,
    text: text.trim(),
    timestamp: AdminFieldValue.serverTimestamp(),
  };

  try {
    const messagesCollectionRef = adminDb.collection('classrooms').doc(classroomId).collection('messages');
    await messagesCollectionRef.add(messageData);
    console.log(`sendMessage SA: Message sent successfully to classroom ${classroomId} by ${senderId}`);
  } catch (error) {
    console.error(`sendMessage SA Error: Error sending message to classroom ${classroomId}:`, error);
    throw new Error("Could not send message. Please try again.");
  }
}
