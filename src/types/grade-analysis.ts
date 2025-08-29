
import { z } from 'zod';

// Input schema for the flow, expecting an array of grades.
// We'll pass a simplified structure to the prompt.
export const GradeAnalysisInputSchema = z.array(z.object({
  courseName: z.string(),
  grade: z.string(),
}));
export type GradeAnalysisInput = z.infer<typeof GradeAnalysisInputSchema>;

// Output schema for the structured analysis from the AI.
export const GradeAnalysisOutputSchema = z.object({
  overallSummary: z.string().describe('A brief, encouraging overall summary of the student\'s performance based on the grades.'),
  strengths: z.array(z.string()).describe('A list of subjects or areas where the student is performing well.'),
  areasForImprovement: z.array(z.string()).describe('A list of subjects or areas where the student could focus on improving.'),
});
export type GradeAnalysisOutput = z.infer<typeof GradeAnalysisOutputSchema>;
