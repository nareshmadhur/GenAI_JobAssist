
'use server';
/**
 * @fileOverview Analyzes a user's professional bio for completeness.
 *
 * - analyzeBioCompleteness - A function that checks for key sections in a bio.
 * - BioCompletenessInput - The input type for the function.
 * - BioCompletenessOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  BioCompletenessInputSchema,
  BioCompletenessOutputSchema,
} from '@/lib/schemas';
import type {
  BioCompletenessInput,
  BioCompletenessOutput,
} from '@/lib/schemas';

export async function analyzeBioCompleteness(
  input: BioCompletenessInput
): Promise<BioCompletenessOutput> {
  return analyzeBioCompletenessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBioCompletenessPrompt',
  input: { schema: BioCompletenessInputSchema },
  output: { schema: BioCompletenessOutputSchema },
  prompt: `You are an expert resume analyzer. Your task is to check a user's professional bio for the presence of key sections.

For each of the following sections, determine if it is present and adequately represented in the bio. Be critical: a single sentence mentioning a skill might not be enough to count for the 'Skills' section if it's not a clear list.

-   **Contact Info**: Look for a name, email address, or phone number.
-   **Summary**: Check for a professional summary or objective statement at the beginning.
-   **Work Experience**: Identify at least one clear entry for a previous job with a title and company.
-   **Education**: Look for a degree, institution, or certification.
-   **Skills**: Find a dedicated section or a clear list of professional skills.

Analyze the following bio now and return the boolean flags indicating the presence of each section.

User Bio:
{{{bio}}}
`,
});

const analyzeBioCompletenessFlow = ai.defineFlow(
  {
    name: 'analyzeBioCompletenessFlow',
    inputSchema: BioCompletenessInputSchema,
    outputSchema: BioCompletenessOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
