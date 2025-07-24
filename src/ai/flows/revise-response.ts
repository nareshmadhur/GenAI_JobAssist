'use server';
/**
 * @fileOverview Revises an existing AI-generated job application response based on user feedback.
 *
 * - reviseResponse - A function that handles the response revision process.
 * - ReviseResponseInput - The input type for the reviseResponse function (from schemas).
 * - ReviseResponseOutput - The return type for the reviseResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  QAndAOutputSchema,
  ResponseSchema,
  ReviseResponseSchema,
  type ReviseResponseData,
  type ReviseResponseOutput,
} from '@/lib/schemas';

export async function reviseResponse(
  input: ReviseResponseData
): Promise<ReviseResponseOutput> {
  return reviseResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseResponsePrompt',
  input: { schema: ReviseResponseSchema },
  // The output schema will be dynamically determined inside the flow.
  prompt: `You are a professional editor. A previous response was generated for a user based on their bio and a job description. The user has provided feedback for revision.

Your task is to revise the "Original Response" based on the "User's Revision Comments". You MUST maintain the original context from the Job Description and User Bio.

The type of content to revise is: '{{generationType}}'.

**CRITICAL INSTRUCTIONS:**
- If 'generationType' is 'qAndA', the "Original Response" is a JSON object. You MUST return ONLY a valid, complete JSON object that satisfies the provided output schema for Q&A pairs. Do NOT add any explanatory text, markdown formatting, or anything else outside of the raw JSON object itself.
- If 'generationType' is 'coverLetter', the "Original Response" is Markdown text. You MUST return ONLY the revised Markdown text, wrapped in a JSON object with a 'responses' key. Use professional language and Markdown formatting, especially **bolding** for emphasis.

Job Description (for context):
{{{jobDescription}}}

User Bio (for context):
{{{bio}}}

Original Response (to be revised):
{{{originalResponse}}}

User's Revision Comments:
"{{{revisionComments}}}"

Generate ONLY the new, revised response now in the correct format as instructed.`,
});

const reviseResponseFlow = ai.defineFlow(
  {
    name: 'reviseResponseFlow',
    inputSchema: ReviseResponseSchema,
    // The output schema is now a union of a cover letter string or the Q&A schema.
    outputSchema: z.union([QAndAOutputSchema, ResponseSchema]),
  },
  async (input) => {
    // We explicitly tell the model what format to output based on the generation type.
    const { output } = await prompt(input, {
      output: {
        schema:
          input.generationType === 'qAndA'
            ? QAndAOutputSchema
            : ResponseSchema,
      },
    });

    return output!;
  }
);
