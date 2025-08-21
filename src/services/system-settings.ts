
// src/services/system-settings.ts
export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewUserRegistration: boolean;
  applicationName: string;
  announcementTitle: string;
  announcementContent: string;
  defaultItemsPerPage: number;
  lastUpdated?: Date | null;
}

const SETTINGS_COLLECTION = 'systemSettings';
const SETTINGS_DOC_ID = 'appConfiguration';

const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  allowNewUserRegistration: true,
  applicationName: 'AISSMS Industrial Training Institute',
  announcementTitle: 'Welcome to AISSMS ITI!',
  announcementContent: 'Stay tuned for important updates and announcements. You can customize this message in the admin settings.',
  defaultItemsPerPage: 10,
  lastUpdated: null,
};

/**
 * Asynchronously retrieves the current system settings.
 * This version is now EXCLUSIVELY for Edge or Client-side.
 * Node.js server-side metadata generation should fetch directly.
 *
 * @returns A promise that resolves to a SystemSettings object.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const onServer = typeof window === 'undefined';
  const isEdgeEnvironment = onServer && typeof globalThis.EdgeRuntime === 'string';
  const callContext = isEdgeEnvironment ? 'server-edge' : (onServer ? 'server-node-unexpected' : 'client');

  console.log(`[SystemSettings:${callContext}] getSystemSettings called.`);

  if (isEdgeEnvironment) {
    console.log(`[SystemSettings:server-edge] In Edge Runtime. Returning default system settings directly.`);
    return { ...defaultSettings, lastUpdated: new Date() }; // Return defaults, no Admin SDK import
  }

  if (onServer && !isEdgeEnvironment) {
    // This block should ideally not be hit if Node.js specific callers (like generateMetadata)
    // are modified to fetch settings directly.
    // If it is hit, it means a Node.js server context is calling this generic getter,
    // which no longer supports Admin SDK directly.
    console.warn(`[SystemSettings:server-node-unexpected] UNEXPECTED CALL from Node.js server environment. This function no longer uses Admin SDK. Returning default settings. Node.js callers should fetch settings directly using admin.server.ts.`);
    return { ...defaultSettings };
  }

  // Client-side: Use Firebase Client SDK
  if (!onServer) {
    console.log(`[SystemSettings:client] Attempting to use Firebase Client SDK.`);
    try {
      // Dynamic imports for client-side Firebase
      const { db: clientDb } = await import('@/lib/firebase/client');
      const { doc: clientDocFn, getDoc: getClientDocFn, setDoc: setClientDocFn, serverTimestamp: clientServerTimestampFn, Timestamp: ClientTimestamp } = await import('firebase/firestore');

      if (!clientDb) {
        console.warn(`[SystemSettings:client] Firestore Client DB instance is not available. Returning default system settings.`);
        return { ...defaultSettings };
      }
      const settingsClientDocRef = clientDocFn(clientDb, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const docSnap = await getClientDocFn(settingsClientDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`[SystemSettings:client] Fetched settings from Firestore (Client).`);
        return {
          ...defaultSettings,
          ...data,
          lastUpdated: data.lastUpdated instanceof ClientTimestamp ? data.lastUpdated.toDate() : (data.lastUpdated && typeof data.lastUpdated.toDate === 'function' ? data.lastUpdated.toDate() : null),
        };
      } else {
        console.warn(`[SystemSettings:client] No system settings document found (Client). Initializing with default values.`);
        // Avoid writing from client here to prevent race conditions or permission issues for initial setup.
        // Admin panel should handle initial creation if needed.
        return { ...defaultSettings, lastUpdated: new Date() };
      }
    } catch (error: any) {
      console.error(`[SystemSettings:client] Error fetching/initializing system settings (Client). Error: ${error.message}. Stack: ${error.stack}. Returning default system settings.`);
      return { ...defaultSettings };
    }
  }

  // Fallback if somehow no condition was met (shouldn't happen)
  console.warn(`[SystemSettings] Unhandled case for getSystemSettings (onServer: ${onServer}, isEdgeEnvironment: ${isEdgeEnvironment}). Returning default system settings.`);
  return { ...defaultSettings };
}

/**
 * Asynchronously updates specified system settings in Firestore using the Client SDK.
 * This function is intended to be called from client-side components (e.g., AdminSettingsPage).
 */
export async function updateSystemSettings(settingsToUpdate: Partial<SystemSettings>): Promise<void> {
  const { db: clientDb } = await import('@/lib/firebase/client');
  const { doc: clientDocFn, setDoc: setClientDocFn, serverTimestamp: clientServerTimestampFn } = await import('firebase/firestore');

  if (!clientDb) {
    console.error(`[SystemSettings:update] Firestore Client DB instance is not available.`);
    throw new Error("Database connection error while updating system settings.");
  }

  const settingsDocRef = clientDocFn(clientDb, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  try {
    const dataToUpdate = { ...settingsToUpdate, lastUpdated: clientServerTimestampFn() };
    await setClientDocFn(settingsDocRef, dataToUpdate, { merge: true });
    console.log(`[SystemSettings:update] Successfully updated settings via client SDK.`);
  } catch (error) {
    console.error(`[SystemSettings:update] Error updating system settings (Client SDK):`, error);
     if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'permission-denied') {
            throw new Error("Permission denied when updating system settings. Ensure admin has correct Firestore permissions for 'systemSettings/appConfiguration'.");
        }
    }
    throw new Error("Failed to update system settings.");
  }
}

