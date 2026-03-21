'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateLearningPathSchema = z.object({
  jobDescription: z.string(),
  missingRequirement: z.string(),
});

export const GenerateLearningPathOutputSchema = z.object({
  learningPath: z.string()
});

export type GenerateLearningPathInput = z.infer<typeof GenerateLearningPathSchema>;
export type GenerateLearningPathOutput = z.infer<typeof GenerateLearningPathOutputSchema>;

export async function generateLearningPath(
  input: GenerateLearningPathInput
): Promise<GenerateLearningPathOutput> {
  return generateLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningPathPrompt',
  input: { schema: GenerateLearningPathSchema },
  prompt: `You are an expert technical recruiter and career coach. A candidate is applying for a job but is missing a mandatory requirement.

Job Description (for context):
{{{jobDescription}}}

Missing Requirement to Learn:
"{{missingRequirement}}"

Your task is to provide a brief, highly actionable "Learning Path" to help the candidate quickly upskill and cover this gap before an interview.
Provide 3-5 bullet points including concepts to understand, common interview questions on this topic, and types of resources they should seek out (e.g., "Review the official React docs on Hooks").
Format your output as a short Markdown string. Do not include a preamble or conversational filler.`,
});

const generateLearningPathFlow = ai.defineFlow(
  {
    name: 'generateLearningPathFlow',
    inputSchema: GenerateLearningPathSchema,
    outputSchema: GenerateLearningPathOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
      output: { schema: GenerateLearningPathOutputSchema },
    });
    return output!;
  }
);
