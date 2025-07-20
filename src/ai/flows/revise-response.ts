'use server';
/**
 * @fileOverview Revises an existing AI-generated job application response based on user feedback.
 *
 * - reviseResponse - A function that handles the response revision process.
 * - ReviseResponseInput - The input type for the reviseResponse function (from schemas).
 * - ReviseResponseOutput - The return type for the reviseResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ReviseResponseSchema, ResponseSchema, type ResponseData } from '@/lib/schemas';

// Input and output types are imported from the central schemas file
export type ReviseResponseInput = z.infer<typeof ReviseResponseSchema>;
export type ReviseResponseOutput = ResponseData;

export async function reviseResponse(input: ReviseResponseInput): Promise<ReviseResponseOutput> {
  return reviseResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseResponsePrompt',
  input: {schema: ReviseResponseSchema},
  output: {schema: ResponseSchema},
  prompt: `You are a professional resume and cover letter writer. A previous response was generated for a user based on their bio and a job description. The user has provided feedback for revision.

Your task is to revise the original response based on the user's comments, while still considering the original job description and user bio for context. The new response should incorporate the feedback seamlessly and maintain a professional tone appropriate for the job application.

Job Description:
{{{jobDescription}}}

User Bio:
{{{bio}}}

Original Response (to be revised):
{{{originalResponse}}}

User's Revision Comments:
"{{{revisionComments}}}"

Generate a new, revised response based on this feedback.
Revised Response:`,
});

const reviseResponseFlow = ai.defineFlow(
  {
    name: 'reviseResponseFlow',
    inputSchema: ReviseResponseSchema,
    outputSchema: ResponseSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
