
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
import { ReviseResponseSchema, ResponseSchema, type ResponseData, QAndAOutputSchema } from '@/lib/schemas';

// Input and output types are imported from the central schemas file
export type ReviseResponseInput = z.infer<typeof ReviseResponseSchema>;
export type ReviseResponseOutput = ResponseData;

export async function reviseResponse(input: ReviseResponseInput): Promise<ReviseResponseOutput> {
  return reviseResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseResponsePrompt',
  input: {schema: ReviseResponseSchema},
  // The output schema for revision is just a string, which can be a simple text or a JSON string.
  output: {schema: z.object({ responses: z.string() })},
  prompt: `You are a professional resume and cover letter writer. A previous response was generated for a user. The user has provided feedback for revision.

Your task is to revise the original response based on the user's comments, while still considering the original job description and user bio for context. The new response should incorporate the feedback seamlessly.

The type of content to generate is: {{generationType}}

{{#if (eq generationType 'qAndA')}}
The original response is a JSON object containing questions and answers. You MUST return a valid JSON string representing the revised Q&A object. Do NOT add any explanatory text or formatting outside of the JSON string itself.
{{else}}
It must be concise and impactful. Use Markdown for formatting, specifically **bolding** to highlight key skills and experiences.
{{/if}}

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
