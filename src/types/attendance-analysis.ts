
import { z } from 'zod';

/**
 * Defines the simplified input structure for the attendance analysis AI flow.
 * We only need basic details for the prompt.
 */
export const AttendanceAnalysisInputSchema = z.array(z.object({
  date: z.string().describe('The date of the lecture in YYYY-MM-DD format.'),
  studentName: z.string().describe('The name of the student.'),
  status: z.enum(['present', 'absent']).describe("The student's attendance status."),
}));
export type AttendanceAnalysisInput = z.infer<typeof AttendanceAnalysisInputSchema>;

/**
 * Defines the structured output expected from the attendance analysis AI flow.
 */
export const AttendanceAnalysisOutputSchema = z.object({
  overallSummary: z.string().describe("A brief, encouraging overall summary of the classroom's attendance for the period."),
  keyObservations: z.array(z.string()).describe('A list of specific, data-driven observations about attendance patterns (e.g., individual student habits, day-specific trends).'),
  actionableSuggestions: z.array(z.string()).describe('A list of concrete, supportive suggestions for the faculty to act upon based on the analysis.'),
});
export type AttendanceAnalysisOutput = z.infer<typeof AttendanceAnalysisOutputSchema>;
