
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
  jobDescription: z.string().describe('The job description to scan for questions.'),
  userBio: z.string().describe("The user's bio to source answers from."),
  questions: z.string().optional().describe('A list of specific questions from the user to answer.'),
});
export type QAndAInput = z.infer<typeof QAndAInputSchema>;


export async function generateQAndA(input: QAndAInput): Promise<QAndAOutput> {
  return generateQAndAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQAndAPrompt',
  input: {schema: QAndAInputSchema},
  output: {schema: QAndAOutputSchema},
  prompt: `You are an expert at parsing job applications and providing insightful answers. Your task is to answer questions based on the provided user bio and job description.

**CRITICAL RULE: Prioritize answering the explicit questions provided by the user. If no explicit questions are provided, scan the job description for any questions (e.g., text ending with a '?' or phrased as an interrogative).**

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned. All answers must be truthful to the provided bio and relevant to the job description.**

If no questions are found (either from the user or the job description), set 'questionsFound' to false and leave 'qaPairs' as an empty array.
If questions are found, set 'questionsFound' to true. For each question, provide a clear and concise answer.
**If you cannot find the answer to a specific question in the user's bio, you MUST return the exact string '[Answer not found in bio]' for that answer.**

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

{{#if questions}}
Explicit Questions from User:
{{{questions}}}
{{/if}}

Scan for questions and provide the answers now.`,
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
