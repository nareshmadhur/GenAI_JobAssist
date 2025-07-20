'use server';
/**
 * @fileOverview Generates a professional cover letter based on a job description and user's bio.
 *
 * - generateCoverLetter - A function that handles the cover letter generation.
 * - CoverLetterInput - The input type for the generateCoverLetter function.
 * - CoverLetterOutput - The return type for the generateCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CoverLetterInputSchema = z.object({
  jobDescription: z.string().describe('The job description, can be a URL or pasted text.'),
  userBio: z.string().describe('The user bio, rich in detail.'),
});
export type CoverLetterInput = z.infer<typeof CoverLetterInputSchema>;

const CoverLetterOutputSchema = z.object({
  responses: z.string().describe('The generated cover letter.'),
});
export type CoverLetterOutput = z.infer<typeof CoverLetterOutputSchema>;

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: {schema: CoverLetterInputSchema},
  output: {schema: CoverLetterOutputSchema},
  prompt: `You are a professional resume and cover letter writer. Your task is to write a compelling, professional, and copy-paste-ready cover letter based on a job description and a user's bio.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned, such as specific years of experience.** The cover letter must be a truthful representation of the user's bio.

The cover letter should be concise and impactful, focusing only on the most effective and strong points from the user's bio that align with the job description.

Use Markdown for formatting, specifically **bolding** to highlight key skills, experiences, and qualifications that directly align with the most important requirements in the job description. Structure the response like a formal letter.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the cover letter now.`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: CoverLetterInputSchema,
    outputSchema: CoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
