
'use server';
/**
 * @fileOverview Enriches a user's raw co-pilot prompt into a more detailed one for the main AI.
 *
 * - enrichCopilotPrompt - The main function to enrich the prompt.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CoPilotMessageSchema } from '@/lib/schemas';

const EnrichPromptInputSchema = z.object({
  chatHistory: z.array(CoPilotMessageSchema),
  jobDescription: z.string(),
  bio: z.string(),
});

const EnrichPromptOutputSchema = z.object({
  thinkingMessage: z.string().describe("A user-facing message explaining the AI's plan. Should start with 'Thinking...' or 'Okay...'. For example: 'Okay, planning to rewrite the summary section of the bio to be more results-oriented.'"),
  enrichedPrompt: z.string().describe('A detailed, enriched prompt for the next AI model to use, containing all necessary context.'),
  error: z.string().optional().describe('An error message if the model failed to process the request.'),
});
export type EnrichPromptOutput = z.infer<typeof EnrichPromptOutputSchema>;

export async function enrichCopilotPrompt(
  input: z.infer<typeof EnrichPromptInputSchema>
): Promise<EnrichPromptOutput> {
  return enrichPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enrichCopilotPrompt',
  input: { schema: EnrichPromptInputSchema },
  output: { schema: EnrichPromptOutputSchema.omit({ error: true }) },
  prompt: `You are the first-stage "planner" for an AI career coach. Your task is to take a user's request and all available context, then create two things:

1.  A user-facing "thinking" message that explains your plan in a simple, high-level way.
2.  A detailed, "enriched" prompt that will be passed to a second AI (the "executor") to generate the final response.

**CRITICAL INSTRUCTIONS:**
- The "enrichedPrompt" MUST contain all relevant information: the user's specific request, the relevant parts of the chat history, the bio, and the job description. It needs to be a self-contained instruction for the next AI.

**User's Current Data:**
---
Job Description: {{{jobDescription}}}
---
Bio: {{{bio}}}
---

**Chat History:**
---
{{#each chatHistory}}
**{{author}}**: {{content}}
{{/each}}
---

Analyze the latest user message in the chat history and the context provided. Now, generate the "thinkingMessage" and the "enrichedPrompt".`,
});


const enrichPromptFlow = ai.defineFlow(
  {
    name: 'enrichCopilotPromptFlow',
    inputSchema: EnrichPromptInputSchema,
    outputSchema: EnrichPromptOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        return {
          thinkingMessage: 'I had trouble processing that.',
          enrichedPrompt: '',
          error: 'No output from model.',
        };
      }
      return output;
    } catch (error) {
      console.error('Error in enrichCopilotPromptFlow:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      return {
        thinkingMessage: "I'm sorry, I encountered an issue.",
        enrichedPrompt: '',
        error: `The AI model seems to be unavailable right now. Please try again in a moment. (Details: ${errorMessage})`,
      };
    }
  }
);
