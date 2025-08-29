
// src/lib/firebase/admin.server.ts
console.log("[AdminServer] TOP: admin.server.ts is being loaded/executed.");
console.log(`[AdminServer] NEXT_RUNTIME: ${process.env.NEXT_RUNTIME || 'undefined'}, VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`);

import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

// Modular imports
import { initializeApp as _initializeApp, getApps as _getApps, cert as _cert } from 'firebase-admin/app';
import { getAuth as _getAuth } from 'firebase-admin/auth';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';


let adminAppInstance: App | undefined = undefined;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let adminInitializationErrorInstance: Error | null = null;

const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const serviceAccountB64String = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;


if (!_getApps().length) {
    console.log("[AdminServer] No Firebase admin apps initialized yet. Attempting initialization.");
    let credentials;
    let credSource = "unknown";

    try {
        let serviceAccountContent: string | undefined;

        // Priority 1: Base64 encoded credentials
        if (serviceAccountB64String) {
            credSource = "GOOGLE_APPLICATION_CREDENTIALS_B64";
            console.log(`[AdminServer] Found ${credSource}. Attempting to decode and parse.`);
            try {
                serviceAccountContent = Buffer.from(serviceAccountB64String, 'base64').toString('utf8');
            } catch (e: any) {
                adminInitializationErrorInstance = new Error(`[AdminServer] Failed to decode Base64 string from ${credSource}. Error: ${e.message}`);
                console.error(adminInitializationErrorInstance.message);
            }
        } 
        // Priority 2: Raw JSON string credentials
        else if (serviceAccountJsonString) {
            credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON";
            console.log(`[AdminServer] Found ${credSource}. Attempting to parse.`);
            serviceAccountContent = serviceAccountJsonString;
        } 
        // Priority 3: Fallback to Application Default Credentials
        else {
            credSource = "Application Default Credentials (ADC)";
            console.log(`[AdminServer] No specific credentials found. Falling back to ${credSource}.`);
        }

        // If we have content (from B64 or JSON string), parse it.
        if (serviceAccountContent) {
             if (serviceAccountContent.trim() === "" || serviceAccountContent.length < 2) {
                 const validationError = new Error(`[AdminServer] The credential content from ${credSource} is empty or invalid.`);
                 console.error(validationError.message);
                 adminInitializationErrorInstance = validationError;
             } else {
                 try {
                    const serviceAccount = JSON.parse(serviceAccountContent);
                    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                        const validationError = new Error(`[AdminServer] Parsed credentials from ${credSource} are missing required fields (project_id, private_key, client_email).`);
                        console.error(validationError.message);
                        adminInitializationErrorInstance = validationError;
                    } else {
                        credentials = _cert(serviceAccount);
                        console.log(`[AdminServer] Credentials parsed successfully from ${credSource}. Project ID: ${serviceAccount.project_id}`);
                    }
                 } catch (e: any) {
                    adminInitializationErrorInstance = new Error(`[AdminServer] Failed to parse JSON content from ${credSource}. Content is likely malformed. JSON.parse error: ${e.message}`);
                    console.error(adminInitializationErrorInstance.message, e.stack);
                 }
             }
        }
        
        // Initialize app if no errors so far
        if (!adminInitializationErrorInstance) {
            console.log(`[AdminServer] Initializing Firebase Admin App using ${credSource}...`);
            const appOptions = credentials ? { credential: credentials } : undefined;
            adminAppInstance = _initializeApp(appOptions);
            
            if (adminAppInstance) {
                try {
                    adminAuthInstance = _getAuth(adminAppInstance);
                    adminDbInstance = _getFirestore(adminAppInstance);
                    const projectIdFromAppOptions = adminAppInstance.options?.projectId;
                    if (projectIdFromAppOptions) {
                         console.log(`[AdminServer] Firebase Admin App initialized successfully. App Name: ${adminAppInstance.name}, Project ID: ${projectIdFromAppOptions}`);
                    } else {
                        console.warn(`[AdminServer] Firebase Admin App initialized successfully, but Project ID is MISSING from app options.`);
                    }
                } catch (serviceError: any) {
                    const serviceFailureMsg = `[AdminServer] initializeApp() via ${credSource} seemed to succeed, but failed to get Auth/Firestore services. Error: ${serviceError.message}`;
                    console.error(serviceFailureMsg, serviceError.stack);
                    adminInitializationErrorInstance = new Error(serviceFailureMsg);
                    adminAppInstance = undefined; // Nullify on partial failure
                }
            } else {
                 const initFailureMsg = `[AdminServer] initializeApp() call via ${credSource} returned a null/undefined app object. This is a critical failure.`;
                 console.error(initFailureMsg);
                 adminInitializationErrorInstance = new Error(initFailureMsg);
            }
        }

    } catch (error: any) {
        adminInitializationErrorInstance = new Error(`[AdminServer] CRITICAL Exception during Firebase Admin SDK initialization attempt with ${credSource}: ${error.message}`);
        console.error(adminInitializationErrorInstance.message, error.stack);
        adminAppInstance = undefined;
    }

} else {
    console.log("[AdminServer] Firebase admin app already initialized. Getting existing instance.");
    adminAppInstance = _getApps()[0];
    if (adminAppInstance) {
        try {
            adminAuthInstance = _getAuth(adminAppInstance);
            adminDbInstance = _getFirestore(adminAppInstance);
        } catch (serviceError: any) {
            adminInitializationErrorInstance = new Error(`[AdminServer] Error getting services from existing app: ${serviceError.message}`);
            console.error(adminInitializationErrorInstance.message, serviceError.stack);
        }
    } else {
        adminInitializationErrorInstance = new Error("[AdminServer] getApps() returned content, but the app instance was unexpectedly null/undefined.");
        console.error(adminInitializationErrorInstance.message);
    }
}


// Final status logging and export
if (adminInitializationErrorInstance) {
    console.error(`[AdminServer] FINAL STATUS: Initialization FAILED. Error: "${adminInitializationErrorInstance.message}"`);
    adminAppInstance = undefined;
    adminAuthInstance = null;
    adminDbInstance = null;
} else if (adminAppInstance && adminDbInstance && adminAuthInstance) {
    const finalProjectId = adminAppInstance.options?.projectId;
    console.log(`[AdminServer] FINAL STATUS: Successfully initialized/retrieved Firebase Admin SDK. Project ID: ${finalProjectId || 'N/A'}`);
} else {
    const unknownErrorMsg = "[AdminServer] FINAL STATUS: Initialization state UNKNOWN or INCOMPLETE. No explicit error was caught, but instances are not set.";
    console.error(unknownErrorMsg);
    if (!adminInitializationErrorInstance) {
        adminInitializationErrorInstance = new Error(unknownErrorMsg);
    }
    adminAppInstance = undefined;
    adminAuthInstance = null;
    adminDbInstance = null;
}

export const adminApp = adminAppInstance;
export const adminAuth = adminAuthInstance;
export const adminDb = adminDbInstance;
export const adminInitializationError = adminInitializationErrorInstance;
