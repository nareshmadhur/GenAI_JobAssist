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

const DeepAnalysisInputSchema = z.object({
  jobDescription: z.string().describe('The job description to analyze.'),
  userBio: z.string().describe("The user's detailed bio."),
});
export type DeepAnalysisInput = z.infer<typeof DeepAnalysisInputSchema>;

const DeepAnalysisOutputSchema = z.object({
  responses: z.string().describe('The detailed analysis in Markdown format.'),
});
export type DeepAnalysisOutput = z.infer<typeof DeepAnalysisOutputSchema>;

export async function generateDeepAnalysis(input: DeepAnalysisInput): Promise<DeepAnalysisOutput> {
  return generateDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepAnalysisPrompt',
  input: {schema: DeepAnalysisInputSchema},
  output: {schema: DeepAnalysisOutputSchema},
  prompt: `You are an expert career coach and talent acquisition specialist. Your task is to perform a deep, insightful analysis comparing a user's bio against a job description. Provide actionable feedback.

Your analysis must be structured in Markdown and include the following sections:

### Overall Alignment Score
Provide a percentage score (e.g., 85% Match) and a brief justification for it based on the comparison.

### Key Strengths Analysis
- Identify the top 3-5 strongest alignments between the user's bio and the job description.
- For each strength, quote the specific requirement from the job description and the corresponding evidence from the user's bio. **Bold** the key phrases.

### Opportunity & Gap Analysis
- Identify the most significant gaps or areas where the user's bio is weakest against the job description.
- For each gap, state the requirement clearly.
- Provide concrete, actionable suggestions for how the user could address this gap. For example, suggest specific phrasings, projects to highlight, or skills to acquire.

### Language & Tone Assessment
- Analyze the tone of the job description (e.g., formal, casual, fast-paced).
- Assess whether the user's bio matches this tone.
- Provide suggestions for adjusting the language in the user's bio to better resonate with the company's culture as implied by the job description.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the deep analysis now.`,
});

const generateDeepAnalysisFlow = ai.defineFlow(
  {
    name: 'generateDeepAnalysisFlow',
    inputSchema: DeepAnalysisInputSchema,
    outputSchema: DeepAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
