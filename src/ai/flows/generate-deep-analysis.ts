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
  overallAlignment: z.object({
      score: z.string().describe('A percentage score (e.g., "85% Match").'),
      justification: z.string().describe("A brief justification for the score."),
  }),
  keyStrengths: z.array(z.object({
    requirement: z.string().describe("The requirement from the job description."),
    evidence: z.string().describe("The corresponding evidence from the user's bio.")
  })).describe("A list of the top 3-5 strongest alignments."),
  improvementAreas: z.array(z.object({
    requirement: z.string().describe("The requirement or gap from the job description."),
    suggestion: z.string().describe("A concrete, actionable suggestion for how the user could address this gap.")
  })).describe("A list of the most significant gaps or areas for improvement."),
  languageAndTone: z.object({
    analysis: z.string().describe("An analysis of the job description's tone."),
    suggestion: z.string().describe("A suggestion for adjusting the user's bio to match the tone.")
  }).describe("An assessment of language and tone.")
});

export type DeepAnalysisOutput = z.infer<typeof DeepAnalysisOutputSchema>;

export async function generateDeepAnalysis(input: DeepAnalysisInput): Promise<DeepAnalysisOutput> {
  return generateDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepAnalysisPrompt',
  input: {schema: DeepAnalysisInputSchema},
  output: {schema: DeepAnalysisOutputSchema},
  prompt: `You are an expert career coach and talent acquisition specialist. Your task is to perform a deep, insightful analysis comparing a user's bio against a job description. Provide actionable feedback and output in a structured JSON format.

For each strength, quote the specific requirement from the job description and the corresponding evidence from the user's bio. **Bold** the key phrases.
For each improvement area, state the requirement clearly and provide concrete, actionable suggestions for how the user could address this gap. For example, suggest specific phrasings, projects to highlight, or skills to acquire.

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
