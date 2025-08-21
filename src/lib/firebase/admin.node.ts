// This file was renamed to admin.server.ts
// The content has been moved to src/lib/firebase/admin.server.ts
// This file can be deleted.

const message = "This file (admin.node.ts) has been renamed to admin.server.ts and its content moved. This file should be deleted.";
console.error(message);
export const adminApp = undefined;
export const adminAuth = null;
export const adminDb = null;
export const adminInitializationError = new Error(message);
