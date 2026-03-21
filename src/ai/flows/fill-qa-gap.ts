'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const FillQaGapSchema = z.object({
  jobDescription: z.string(),
  question: z.string(),
  userContext: z.string(),
});

export const FillQaGapOutputSchema = z.object({
  answer: z.string()
});

export type FillQaGapInput = z.infer<typeof FillQaGapSchema>;
export type FillQaGapOutput = z.infer<typeof FillQaGapOutputSchema>;

export async function fillQaGap(
  input: FillQaGapInput
): Promise<FillQaGapOutput> {
  return fillQaGapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fillQaGapPrompt',
  input: { schema: FillQaGapSchema },
  prompt: `You are an expert career advisor and interview coach. A question was found in a job description that couldn't be answered by the user's original bio. The user has now provided brief context to help answer it.

Job Description (for tone and requirement context):
{{{jobDescription}}}

Question to Answer:
"{{question}}"

User's New Context:
"{{userContext}}"

Please write a strong, professional, and confident answer to the Question that incorporates the User's New Context. Make sure the answer aligns well with the tone and expectations of the Job Description. The answer should be ready to be presented to an employer. Do not use markdown headers, just plain text or simple markdown formatting like bolding where appropriate.`,
});

const fillQaGapFlow = ai.defineFlow(
  {
    name: 'fillQaGapFlow',
    inputSchema: FillQaGapSchema,
    outputSchema: FillQaGapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
      output: { schema: FillQaGapOutputSchema },
    });
    return output!;
  }
);
