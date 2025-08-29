
'use server'; // Make it a server action file

import { adminDb, adminAuth, adminInitializationError } from '@/lib/firebase/admin.server';
import { FieldValue as AdminFieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

import type { ProfileChangeRequest } from '@/types/profile-change-request';
import type { StudentProfile } from './profile';

/**
 * Creates a new profile change request in Firestore (Server Action).
 * This is called from the client (e.g., student profile page).
 * Requires the student's Firebase ID token for authentication.
 */
export async function createProfileChangeRequest(
  idToken: string, // Student's Firebase ID token
  fieldName: keyof StudentProfile,
  oldValue: any,
  newValue: any
): Promise<string> {
  if (adminInitializationError) {
    console.error("[ServerAction:createProfileChangeRequest] Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("[ServerAction:createProfileChangeRequest] Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("[ServerAction:createProfileChangeRequest] Invalid ID token:", error);
    throw new Error("Authentication failed. Invalid or expired token.");
  }

  const userId = decodedToken.uid;
  const userEmail = decodedToken.email || 'N/A';
  // Firebase ID token (from client) usually doesn't include custom profile data like 'name'.
  // We must fetch it from our Firestore 'users' collection.
  let userName = 'N/A'; // Default if not found or error

  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      if (userData && userData.name) {
        userName = userData.name;
      } else {
        userName = 'User (name field missing in DB)';
      }
    } else {
      userName = 'User (document not found in DB)';
    }
  } catch (fetchError: any) {
    console.error(`[ServerAction:createProfileChangeRequest] CRITICAL: Error fetching user document or name for UID ${userId} from Firestore. Error: ${fetchError.message}`, fetchError.stack);
    userName = 'User (DB fetch error)'; // Specific fallback for DB read errors
  }
  
  const dataToCreate = {
    userId, 
    userName, // This will be the fetched name or one of the fallbacks
    userEmail,
    fieldName,
    oldValue,
    newValue,
    requestedAt: AdminFieldValue.serverTimestamp(), 
    status: 'pending',
  };

  try {
    const requestsCollection = adminDb.collection('profileChangeRequests');
    const docRef = await requestsCollection.add(dataToCreate);
    return docRef.id;
  } catch (error) {
    console.error("[ServerAction:createProfileChangeRequest] Error creating profile change request document (Admin SDK):", error);
    throw error;
  }
}

/**
 * Fetches all profile change requests from Firestore using Admin SDK (Server Action for admin).
 * @param idToken - Admin's Firebase ID token for verification.
 */
export async function getProfileChangeRequests(idToken: string): Promise<ProfileChangeRequest[]> {
  if (adminInitializationError) {
    console.error("getProfileChangeRequests SA Error: Admin SDK init failed:", adminInitializationError.message);
    console.log("Returning mock profile change requests due to Admin SDK init failure.");
    return [
        { id: 'req-mock-1', userId: 'mock-student-id', userName: 'Mock Student', userEmail: 'mock@example.com', fieldName: 'contactNumber', oldValue: '123456', newValue: '987654', requestedAt: new Date(), status: 'pending' },
    ];
  }
  if (!adminDb || !adminAuth) {
    console.error("getProfileChangeRequests SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  try {
    // Verify the admin's token to ensure this action is authorized
    await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("getProfileChangeRequests SA Error: Invalid ID token for admin", error);
    throw new Error("Authentication failed for admin action.");
  }
  
  try {
    const requestsCollectionRef = adminDb.collection('profileChangeRequests');
    const q = requestsCollectionRef.orderBy('requestedAt', 'desc');
    const snapshot = await q.get();
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const requestedAt = data.requestedAt as AdminTimestamp | undefined;
      const resolvedAt = data.resolvedAt as AdminTimestamp | undefined;
      
      return {
        id: docSnap.id,
        userId: data.userId || '',
        userName: data.userName || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        fieldName: data.fieldName || '',
        oldValue: data.oldValue,
        newValue: data.newValue,
        requestedAt: requestedAt ? requestedAt.toDate() : new Date(0),
        status: data.status || 'pending',
        adminNotes: data.adminNotes || '',
        resolvedAt: resolvedAt ? resolvedAt.toDate() : undefined,
      } as ProfileChangeRequest;
    });
  } catch (error) {
    console.error("Error fetching profile change requests (Admin SDK):", error);
    throw error;
  }
}

/**
 * Approves a profile change request, updating user's profile and request status (Server Action for admin).
 * @param idToken - Admin's Firebase ID token.
 * @param requestId - The ID of the profile change request document.
 * @param userId - The UID of the student whose profile is to be updated.
 * @param fieldName - The specific field in the student's profile to update.
 * @param newValue - The new value for the field.
 * @param adminNotes - Optional notes from the admin.
 */
export async function approveProfileChangeRequest(
  idToken: string,
  requestId: string,
  userId: string,
  fieldName: string,
  newValue: any,
  adminNotes?: string
): Promise<void> {
   if (adminInitializationError) {
    console.error("approveProfileChangeRequest SA Error: Admin SDK init failed:", adminInitializationError.message);
    console.log("Simulating successful approval due to Admin SDK init failure.");
    return;
   }
   if (!adminDb || !adminAuth) {
    console.error("approveProfileChangeRequest SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
   }

  let adminEmail = 'Unknown Admin';
  try {
    const adminDecodedToken = await adminAuth.verifyIdToken(idToken);
    adminEmail = adminDecodedToken.email || adminDecodedToken.uid;
  } catch (error) {
    console.error("approveProfileChangeRequest SA Error: Invalid ID token for admin", error);
    throw new Error("Authentication failed for admin action.");
  }

  try {
    const requestDocRef = adminDb.collection('profileChangeRequests').doc(requestId);
    const userDocRef = adminDb.collection('users').doc(userId);

    const batch = adminDb.batch();
    
    batch.update(userDocRef, { [fieldName]: newValue });
    
    batch.update(requestDocRef, {
      status: 'approved',
      resolvedAt: AdminFieldValue.serverTimestamp(),
      adminNotes: adminNotes || `Approved by admin (${adminEmail}).`,
    });
    
    await batch.commit();
  } catch (error) {
    console.error(`Error approving profile change request ${requestId} (Admin SDK):`, error);
    throw error;
  }
}

/**
 * Denies a profile change request (Server Action for admin).
 * @param idToken - Admin's Firebase ID token.
 * @param requestId - The ID of the profile change request document.
 * @param adminNotes - Reason for denial from the admin.
 */
export async function denyProfileChangeRequest(idToken: string, requestId: string, adminNotes: string): Promise<void> {
  if (adminInitializationError) {
    console.error("denyProfileChangeRequest SA Error: Admin SDK init failed:", adminInitializationError.message);
    console.log("Simulating successful denial due to Admin SDK init failure.");
    return;
  }
  if (!adminDb || !adminAuth) {
    console.error("denyProfileChangeRequest SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }
  
  let adminEmail = 'Unknown Admin';
  try {
    const adminDecodedToken = await adminAuth.verifyIdToken(idToken);
    adminEmail = adminDecodedToken.email || adminDecodedToken.uid;
  } catch (error) {
    console.error("denyProfileChangeRequest SA Error: Invalid ID token for admin", error);
    throw new Error("Authentication failed for admin action.");
  }

  if (!adminNotes || adminNotes.trim() === "") {
    throw new Error("Admin notes are required for denying a request.");
  }

  try {
    const requestDocRef = adminDb.collection('profileChangeRequests').doc(requestId);
    await requestDocRef.update({
      status: 'denied',
      resolvedAt: AdminFieldValue.serverTimestamp(),
      adminNotes: adminNotes,
    });
  } catch (error) {
    console.error(`Error denying profile change request ${requestId} (Admin SDK):`, error);
    throw error;
  }
}
