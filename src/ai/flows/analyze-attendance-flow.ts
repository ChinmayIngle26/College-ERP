
'use server';
/**
 * @fileOverview A Genkit flow for analyzing student attendance records.
 *
 * This flow takes a list of attendance records and returns an AI-generated analysis,
 * including a summary, key observations, and actionable suggestions for the faculty.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'zod';
import { 
  AttendanceAnalysisInputSchema, 
  AttendanceAnalysisOutputSchema,
  type AttendanceAnalysisInput,
  type AttendanceAnalysisOutput
} from '@/types/attendance-analysis';
import type { LectureAttendanceRecord } from '@/types/lectureAttendance';

/**
 * Analyzes a list of student attendance records and provides an AI-generated analysis.
 * @param records An array of LectureAttendanceRecord objects.
 * @returns A promise that resolves to the AI-generated attendance analysis.
 */
export async function analyzeAttendance(records: LectureAttendanceRecord[]): Promise<AttendanceAnalysisOutput> {
  // Map the full LectureAttendanceRecord objects to the simpler structure expected by the prompt.
  const analysisInput: AttendanceAnalysisInput = records.map(r => ({
    date: r.date,
    studentName: r.studentName,
    status: r.status,
  }));
  
  return analyzeAttendanceFlow(analysisInput);
}

// Define the Genkit prompt for attendance analysis.
const attendanceAnalysisPrompt = ai.definePrompt({
  name: 'attendanceAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AttendanceAnalysisInputSchema },
  output: { schema: AttendanceAnalysisOutputSchema },
  prompt: `You are an expert academic data analyst. You are tasked with analyzing a set of attendance records for a classroom over a specific period. Your goal is to provide insightful and actionable feedback to the faculty member.

Based on the records provided below, generate a concise analysis.

- **Overall Summary**: Provide a brief, high-level summary of the attendance. Mention the overall percentage if possible and the general trend.
- **Key Observations**: Identify specific, noteworthy patterns. Examples:
    - "Student X has been consistently absent on Mondays."
    - "Attendance was unusually low on [Date], which might correlate with an event or holiday."
    - "Student Y has perfect attendance."
    - "A group of students (A, B, C) are often absent together."
- **Actionable Suggestions**: Provide a few concrete, supportive suggestions for the faculty member. Examples:
    - "Consider reaching out to students with attendance below 70% to offer support."
    - "A quick poll could help understand the reason for low attendance on specific days."
    - "Acknowledge students with excellent attendance to encourage them."

Keep the tone professional, data-driven, and supportive. Do not invent data. Base your analysis strictly on the provided records.

Here are the attendance records:
{{#each .}}
- Date: {{date}}, Student: {{studentName}}, Status: {{status}}
{{/each}}
`,
});

// Define the Genkit flow.
const analyzeAttendanceFlow = ai.defineFlow(
  {
    name: 'analyzeAttendanceFlow',
    inputSchema: AttendanceAnalysisInputSchema,
    outputSchema: AttendanceAnalysisOutputSchema,
  },
  async (input) => {
    // If there are no records, return a default empty state.
    if (input.length === 0) {
        return {
            overallSummary: "No attendance records were provided for analysis.",
            keyObservations: [],
            actionableSuggestions: [],
        };
    }
    
    try {
      const { output } = await attendanceAnalysisPrompt(input);
      
      if (!output) {
          throw new Error("The AI model did not return a valid analysis for attendance.");
      }
      
      return output;
    } catch (error) {
      console.error("[analyzeAttendanceFlow] Genkit prompt failed:", error);
      // Return a default structure on error to prevent the client from crashing.
      return {
        overallSummary: "AI analysis for attendance is currently unavailable. Please check the API key or try again later.",
        keyObservations: [],
        actionableSuggestions: [],
      };
    }
  }
);
