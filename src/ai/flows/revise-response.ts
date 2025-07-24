
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
import { ReviseResponseSchema, type QAndAOutput } from '@/lib/schemas';

// Input and output types are imported from the central schemas file
export type ReviseResponseInput = z.infer<typeof ReviseResponseSchema>;
export type ReviseResponseOutput = { responses: string };

export async function reviseResponse(input: ReviseResponseInput): Promise<ReviseResponseOutput> {
  const result = await reviseResponseFlow(input);
  return { responses: result };
}

const prompt = ai.definePrompt({
  name: 'reviseResponsePrompt',
  input: {schema: ReviseResponseSchema},
  // The output schema for revision is now a raw string.
  output: {schema: z.string()},
  prompt: `You are a professional editor. A previous response was generated for a user based on their bio and a job description. The user has provided feedback for revision.

Your task is to revise the "Original Response" based on the "User's Revision Comments". You MUST maintain the original context from the Job Description and User Bio.

The type of content to revise is: '{{generationType}}'.

**CRITICAL INSTRUCTIONS:**
- If 'generationType' is 'qAndA', the "Original Response" is a JSON object. You MUST return ONLY a valid JSON string representing the revised Q&A object. Do NOT add any explanatory text, markdown formatting, or anything else outside of the raw JSON string itself.
- If 'generationType' is 'coverLetter', the "Original Response" is a Markdown text. You MUST return ONLY the revised Markdown text. Use professional language and Markdown formatting, especially **bolding** for emphasis.

Job Description (for context):
{{{jobDescription}}}

User Bio (for context):
{{{bio}}}

Original Response (to be revised):
{{{originalResponse}}}

User's Revision Comments:
"{{{revisionComments}}}"

Generate ONLY the new, revised response now.`,
});

const reviseResponseFlow = ai.defineFlow(
  {
    name: 'reviseResponseFlow',
    inputSchema: ReviseResponseSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
