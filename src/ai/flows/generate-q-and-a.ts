
'use server';
/**
 * @fileOverview Scans a job description for explicit questions and generates answers based on a user's work repository.
 *
 * - generateQAndA - A function that handles the Q&A generation process.
 * - QAndAInput - The input type for the generateQAndA function.
 * - QAndAOutput - The return type for the generateQAndA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { QAndAOutputSchema } from '@/lib/schemas';
import type { QAndAOutput } from '@/lib/schemas';

const QAndAInputSchema = z.object({
  jobDescription: z.string().describe('The job description to provide context for answers.'),
  workRepository: z.string().describe("The user's work repository to source answers from."),
  questions: z.string().describe('A list of specific questions from the user to answer.'),
});
export type QAndAInput = z.infer<typeof QAndAInputSchema>;


export async function generateQAndA(input: QAndAInput): Promise<QAndAOutput> {
  return generateQAndAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQAndAPrompt',
  input: {schema: QAndAInputSchema},
  output: {schema: QAndAOutputSchema},
  prompt: `You are an expert at answering job application questions based on a user's professional background.
Your task is to answer the list of "Questions to Answer" using the provided "User Work Repository" for information and the "Job Description" for context.

**Crucially, you must only use information explicitly present in the User Work Repository. Do not invent, exaggerate, or infer details that are not mentioned. All answers must be truthful to the provided repository.**

For each question, provide a clear and concise answer.
**If you cannot find the answer to a specific question in the user's work repository, you MUST return the exact string '[Answer not found in repository]' for that answer.**

Job Description:
{{{jobDescription}}}

User Work Repository:
{{{workRepository}}}

Questions to Answer:
{{{questions}}}

Provide the answers now in the requested format.`,
});

const generateQAndAFlow = ai.defineFlow(
  {
    name: 'generateQAndAFlow',
    inputSchema: QAndAInputSchema,
    outputSchema: QAndAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
