// src/lib/firebase/admin.ts
// THIS FILE IS DEPRECATED.
// Firebase Admin SDK initialization is now split into:
// - src/lib/firebase/admin.server.ts (for Node.js server environments)
// - src/lib/firebase/admin.edge.ts (placeholder for Edge environments)
//
// Please update imports accordingly.
// Services like system-settings.ts will conditionally import the correct module.
// Server Actions or other Node.js-only server code should directly import from 'admin.server.ts'.

const deprecationMessage = "src/lib/firebase/admin.ts is deprecated. Use admin.server.ts for Node.js Admin SDK or admin.edge.ts for Edge placeholder, or rely on services that conditionally import these.";
console.warn(deprecationMessage);

export const adminApp = undefined;
export const adminAuth = null;
export const adminDb = null;
export const adminInitializationError = new Error(deprecationMessage + " No Admin SDK initialized from this file.");
