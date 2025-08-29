
'use server';
/**
 * @fileOverview A Genkit flow for analyzing a student's academic grades.
 *
 * This flow takes a list of grades and returns an AI-generated analysis,
 * including a summary, strengths, and areas for improvement.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'zod';
import type { Grade } from '@/types/grades';
import { 
  GradeAnalysisInputSchema, 
  GradeAnalysisOutputSchema,
  type GradeAnalysisInput,
  type GradeAnalysisOutput
} from '@/types/grade-analysis';


/**
 * Analyzes a list of student grades and provides an AI-generated summary.
 * @param grades An array of grade objects.
 * @returns A promise that resolves to the AI-generated analysis.
 */
export async function analyzeGrades(grades: Grade[]): Promise<GradeAnalysisOutput> {
  // Map the full Grade objects to the simpler structure expected by the prompt.
  const analysisInput: GradeAnalysisInput = grades.map(g => ({
    courseName: g.courseName,
    grade: g.grade,
  }));
  
  return analyzeGradesFlow(analysisInput);
}


// Define the Genkit prompt for grade analysis.
const gradeAnalysisPrompt = ai.definePrompt({
  name: 'gradeAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash', // Specify the model to use
  input: { schema: GradeAnalysisInputSchema },
  output: { schema: GradeAnalysisOutputSchema },
  prompt: `You are an encouraging and insightful academic advisor. Analyze the following list of student grades.

Provide a brief, positive summary of their performance. Then, identify their strengths (courses with high grades) and suggest areas where they could improve (courses with lower grades). Keep the tone supportive and motivational.

Here are the grades:
{{#each .}}
- {{courseName}}: {{grade}}
{{/each}}
`,
});


// Define the Genkit flow.
const analyzeGradesFlow = ai.defineFlow(
  {
    name: 'analyzeGradesFlow',
    inputSchema: GradeAnalysisInputSchema,
    outputSchema: GradeAnalysisOutputSchema,
  },
  async (input) => {
    // If there are no grades, return a default empty state.
    if (input.length === 0) {
        return {
            overallSummary: "No grades are available yet to analyze. Keep up the good work and your grades will appear here as they are entered!",
            strengths: [],
            areasForImprovement: [],
        };
    }
    
    try {
      const { output } = await gradeAnalysisPrompt(input);
      
      if (!output) {
          throw new Error("The AI model did not return a valid analysis. Please try again.");
      }
      
      return output;
    } catch (error) {
      console.error("[analyzeGradesFlow] Genkit prompt failed:", error);
      // Return a default structure on error to prevent the client from crashing.
      return {
        overallSummary: "AI analysis is currently unavailable. Please check your API key or try again later.",
        strengths: [],
        areasForImprovement: [],
      };
    }
  }
);
