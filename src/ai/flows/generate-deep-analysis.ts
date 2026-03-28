
'use server';
/**
 * @fileOverview Provides a deep analysis of a user's bio against a job description.
 *
 * - generateDeepAnalysis - A function that handles the deep analysis generation.
 * - DeepAnalysisInput - The input type for the generateDeepAnalysis function.
 * - DeepAnalysisOutput - The return type for the generateDeepAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DeepAnalysisOutputSchema, type DeepAnalysisOutput } from '@/lib/schemas';

const DeepAnalysisInputSchema = z.object({
  jobDescription: z.string().describe('The job description to analyze.'),
  workRepository: z.string().describe("The user's detailed work repository."),
});
export type DeepAnalysisInput = z.infer<typeof DeepAnalysisInputSchema>;

export async function generateDeepAnalysis(
  input: DeepAnalysisInput
): Promise<DeepAnalysisOutput> {
  return generateDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepAnalysisPrompt',
  input: {schema: DeepAnalysisInputSchema},
  output: {schema: DeepAnalysisOutputSchema},
  prompt: `You are an expert career coach and talent acquisition specialist. Your task is to perform a high-fidelity deep analysis comparing a user's work repository against a job description.

**Crucially, you must only use information explicitly present in the User's Work Repository. Do not invent, exaggerate, or infer details that are not mentioned.** All analysis must be grounded in the provided texts.

Your output should cover the following sections:

1.  **Match Score**: Assign an overall match score from 0 to 100 based on how well the user's experience matches the mandatory and preferred requirements.

2.  **Job Summary**: Act as a professional in the field and write a concise summary of the role. Abstract away jargon and focus on core responsibilities. **Bold** key phrases. Note anything about the language or tone that might imply company culture.

3.  **Consolidated Requirements**: Analyze the job description to identify all requirements. For each one, evaluate it against the work repository.
    *   \`isMandatory\`: Set to \`true\` ONLY if the text uses explicit keywords like "required", "must have", "essential", or "minimum".
    *   \`isMet\`: Check if the requirement is clearly met in the user's repository.

4.  **Improvement Areas**: Generate a list of actionable advice on how to **better present** the information that is already in the repository. Every bullet point MUST begin with a concise, bolded category and then a colon.

5.  **Coaching Guide**: Provide a strategic "How to Win" guide. This should include:
    *   **Strategic Angle**: How should the user position themselves?
    *   **Gap Management**: How to explain requirements not fully met.
    *   **High-Value Talking Points**: Specific achievements the user should emphasize in an interview.
    *   **Cultural Fit**: How to map their values to the tone of the JD.
    Format this section using Markdown for clarity (headers, bullets, bolding).

Job Description:
{{{jobDescription}}}

User Work Repository:
{{{workRepository}}}

Generate the high-fidelity deep analysis now.`,
});

const generateDeepAnalysisFlow = ai.defineFlow(
  {
    name: 'generateDeepAnalysisFlow',
    inputSchema: DeepAnalysisInputSchema,
    outputSchema: DeepAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
