
'use server';
/**
 * @fileOverview Provides a deep analysis of a user's bio against a job description.
 *
 * - generateDeepAnalysis - A function that handles the deep analysis generation.
 * - DeepAnalysisInput - The input type for the generateDeepAnalysis function.
 * - DeepAnalysisOutput - The return type for the generateDeepAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DeepAnalysisInputSchema = z.object({
  jobDescription: z.string().describe('The job description to analyze.'),
  userBio: z.string().describe("The user's detailed bio."),
});
export type DeepAnalysisInput = z.infer<typeof DeepAnalysisInputSchema>;

const DeepAnalysisOutputSchema = z.object({
  jobSummary: z.string().describe("A professional summary of the job description, abstracting jargon and focusing on key takeaways."),
  keyStrengths: z.array(z.string()).describe("A list of specific bullet points providing evidence for user's key strengths against the job description. Each bullet point MUST start with a bolded category (e.g., '**Experience Match:** ...')."),
  gaps: z.array(z.string()).describe("A list of specific bullet points providing evidence for user's gaps against the job description. Each bullet point MUST start with a bolded category (e.g., '**Missing Skill:** ...')."),
  improvementAreas: z.array(z.string()).describe("A list of specific bullet points providing areas where the user's bio could be improved for this role. Each bullet point MUST start with a bolded category (e.g., '**Actionable Advice:** ...')."),
});

export type DeepAnalysisOutput = z.infer<typeof DeepAnalysisOutputSchema>;

export async function generateDeepAnalysis(input: DeepAnalysisInput): Promise<DeepAnalysisOutput> {
  return generateDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepAnalysisPrompt',
  input: {schema: DeepAnalysisInputSchema},
  output: {schema: DeepAnalysisOutputSchema},
  prompt: `You are an expert career coach and talent acquisition specialist. Your task is to perform a deep, insightful analysis comparing a user's bio against a job description. Provide actionable feedback in a structured format.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned, such as specific years of experience.** All analysis must be grounded in the provided texts.

First, act as a professional in the field of the job description and write a concise summary of the role. Abstract away any corporate jargon and focus on the core responsibilities and what the employer is truly looking for.

Then, generate three distinct sections: Key Strengths, Gaps, and Improvement Areas.

1.  **Key Strengths**: Identify direct matches between the user's bio and the job description. Cite specific evidence from the bio.
    *   Example: **Experience Match:** Your background in project management aligns well with the stated requirement.
2.  **Gaps**: Identify specific requirements from the job description that are clearly **missing** from the user's bio. This is about factual omissions, not style.
    *   Example: **Missing Skill:** The job description asks for Python experience, which is not mentioned in your bio.
3.  **Improvement Areas**: Provide actionable advice on how to **better present** the information that is already in the bio. This is about enhancing the existing content, not pointing out what's missing.
    *   Example: **Actionable Advice:** Consider adding metrics to your project management experience to show impact, such as 'managed a team of 5 and delivered the project 10% under budget'.

**IMPORTANT FORMATTING RULE**: Every single bullet point you generate for Key Strengths, Gaps, and Improvement Areas MUST begin with a concise, bolded category followed by a colon.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the deep analysis now.`,
});

const generateDeepAnalysisFlow = ai.defineFlow(
  {
    name: 'generateDeepAnalysisFlow',
    inputSchema: DeepAnalysisInputSchema,
    outputSchema: DeepAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
