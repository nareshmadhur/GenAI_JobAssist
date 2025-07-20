
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

const AnalysisDetailSchema = z.object({
  details: z.array(z.string()).describe("A list of specific bullet points providing evidence or suggestions. Each bullet point MUST start with a bolded category (e.g., '**Experience Match:** ...' or '**Missing Skill:** ...')."),
});

const DeepAnalysisOutputSchema = z.object({
  overallAlignment: z.object({
      score: z.string().describe('A percentage score (e.g., "85% Match").'),
      justification: z.string().describe("A brief justification for the score."),
  }),
  keyStrengths: AnalysisDetailSchema.describe("An analysis of the user's key strengths against the job description."),
  gaps: AnalysisDetailSchema.describe("An analysis of the gaps between the user's bio and the job description."),
  improvementAreas: AnalysisDetailSchema.describe("An analysis of areas where the user's bio could be improved for this role."),
  languageAndTone: z.object({
    analysis: z.string().describe("An analysis of the job description's tone."),
    suggestion: z.string().describe("A suggestion for adjusting the user's application to match the tone.")
  }).describe("An assessment of language and tone.")
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

For each section (Key Strengths, Gaps, Improvement Areas), provide a list of detailed bullet points. For strengths, the bullet points should cite evidence from the bio. For gaps, identify missing requirements. For improvements, the bullet points should offer concrete, actionable suggestions.

**IMPORTANT FORMATTING RULE**: Every single bullet point you generate for Key Strengths, Gaps, and Improvement Areas MUST begin with a concise, bolded category followed by a colon. For example:
- **Experience Match:** Your background in project management aligns well with the stated requirement.
- **Missing Skill:** The job description asks for Python experience, which is not mentioned in your bio.
- **Actionable Advice:** Consider adding a section to your bio highlighting your data analysis projects.

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
