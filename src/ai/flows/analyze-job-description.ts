'use server';

/**
 * @fileOverview Analyzes a job description and user bio to find matches and gaps.
 *
 * - analyzeJobDescription - A function that handles the job description and bio analysis process.
 * - AnalyzeJobDescriptionInput - The input type for the analyzeJobdescription function.
 * - AnalyzeJobDescriptionOutput - The return type for the analyzeJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJobDescriptionInputSchema = z.object({
  jobDescription: z.string().describe('The job description to analyze, either a URL or the text content.'),
  bio: z.string().describe("The user's bio to compare against the job description."),
});
export type AnalyzeJobDescriptionInput = z.infer<typeof AnalyzeJobDescriptionInputSchema>;

const AnalyzeJobDescriptionOutputSchema = z.object({
  matches: z.array(z.string()).describe("A list of simple bullet points where the user's bio matches the job requirements. Use markdown bolding for key phrases."),
  gaps: z.array(z.string()).describe("A list of simple bullet points where the user's bio has gaps when compared to the job requirements. Use markdown bolding for key phrases."),
});
export type AnalyzeJobDescriptionOutput = z.infer<typeof AnalyzeJobDescriptionOutputSchema>;

export async function analyzeJobDescription(input: AnalyzeJobDescriptionInput): Promise<AnalyzeJobDescriptionOutput> {
  return analyzeJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeJobDescriptionPrompt',
  input: {schema: AnalyzeJobDescriptionInputSchema},
  output: {schema: AnalyzeJobDescriptionOutputSchema},
  prompt: `You are an expert career advisor. Analyze the following job description and user's bio.
Your task is to identify where the user's experience matches the job requirements and where there are gaps.
Present your findings as two distinct lists of simple, clear bullet points. **Bold** important keywords or phrases.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned, such as specific years of experience.**

Job Description:
{{{jobDescription}}}

User Bio:
{{{bio}}}

Analysis:
1.  **Matches**: Create a bulleted list of specific skills, experiences, or qualifications from the user's bio that directly align with the requirements mentioned in the job description. Be precise and ground every point in the provided bio.
2.  **Gaps**: Create a bulleted list of key requirements from the job description that are not clearly addressed in the user's bio.

Provide only the bulleted lists for matches and gaps.`,
});

const analyzeJobDescriptionFlow = ai.defineFlow(
  {
    name: 'analyzeJobDescriptionFlow',
    inputSchema: AnalyzeJobDescriptionInputSchema,
    outputSchema: AnalyzeJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
