
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

if (!_getApps().length) {
    console.log("[AdminServer] No Firebase admin apps initialized yet. Attempting initialization.");
    let credentials;
    let credSource = "unknown";

    try {
        if (serviceAccountJsonString) {
            credSource = "GOOGLE_APPLICATION_CREDENTIALS_JSON (environment variable string)";
            console.log(`[AdminServer] Attempting to use ${credSource}. Length: ${serviceAccountJsonString.length}`);
            try {
                const serviceAccount = JSON.parse(serviceAccountJsonString);
                if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                    const validationError = new Error(`[AdminServer] Parsed ${credSource} is missing required fields (project_id, private_key, client_email).`);
                    console.error(validationError.message);
                    adminInitializationErrorInstance = validationError;
                } else {
                    credentials = _cert(serviceAccount);
                    console.log(`[AdminServer] Credentials parsed successfully from ${credSource}. Project ID from JSON: ${serviceAccount.project_id}`);
                }
            } catch (e: any) {
                adminInitializationErrorInstance = new Error(`[AdminServer] Failed to parse/validate ${credSource}: ${e.message}`);
                console.error(adminInitializationErrorInstance.message, e.stack);
            }
        } else {
            credSource = "Application Default Credentials (ADC)";
            console.log(`[AdminServer] GOOGLE_APPLICATION_CREDENTIALS_JSON is NOT set. Attempting to use ${credSource}.`);
            // For ADC, initializeApp is called without specific credential object.
        }

        if (!adminInitializationErrorInstance) { // Proceed only if prior credential processing was okay
            console.log(`[AdminServer] Initializing Firebase Admin App using ${credSource}...`);
            const appOptions = credentials ? { credential: credentials } : undefined;
            adminAppInstance = _initializeApp(appOptions);
            
            if (adminAppInstance) {
                try {
                    adminAuthInstance = _getAuth(adminAppInstance);
                    adminDbInstance = _getFirestore(adminAppInstance);
                    // Check if project ID is available directly on the app's options
                    const projectIdFromAppOptions = adminAppInstance.options?.projectId;
                    if (projectIdFromAppOptions) {
                         console.log(`[AdminServer] Firebase Admin App initialized successfully via ${credSource}. App Name: ${adminAppInstance.name}, Project ID from options: ${projectIdFromAppOptions}`);
                    } else {
                        // Attempt to get project ID from the service if options don't have it
                        // This is a fallback and might not always be available depending on initialization
                        const projectIdFromService = (adminAppInstance.options.credential as any)?.projectId || (adminAppInstance.options.credential as any)?.getProjectId?.();
                        if(projectIdFromService) {
                            console.log(`[AdminServer] Firebase Admin App initialized successfully via ${credSource}. App Name: ${adminAppInstance.name}, Project ID from service: ${projectIdFromService}`);
                        } else {
                            console.warn(`[AdminServer] Firebase Admin App initialized via ${credSource}, services obtained, but Project ID is MISSING or not accessible from app.options or credential. App Name: ${adminAppInstance.name}. Options: ${JSON.stringify(adminAppInstance.options)}`);
                        }
                    }
                    console.log("[AdminServer] Firebase Admin Auth and Firestore services obtained.");
                } catch (serviceError: any) {
                    const serviceFailureMsg = `[AdminServer] initializeApp() call via ${credSource} seemed to return an app object, but failed to get Auth/Firestore services. Error: ${serviceError.message}. App object (if any): ${JSON.stringify(adminAppInstance || null)}`;
                    console.error(serviceFailureMsg, serviceError.stack);
                    adminInitializationErrorInstance = new Error(serviceFailureMsg);
                    adminAppInstance = undefined;
                    adminAuthInstance = null;
                    adminDbInstance = null;
                }
            } else {
                 const initFailureMsg = `[AdminServer] initializeApp() call via ${credSource} returned a null/undefined app object. This is a critical failure.`;
                 console.error(initFailureMsg);
                 adminInitializationErrorInstance = new Error(initFailureMsg);
            }
        }
    } catch (error: any) {
        // This catches errors from initializeApp itself if it throws directly
        adminInitializationErrorInstance = new Error(`[AdminServer] CRITICAL Exception during Firebase Admin SDK initializeApp attempt with ${credSource}: ${error.message}`);
        console.error(adminInitializationErrorInstance.message, error.stack);
        adminAppInstance = undefined;
        adminAuthInstance = null;
        adminDbInstance = null;
    }
} else {
    console.log("[AdminServer] Firebase admin app already initialized. Getting existing instance.");
    adminAppInstance = _getApps()[0];
    if (adminAppInstance) {
        try {
            adminAuthInstance = _getAuth(adminAppInstance);
            adminDbInstance = _getFirestore(adminAppInstance);
            console.log("[AdminServer] Existing Firebase Admin Auth and Firestore services obtained.");
             const existingProjectId = adminAppInstance.options?.projectId || (adminAppInstance.options.credential as any)?.projectId || (adminAppInstance.options.credential as any)?.getProjectId?.();
             if (!existingProjectId) {
                console.warn("[AdminServer] Existing app instance is missing projectId in options/credential:", JSON.stringify(adminAppInstance.options));
            } else {
                console.log(`[AdminServer] Existing app Project ID: ${existingProjectId}`);
            }
        } catch (serviceError: any) {
            adminInitializationErrorInstance = new Error(`[AdminServer] Error getting services from existing app: ${serviceError.message}`);
            console.error(adminInitializationErrorInstance.message, serviceError.stack);
            adminAuthInstance = null;
            adminDbInstance = null;
        }
    } else {
        // This case should ideally not be reached if getApps().length > 0
        adminInitializationErrorInstance = new Error("[AdminServer] getApps() returned content, but the app instance was unexpectedly null/undefined when trying to retrieve existing app.");
        console.error(adminInitializationErrorInstance.message);
    }
}

// Final status logging
if (adminInitializationErrorInstance) {
    console.error(`[AdminServer] FINAL STATUS: Initialization FAILED. Error: "${adminInitializationErrorInstance.message}"`);
    adminAppInstance = undefined;
    adminAuthInstance = null;
    adminDbInstance = null;
} else if (adminAppInstance && adminDbInstance && adminAuthInstance) {
    const finalProjectId = adminAppInstance.options?.projectId || (adminAppInstance.options.credential as any)?.projectId || (adminAppInstance.options.credential as any)?.getProjectId?.();
    console.log(`[AdminServer] FINAL STATUS: Successfully initialized/retrieved Firebase Admin SDK. Project ID: ${finalProjectId || 'N/A (Warning: Project ID missing!)'}`);
} else {
    const unknownErrorMsg = "[AdminServer] FINAL STATUS: Initialization state UNKNOWN or INCOMPLETE. App or services are not set, but no explicit error was caught. This is unexpected.";
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
