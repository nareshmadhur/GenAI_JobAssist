
'use server';
/**
 * @fileOverview Manages a chatbot conversation to help a user build their professional bio.
 *
 * - generateBioChatResponse - The main function to get the next chat message from the AI.
 */

import { ai } from '@/ai/genkit';
import type { BioChatOutput } from '@/lib/schemas';
import { BioChatInputSchema, BioChatOutputSchema } from '@/lib/schemas';

export async function generateBioChatResponse(
  input: import('zod').infer<typeof BioChatInputSchema>
): Promise<BioChatOutput> {
  return generateBioChatResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBioChatResponsePrompt',
  input: { schema: BioChatInputSchema },
  output: { schema: BioChatOutputSchema },
  prompt: `You are an expert career coach and resume writer. You are having a conversation with a user to help them build their professional bio from scratch.

**Your Task:**
1.  Analyze the user's latest message in the chat history.
2.  Based on their message, update the "Current Bio" text. You must integrate their new information, rewrite sections as requested, or add new sections. The result should always be a single, coherent block of text representing the complete bio.
3.  Generate a helpful, conversational "response" to the user, confirming what you've done or asking a clarifying question.
4.  Provide a few "suggestedReplies" to guide the user on what to do next.

**CRITICAL INSTRUCTIONS:**
-   **Always return the FULL, updated bio.** Do not just return the changed part.
-   If the user pastes a large block of text (like a resume), your primary job is to parse it and structure it into the bio. Your response should confirm that you've processed it.
-   If the user asks to change something, make the change and confirm it in your response.
-   If the user asks a question, answer it and ask what they'd like to do next.
-   Keep your conversational responses encouraging and concise.

**Current Bio (to be updated):**
---
{{{currentBio}}}
---

**Chat History:**
---
{{#each chatHistory}}
**{{author}}**: {{content}}
{{/each}}
---

Now, based on the last user message, generate the updated bio, your next response, and some suggested replies.`,
});

const generateBioChatResponseFlow = ai.defineFlow(
  {
    name: 'generateBioChatResponseFlow',
    inputSchema: BioChatInputSchema,
    outputSchema: BioChatOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        return {
          response: 'Sorry, I had trouble processing that. Could you try rephrasing?',
          updatedBio: input.currentBio,
          error: 'No output from model.',
        };
      }
      return output;
    } catch (error) {
      console.error('Error in generateBioChatResponseFlow:', error);
      return {
        response: 'An unexpected error occurred. Please try again.',
        updatedBio: input.currentBio,
        error: error instanceof Error ? error.message : 'Unknown error.',
      };
    }
  }
);
