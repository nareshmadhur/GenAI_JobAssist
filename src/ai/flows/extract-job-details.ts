'use server';

/**
 * @fileOverview Extracts structured details from a job description text.
 *
 * - extractJobDetails - A function that extracts the company name and job title.
 * - JobDetailsInput - The input type for the extractJobDetails function.
 * - JobDetailsOutput - The return type for the extractJobDetails function.
 */

import {ai} from '@/ai/genkit';
import { JobDetailsInputSchema, JobDetailsOutputSchema } from '@/lib/schemas';
import type { JobDetailsInput, JobDetailsOutput } from '@/lib/schemas';


export async function extractJobDetails(input: JobDetailsInput): Promise<JobDetailsOutput> {
  return extractJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractJobDetailsPrompt',
  input: {schema: JobDetailsInputSchema},
  output: {schema: JobDetailsOutputSchema},
  prompt: `Analyze the following job description and extract:
1. The company name
2. The specific job title
3. Any specific application questions, "Why us?" prompts, or personal statement requirements explicitly mentioned in the text.

Job Description:
{{{jobDescription}}}

Extract the company name, job title, and any questions now.`,
});

const extractJobDetailsFlow = ai.defineFlow(
  {
    name: 'extractJobDetailsFlow',
    inputSchema: JobDetailsInputSchema,
    outputSchema: JobDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
