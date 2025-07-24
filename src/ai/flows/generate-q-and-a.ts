
'use server';
/**
 * @fileOverview Scans a job description for explicit questions and generates answers based on a user's bio.
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
  userBio: z.string().describe("The user's bio to source answers from."),
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
Your task is to answer the list of "Questions to Answer" using the provided "User Bio" for information and the "Job Description" for context.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned. All answers must be truthful to the provided bio.**

For each question, provide a clear and concise answer.
**If you cannot find the answer to a specific question in the user's bio, you MUST return the exact string '[Answer not found in bio]' for that answer.**

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

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
