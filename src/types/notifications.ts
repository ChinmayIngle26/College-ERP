
import { z } from 'zod';

// Define the input schema for the sendBulkEmail flow
export const SendBulkEmailInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The HTML or plain text body of the email.'),
  recipients: z.array(z.string().email()).describe('A list of recipient email addresses.'),
});
export type SendBulkEmailInput = z.infer<typeof SendBulkEmailInputSchema>;


// Define the output schema for the sendBulkEmail flow
export const SendBulkEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email dispatch process was initiated successfully.'),
  message: z.string().describe('A summary message of the operation.'),
  sentCount: z.number().describe('The number of recipients the email was sent to.'),
});
export type SendBulkEmailOutput = z.infer<typeof SendBulkEmailOutputSchema>;
