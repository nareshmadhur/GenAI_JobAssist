'use server';

/**
 * @fileOverview Prettifies raw work history or resume text into a structured, professional format.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PrettifyInputSchema = z.object({
  rawText: z.string(),
});

const PrettifyOutputSchema = z.object({
  structuredText: z.string().describe("The prettified, professional Markdown version of the text."),
});

export type PrettifyInput = z.infer<typeof PrettifyInputSchema>;
export type PrettifyOutput = z.infer<typeof PrettifyOutputSchema>;

const prompt = ai.definePrompt({
  name: 'prettifyWorkRepositoryPrompt',
  input: { schema: PrettifyInputSchema },
  output: { schema: PrettifyOutputSchema },
  prompt: `You are an expert Data Architect for AI Job Systems. Your goal is to transform raw, messy work history or resume text into a highly structured, dense "Work Repository" format optimized for other AI models to extract information from.
  
  CRITICAL INSTRUCTIONS:
  1. **Structure over Aesthetics**: Focus on clear, hierarchical headers: ## Experience, ## Skills, ## Education, ## Projects.
  2. **Data Density**: For every role, ensure the format: ### [Role Title] | [Company Name] | [Location] | [Start Date] - [End Date].
  3. **Factual Integrity**: Do not invent metrics or projects. Only clean up and clarify the existing text.
  4. **Keyword Optimization**: Use standard industry terminology for skills and tools mentioned in the raw text to make them easily "searchable" for the CV generation model.
  5. **Markdown Format**: Use clean Markdown with bullet points for responsibilities. Avoid excessive "flowery" language; keep it factual and professional.
  
  Raw Text:
  {{{rawText}}}
  
  Generate the structured Work Repository now.`,
});

export async function prettifyWorkRepository(input: PrettifyInput): Promise<PrettifyOutput> {
  return prettifyWorkRepositoryFlow(input);
}

const prettifyWorkRepositoryFlow = ai.defineFlow(
  {
    name: 'prettifyWorkRepositoryFlow',
    inputSchema: PrettifyInputSchema,
    outputSchema: PrettifyOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
