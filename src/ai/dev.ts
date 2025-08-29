
// This file is used to run Genkit flows locally using `genkit start`.
// Import flows here to ensure they are registered with the Genkit development server.
import '@/ai/flows/send-bulk-email-flow';
import '@/ai/flows/analyze-grades-flow';

console.log('Genkit development server started. Imported flows: send-bulk-email-flow, analyze-grades-flow');
