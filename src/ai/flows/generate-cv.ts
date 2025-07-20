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

const CvInputSchema = z.object({
  jobDescription: z.string().describe('The job description to tailor the CV for.'),
  userBio: z.string().describe("The user's detailed bio, containing work experience, skills, projects, and education."),
});
export type CvInput = z.infer<typeof CvInputSchema>;

const CvOutputSchema = z.object({
  responses: z.string().describe('The generated CV in Markdown format.'),
});
export type CvOutput = z.infer<typeof CvOutputSchema>;

export async function generateCv(input: CvInput): Promise<CvOutput> {
  return generateCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCvPrompt',
  input: {schema: CvInputSchema},
  output: {schema: CvOutputSchema},
  prompt: `You are an expert CV writer. Your task is to convert a user's bio into a professional, well-structured CV (Curriculum Vitae). The CV should be tailored to the provided job description.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned, such as specific years of experience.** The CV must be a truthful representation of the user's bio.

Analyze the user's bio and extract information to create the following sections in Markdown format:
1.  **Summary**: A brief, 2-3 sentence professional summary that highlights the candidate's key qualifications relevant to the job description.
2.  **Work Experience**: List job titles, companies, and dates. For each role, create 2-3 bullet points describing achievements and responsibilities. **Bold** metrics and skills that directly match the job description.
3.  **Skills**: A bulleted list of technical and soft skills. Prioritize skills mentioned in the job description.
4.  **Projects**: If any are mentioned, list key projects with a brief description.
5.  **Education**: List degrees, institutions, and graduation dates.

The final output should be a single Markdown document.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the CV now.`,
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
