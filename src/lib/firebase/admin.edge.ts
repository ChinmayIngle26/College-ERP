// src/lib/firebase/admin.edge.ts
// This file is a placeholder for Admin SDK exports when in an Edge Runtime.
// It does NOT import or initialize 'firebase-admin'.

const edgeErrorMsg = "Firebase Admin SDK cannot be used in an Edge Runtime. This is a placeholder module (admin.edge.ts).";

export const adminApp = undefined;
export const adminAuth = null;
export const adminDb = null;
export const adminInitializationError = new Error(edgeErrorMsg);

// console.warn(`Firebase Admin (Edge Placeholder): ${edgeErrorMsg}`); // Log only once if needed, or remove for cleaner logs
