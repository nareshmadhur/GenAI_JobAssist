
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
import { generateQAndA } from './generate-q-and-a';
import { QAndAOutputSchema } from '@/lib/schemas';
import type { QAndAOutput } from '@/lib/schemas';

const DeepAnalysisInputSchema = z.object({
  jobDescription: z.string().describe('The job description to analyze.'),
  userBio: z.string().describe("The user's detailed bio."),
});
export type DeepAnalysisInput = z.infer<typeof DeepAnalysisInputSchema>;

const RequirementSchema = z.object({
  requirement: z.string().describe('The specific requirement extracted from the job description.'),
  isMet: z.boolean().describe('A boolean indicating if the requirement is met by the user\'s bio.'),
});

const DeepAnalysisOutputSchema = z.object({
  jobSummary: z.string().describe("A professional summary of the job description, abstracting jargon and focusing on key takeaways, with important elements bolded. If relevant, it may also include comments on the job description's structure, language, and tone."),
  mustHaves: z.array(RequirementSchema).describe("A list of 'must-have' or essential requirements from the job description and whether they are met."),
  preferred: z.array(RequirementSchema).describe("A list of 'preferred' or 'nice-to-have' qualifications from the job description and whether they are met."),
  improvementAreas: z.array(z.string()).describe("A list of specific bullet points providing areas where the user's bio could be improved for this role. Each bullet point MUST start with a bolded category (e.g., '**Quantify Achievements:** ...')."),
  qAndA: QAndAOutputSchema.optional().describe("An optional section with questions found in the job description and their answers."),
});

export type DeepAnalysisOutput = z.infer<typeof DeepAnalysisOutputSchema>;

export async function generateDeepAnalysis(input: DeepAnalysisInput): Promise<DeepAnalysisOutput> {
  return generateDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepAnalysisPrompt',
  input: {schema: DeepAnalysisInputSchema},
  output: {schema: DeepAnalysisOutputSchema.omit({qAndA: true})},
  prompt: `You are an expert career coach. Your task is to perform a deep analysis comparing a user's bio against a job description.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned.** All analysis must be grounded in the provided texts.

First, act as a professional in the field and write a concise summary of the role. Abstract away jargon and focus on core responsibilities. **Bold** key phrases. Note anything about the language or tone that might imply company culture.

Next, analyze the job description to identify "must-have" (essential, required) and "preferred" (nice-to-have, bonus) qualifications. For each requirement you identify, check if it is clearly met in the user's bio and set the 'isMet' flag to true or false.

Then, generate a list of actionable advice on how to **better present** the information that is already in the bio. This is about enhancing the existing content, not pointing out what's missing. Every bullet point for Improvement Areas MUST begin with a concise, bolded category and then a colon. Example: **Quantify Achievements:** Consider adding metrics...

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
  async (input) => {
    // Run deep analysis and Q&A generation in parallel
    const [analysisResponse, qAndAResponse] = await Promise.all([
        prompt(input),
        generateQAndA({ jobDescription: input.jobDescription, userBio: input.userBio, questions: '' })
    ]);

    const finalOutput: DeepAnalysisOutput = {
        ...analysisResponse.output!,
    };

    if (qAndAResponse.qaPairs.length > 0) {
        finalOutput.qAndA = qAndAResponse;
    }

    return finalOutput;
  }
);
