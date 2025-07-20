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
  prompt: `You are a professional resume and cover letter writer. Your task is to generate a structured, professional, and copy-paste-ready response based on a job description and a user's bio.

Your response should be concise and impactful, focusing only on the most effective and strong points. Use Markdown for formatting, specifically **bolding** to highlight key skills, experiences, and qualifications that directly align with the most important requirements in the job description. Avoid lengthy and redundant sentences.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the response now.`,
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
