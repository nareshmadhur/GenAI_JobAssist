
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

const RequirementSchema = z.object({
  requirement: z
    .string()
    .describe('A concise summary of the specific requirement extracted from the job description.'),
  category: z
    .string()
    .describe(
      "The category of the requirement (e.g., 'Experience', 'Education', 'Skills', 'Certification')."
    ),
  isMandatory: z
    .boolean()
    .describe(
      'A boolean indicating if the requirement is mandatory (must-have) or preferred (nice-to-have).'
    ),
  isMet: z
    .boolean()
    .describe("A boolean indicating if the requirement is met by the user's bio."),
  justification: z
    .string()
    .describe(
      "A brief justification for why the requirement is marked as met or not met, citing evidence from the user's bio or lack thereof."
    ),
});

const DeepAnalysisOutputSchema = z.object({
  jobSummary: z
    .string()
    .describe(
      "A professional summary of the job description, abstracting jargon and focusing on key takeaways, with important elements bolded. If relevant, it may also include comments on the job description's structure, language, and tone."
    ),
  requirements: z
    .array(RequirementSchema)
    .describe(
      'A consolidated list of all requirements (both mandatory and preferred) from the job description.'
    ),
  improvementAreas: z
    .array(z.string())
    .describe(
      "A list of specific bullet points providing areas where the user's bio could be improved for this role. Each bullet point MUST start with a bolded category (e.g., '**Quantify Achievements:** ...')."
    ),
});

export type DeepAnalysisOutput = z.infer<typeof DeepAnalysisOutputSchema>;

export async function generateDeepAnalysis(
  input: DeepAnalysisInput
): Promise<DeepAnalysisOutput> {
  return generateDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepAnalysisPrompt',
  input: {schema: DeepAnalysisInputSchema},
  output: {schema: DeepAnalysisOutputSchema},
  prompt: `You are an expert career coach. Your task is to perform a deep analysis comparing a user's bio against a job description.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned.** All analysis must be grounded in the provided texts.

1.  **Job Summary**: Act as a professional in the field and write a concise summary of the role. Abstract away jargon and focus on core responsibilities. **Bold** key phrases. Note anything about the language or tone that might imply company culture.

2.  **Consolidated Requirements**: Analyze the job description to identify all requirements. For each one, create an object with the following fields:
    *   \`requirement\`: The specific requirement, summarized concisely.
    *   \`category\`: Classify it (e.g., 'Experience', 'Education', 'Skills', 'Certification').
    *   \`isMandatory\`: Set to \`true\` if it's a "must-have" or "required", and \`false\` if it's "preferred" or "nice-to-have".
    *   \`isMet\`: Check if the requirement is clearly met in the user's bio and set to \`true\` or \`false\`.
    *   \`justification\`: Briefly explain *why* it's met or not met, referencing the user's bio.

3.  **Improvement Areas**: Generate a list of actionable advice on how to **better present** the information that is already in the bio. This is about enhancing existing content. Every bullet point MUST begin with a concise, bolded category and then a colon. Example: **Quantify Achievements:** Consider adding metrics...

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Generate the deep analysis now in the structured format requested.`,
});

const generateDeepAnalysisFlow = ai.defineFlow(
  {
    name: 'generateDeepAnalysisFlow',
    inputSchema: DeepAnalysisInputSchema,
    outputSchema: DeepAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
