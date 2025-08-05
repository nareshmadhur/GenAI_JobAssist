
'use server';
/**
 * @fileOverview Generates a structured CV from a user's bio, tailored to a job description.
 *
 * - generateCv - A function that handles the CV generation.
 * - CvInput - The input type for the generateCv function.
 * - CvOutput - The return type for the generateCv function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CvOutput } from '@/lib/schemas';
import { CvOutputSchema } from '@/lib/schemas';


const CvInputSchema = z.object({
  jobDescription: z.string().describe('The job description to tailor the CV for.'),
  userBio: z.string().describe("The user's detailed bio, containing work experience, skills, projects, and education."),
});
export type CvInput = z.infer<typeof CvInputSchema>;

export async function generateCv(input: CvInput): Promise<CvOutput> {
  return generateCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCvPrompt',
  input: {schema: CvInputSchema},
  output: {schema: CvOutputSchema},
  prompt: `You are an expert CV writer. Your task is to analyze a user's bio and a job description, then generate a complete, professional CV in a structured format.

**CRITICAL INSTRUCTIONS:**
- You must ONLY use information explicitly present in the User Bio. Do not invent, infer, or exaggerate details.
- If any piece of information cannot be found in the bio (including names, contact details, job titles, companies, durations, etc.), you MUST return one of the placeholders as described in the output schema.
- For a missing full name, use '[Name not found in bio]'.
- For ALL other missing fields (email, phone, location, job title, company, summary, etc.), use the exact string '[Information not found in bio]'.
- DO NOT use words like "Unknown" or "N/A". Only use the specified placeholders.

Based on the user's bio and the job description, generate the following sections:

1.  **Contact Info**: Extract the user's full name, email, phone number, and location.
2.  **Summary**: Write a powerful, 2-4 sentence professional summary that highlights the user's most relevant qualifications for the target job.
3.  **Work Experience**: For each job mentioned in the bio, extract the job title, company, duration of employment, and create a list of 3-5 bullet points describing key responsibilities and achievements. Tailor the language to match keywords from the job description.
4.  **Education**: Extract all educational qualifications, including degree, institution, and year of graduation.
5.  **Skills**: Create a list of the most relevant technical and soft skills from the user's bio that align with the job description.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the structured CV now.`,
});

const generateCvFlow = ai.defineFlow(
  {
    name: 'generateCvFlow',
    inputSchema: CvInputSchema,
    outputSchema: CvOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
