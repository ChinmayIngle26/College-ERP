
'use server';
/**
 * @fileOverview A Genkit flow for sending bulk email notifications.
 *
 * This flow is designed to be called by an admin panel to send
 * notifications to a list of recipients. It uses the `email-service`
 * to dispatch the emails.
 */

import { ai } from '@/ai/ai-instance';
import { sendEmail } from '@/services/email-service';
// Import schemas and types from the new dedicated types file
import { 
  SendBulkEmailInputSchema, 
  SendBulkEmailOutputSchema, 
  type SendBulkEmailInput, 
  type SendBulkEmailOutput 
} from '@/types/notifications';


// Exported wrapper function that clients will call
export async function sendBulkEmail(input: SendBulkEmailInput): Promise<SendBulkEmailOutput> {
  return sendBulkEmailFlow(input);
}


const sendBulkEmailFlow = ai.defineFlow(
  {
    name: 'sendBulkEmailFlow',
    inputSchema: SendBulkEmailInputSchema,
    outputSchema: SendBulkEmailOutputSchema,
  },
  async (input) => {
    console.log(`[Flow: sendBulkEmailFlow] Received request to send email titled "${input.subject}" to ${input.recipients.length} recipients.`);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("[Flow: sendBulkEmailFlow] SMTP environment variables are not set. Cannot send emails.");
      throw new Error("Email service is not configured on the server. Please contact the administrator.");
    }
    
    // In a real-world scenario, you might send emails in batches.
    // For this example, we send them all at once.
    try {
      await sendEmail({
        to: input.recipients.join(','), // Nodemailer can take a comma-separated list
        subject: input.subject,
        html: input.body, // Assuming the body is HTML
      });
      
      const result = {
        success: true,
        message: `Successfully dispatched emails to ${input.recipients.length} recipients.`,
        sentCount: input.recipients.length,
      };
      
      console.log(`[Flow: sendBulkEmailFlow] Successfully completed.`, result);
      return result;

    } catch (error) {
      console.error(`[Flow: sendBulkEmailFlow] Failed to send emails:`, error);
      // Re-throwing the error to make the client-side aware of the failure.
      // The client's `catch` block will handle this.
      throw new Error((error as Error).message || 'An unknown error occurred while sending emails.');
    }
  }
);
