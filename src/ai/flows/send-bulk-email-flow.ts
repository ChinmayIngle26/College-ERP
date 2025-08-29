
'use server';
/**
 * @fileOverview A Genkit flow for sending bulk email notifications.
 *
 * This flow is designed to be called by an admin panel to send
 * notifications to a list of recipients. It uses the `email-service`
 * to dispatch the emails.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/services/email-service';

// Define the input schema for the flow
export const SendBulkEmailInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The HTML or plain text body of the email.'),
  recipients: z.array(z.string().email()).describe('A list of recipient email addresses.'),
});
export type SendBulkEmailInput = z.infer<typeof SendBulkEmailInputSchema>;

// Define the output schema for the flow
export const SendBulkEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email dispatch process was initiated successfully.'),
  message: z.string().describe('A summary message of the operation.'),
  sentCount: z.number().describe('The number of recipients the email was sent to.'),
});
export type SendBulkEmailOutput = z.infer<typeof SendBulkEmailOutputSchema>;


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
