'use server';
/**
 * @fileOverview Generates structured, professional responses to job requirements using a user's bio,
 * additional comments, and AI reasoning, tailored to match the tone and style of the job description.
 *
 * - generateResponse - A function that generates the job responses.
 * - GenerateResponseInput - The input type for the generateResponse function.
 * - GenerateResponseOutput - The return type for the generateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResponseInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description, can be a URL or pasted text.'),
  userBio: z.string().describe('The user bio, rich in detail.'),
  additionalComments: z
    .string()
    .describe('Additional comments to consider in the response.'),
});
export type GenerateResponseInput = z.infer<typeof GenerateResponseInputSchema>;

const GenerateResponseOutputSchema = z.object({
  responses: z.string().describe('Generated responses to job requirements.'),
});
export type GenerateResponseOutput = z.infer<typeof GenerateResponseOutputSchema>;

export async function generateResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  return generateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResponsePrompt',
  input: {schema: GenerateResponseInputSchema},
  output: {schema: GenerateResponseOutputSchema},
  prompt: `You are a professional resume and cover letter writer.

  Based on the job description and user bio, you will generate a structured, professional, and copy-paste-ready response. This response should highlight the user's strengths as they relate to the job description.
  Make sure to tailor the responses to match the tone and style of the job description.

  Job Description:
{{{jobDescription}}}

  User Bio:
{{{userBio}}}

  Response:`,
});

const generateResponseFlow = ai.defineFlow(
  {
    name: 'generateResponseFlow',
    inputSchema: GenerateResponseInputSchema,
    outputSchema: GenerateResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
