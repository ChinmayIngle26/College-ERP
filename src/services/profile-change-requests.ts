
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
  console.log(
    `[ServerAction:createProfileChangeRequest] Attempting to create profile change request. FieldName: ${fieldName}, OldValue: ${String(oldValue)}, NewValue: ${String(newValue)}`
  );

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

  console.log(`[ServerAction:createProfileChangeRequest] User authenticated (UID: ${userId}, Email: ${userEmail}). Attempting to fetch name from Firestore.`);
  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      console.log(`[ServerAction:createProfileChangeRequest] User document found for UID ${userId}.`);
      const userData = userDocSnap.data();
      if (userData && userData.name) {
        userName = userData.name;
        console.log(`[ServerAction:createProfileChangeRequest] Successfully fetched name: '${userName}' for UID ${userId}.`);
      } else {
        userName = 'User (name field missing in DB)';
        console.warn(`[ServerAction:createProfileChangeRequest] User document for UID ${userId} exists but is missing the 'name' field. userData:`, userData);
      }
    } else {
      userName = 'User (document not found in DB)';
      console.warn(`[ServerAction:createProfileChangeRequest] User document for UID ${userId} NOT found in Firestore 'users' collection.`);
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

  console.log(
    "[ServerAction:createProfileChangeRequest] Data to be written to 'profileChangeRequests' (Admin SDK):",
    JSON.stringify(dataToCreate, null, 2) // Log the final payload
  );

  try {
    const requestsCollection = adminDb.collection('profileChangeRequests');
    const docRef = await requestsCollection.add(dataToCreate);
    console.log(`[ServerAction:createProfileChangeRequest] Profile change request created successfully with ID: ${docRef.id} using Admin SDK.`);
    return docRef.id;
  } catch (error) {
    console.error("[ServerAction:createProfileChangeRequest] Error creating profile change request document (Admin SDK):", error);
    // Re-throw the error so the client can handle it (e.g., show a toast)
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
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("getProfileChangeRequests SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }

  try {
    // Verify the admin's token to ensure this action is authorized
    const adminDecodedToken = await adminAuth.verifyIdToken(idToken);
    // Optional: Check if adminDecodedToken.role === 'admin' if you have custom claims
    console.log(`[ServerAction:getProfileChangeRequests] Admin token verified for UID: ${adminDecodedToken.uid}`);
  } catch (error) {
    console.error("getProfileChangeRequests SA Error: Invalid ID token for admin", error);
    throw new Error("Authentication failed for admin action.");
  }
  
  try {
    const requestsCollectionRef = adminDb.collection('profileChangeRequests');
    // Order by requestedAt in descending order to get latest requests first
    const q = requestsCollectionRef.orderBy('requestedAt', 'desc');
    const snapshot = await q.get();
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const requestedAt = data.requestedAt as AdminTimestamp | undefined;
      const resolvedAt = data.resolvedAt as AdminTimestamp | undefined;
      
      // Ensure all necessary fields are present, providing defaults if necessary for type safety
      return {
        id: docSnap.id,
        userId: data.userId || '',
        userName: data.userName || 'Unknown User', // Fallback if userName wasn't set correctly
        userEmail: data.userEmail || 'N/A',
        fieldName: data.fieldName || '',
        oldValue: data.oldValue, // Keep as is, might be various types
        newValue: data.newValue, // Keep as is
        requestedAt: requestedAt ? requestedAt.toDate() : new Date(0), // Fallback to epoch if missing
        status: data.status || 'pending',
        adminNotes: data.adminNotes || '',
        resolvedAt: resolvedAt ? resolvedAt.toDate() : undefined,
      } as ProfileChangeRequest;
    });
  } catch (error) {
    console.error("Error fetching profile change requests (Admin SDK):", error);
    throw error; // Re-throw to be handled by the caller
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
  fieldName: string, // Should match a key in StudentProfile
  newValue: any,
  adminNotes?: string
): Promise<void> {
   if (adminInitializationError) {
    console.error("approveProfileChangeRequest SA Error: Admin SDK init failed:", adminInitializationError.message);
    throw new Error("Server error: Admin SDK initialization failed.");
   }
   if (!adminDb || !adminAuth) {
    console.error("approveProfileChangeRequest SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
   }

  let adminEmail = 'Unknown Admin';
  try {
    const adminDecodedToken = await adminAuth.verifyIdToken(idToken);
    adminEmail = adminDecodedToken.email || adminDecodedToken.uid;
    console.log(`[ServerAction:approveProfileChangeRequest] Admin token verified for: ${adminEmail}`);
  } catch (error) {
    console.error("approveProfileChangeRequest SA Error: Invalid ID token for admin", error);
    throw new Error("Authentication failed for admin action.");
  }

  try {
    const requestDocRef = adminDb.collection('profileChangeRequests').doc(requestId);
    const userDocRef = adminDb.collection('users').doc(userId);

    // Firestore batch write to ensure atomicity
    const batch = adminDb.batch();
    
    // Update the user's profile document
    // Ensure fieldName is a valid key; consider validating against StudentProfile keys if stricter type safety is needed
    batch.update(userDocRef, { [fieldName]: newValue });
    
    // Update the profile change request document
    batch.update(requestDocRef, {
      status: 'approved',
      resolvedAt: AdminFieldValue.serverTimestamp(),
      adminNotes: adminNotes || `Approved by admin (${adminEmail}).`,
    });
    
    await batch.commit();
    console.log(`[ServerAction:approveProfileChangeRequest] Request ${requestId} approved. User ${userId} field ${fieldName} updated.`);
  } catch (error) {
    console.error(`Error approving profile change request ${requestId} (Admin SDK):`, error);
    throw error; // Re-throw for client-side handling
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
    throw new Error("Server error: Admin SDK initialization failed.");
  }
  if (!adminDb || !adminAuth) {
    console.error("denyProfileChangeRequest SA Error: Admin DB or Auth not initialized.");
    throw new Error("Server error: Admin services not initialized.");
  }
  
  let adminEmail = 'Unknown Admin';
  try {
    const adminDecodedToken = await adminAuth.verifyIdToken(idToken);
    adminEmail = adminDecodedToken.email || adminDecodedToken.uid;
    console.log(`[ServerAction:denyProfileChangeRequest] Admin token verified for: ${adminEmail}`);
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
      adminNotes: adminNotes, // Using the provided notes
    });
    console.log(`[ServerAction:denyProfileChangeRequest] Request ${requestId} denied by admin (${adminEmail}).`);
  } catch (error) {
    console.error(`Error denying profile change request ${requestId} (Admin SDK):`, error);
    throw error; // Re-throw for client-side handling
  }
}
