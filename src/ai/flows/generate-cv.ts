
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

const WorkExperienceSchema = z.object({
    jobTitle: z.string().describe("The user's job title."),
    company: z.string().describe("The company where the user worked."),
    duration: z.string().describe("The dates or duration of employment (e.g., '2020 - Present' or 'Jan 2022 - Dec 2023')."),
    responsibilities: z.array(z.string()).describe("A list of key responsibilities and achievements, phrased as bullet points."),
});

const EducationSchema = z.object({
    degree: z.string().describe("The degree or certification obtained."),
    institution: z.string().describe("The name of the university or institution."),
    year: z.string().optional().describe("The year of graduation or completion."),
});

const CvOutputSchema = z.object({
    fullName: z.string().describe("The user's full name, extracted from the bio."),
    email: z.string().describe("The user's email address, extracted from the bio."),
    phone: z.string().describe("The user's phone number, extracted from the bio."),
    location: z.string().describe("The user's location (e.g., 'City, State'), extracted from the bio."),
    summary: z.string().describe("A 2-4 sentence professional summary, tailored to the job description."),
    workExperience: z.array(WorkExperienceSchema).describe("A list of the user's professional roles."),
    education: z.array(EducationSchema).describe("A list of the user's educational qualifications."),
    skills: z.array(z.string()).describe("A list of key skills relevant to the job description."),
});
export type CvOutput = z.infer<typeof CvOutputSchema>;


export async function generateCv(input: CvInput): Promise<CvOutput> {
  return generateCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCvPrompt',
  input: {schema: CvInputSchema},
  output: {schema: CvOutputSchema},
  prompt: `You are an expert CV writer. Your task is to analyze a user's bio and a job description, then generate a complete, professional CV in a structured format.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent or exaggerate details. If contact information like email, phone, or location is not present, return an empty string for those fields.**

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

