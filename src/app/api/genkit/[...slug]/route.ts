
import { genkitNextHandler as actualGenkitNextHandler } from '@genkit-ai/next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'; // Ensure NextResponse is imported

// Ensure this API route runs on the Node.js runtime
export const runtime = 'nodejs';

// Import your flows here to ensure they are registered with the Genkit AI instance
// when requests are handled by the Next.js server.
// import '@/ai/flows/send-leave-notification-flow'; // Removed as leave feature is removed
// If you create more flows, import them here as well.

let handlerInstance: any;
let handlerInitializationError: Error | null = null;

function getInitializedHandler() {
  if (handlerInitializationError) {
    // If initialization previously failed, throw the stored error to be caught by GET/POST.
    console.warn('[Genkit API Route] Re-throwing previous initialization error.');
    throw handlerInitializationError;
  }
  if (!handlerInstance) {
    try {
      console.log('[Genkit API Route] Attempting to initialize Genkit handler...');
      handlerInstance = actualGenkitNextHandler();
      if (!handlerInstance || typeof handlerInstance.GET !== 'function' || typeof handlerInstance.POST !== 'function') {
        console.error("[Genkit API Route] actualGenkitNextHandler() did not return a valid handler object.");
        handlerInitializationError = new Error("Genkit handler initialization failed: Invalid handler object returned.");
        throw handlerInitializationError;
      }
      console.log('[Genkit API Route] Genkit handler initialized successfully.');
    } catch (e: any) {
      console.error("[Genkit API Route] Critical error during Genkit handler initialization:", e.message, e.stack);
      handlerInitializationError = new Error(`Genkit handler initialization failed: ${e.message}`);
      throw handlerInitializationError; // Throw to be caught by GET/POST
    }
  }
  return handlerInstance;
}

export async function GET(request: NextRequest, context: { params: { slug: string[] } }): Promise<NextResponse> {
  try {
    const currentHandler = getInitializedHandler();
    return await currentHandler.GET(request, context);
  } catch (error: any) {
    console.error(`[Genkit API Route GET] Error processing request: ${error.message}`, error.stack);
    return NextResponse.json(
        { error: 'Internal Server Error processing Genkit GET request', details: error.message },
        { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: { params: { slug: string[] } }): Promise<NextResponse> {
  try {
    const currentHandler = getInitializedHandler();
    return await currentHandler.POST(request, context);
  } catch (error: any) {
    console.error(`[Genkit API Route POST] Error processing request: ${error.message}`, error.stack);
    return NextResponse.json(
        { error: 'Internal Server Error processing Genkit POST request', details: error.message },
        { status: 500 }
    );
  }
}
