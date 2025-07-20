'use server';

/**
 * @fileOverview Analyzes a user's bio and job description to filter and rank relevant information.
 *
 * - filterBioInformation - A function that handles the bio filtering process.
 * - FilterBioInformationInput - The input type for the filterBioInformation function.
 * - FilterBioInformationOutput - The return type for the filterBioInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterBioInformationInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description, either as a URL or pasted text.'),
  bio: z.string().describe('The user\s detailed bio.'),
});
export type FilterBioInformationInput = z.infer<
  typeof FilterBioInformationInputSchema
>;

const FilterBioInformationOutputSchema = z.object({
  filteredBio: z
    .string()
    .describe('The user\s bio, filtered to include only the most relevant information for the job description.'),
  relevantInterests: z
    .string()
    .describe('A summary of the most relevant interests of the employer, as inferred from the job description.'),
});
export type FilterBioInformationOutput = z.infer<
  typeof FilterBioInformationOutputSchema
>;

export async function filterBioInformation(
  input: FilterBioInformationInput
): Promise<FilterBioInformationOutput> {
  return filterBioInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterBioInformationPrompt',
  input: {schema: FilterBioInformationInputSchema},
  output: {schema: FilterBioInformationOutputSchema},
  prompt: `You are an expert career advisor. Your task is to analyze a job description and a user's bio, and then filter the bio to only include the most relevant information for the job description.

Job Description: {{{jobDescription}}}

User Bio: {{{bio}}}

First, summarize the most relevant interests and priorities of the employer based on the job description.  Pay attention to the tone, structure, and layout of the job description.  Identify repeated phrases, keywords, and any inferred values of the company.

Then, filter the user's bio to only include the information that is most relevant to the job description. Rephrase the user's bio to match the tone and style of the job description, without fabricating any information.

Return the filtered bio and the summary of the employer's interests in a structured format.

Output:
Relevant Interests: {{output.relevantInterests}}
Filtered Bio: {{output.filteredBio}}`,
});

const filterBioInformationFlow = ai.defineFlow(
  {
    name: 'filterBioInformationFlow',
    inputSchema: FilterBioInformationInputSchema,
    outputSchema: FilterBioInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
