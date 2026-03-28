
'use server';
/**
 * @fileOverview Manages a chatbot conversation to act as a co-pilot for the job application process.
 *
 * - generateCoPilotResponse - The main function to get the next chat message from the AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { CoPilotOutput } from '@/lib/schemas';
import { CoPilotInputSchema, CoPilotOutputSchema } from '@/lib/schemas';
import { generateJobMaterial, updateFormFields } from '@/ai/tools/job-app-tools';

export async function generateCoPilotResponse(
  input: z.infer<typeof CoPilotInputSchema>
): Promise<CoPilotOutput> {
  return coPilotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coPilotPrompt',
  input: { schema: CoPilotInputSchema },
  tools: [updateFormFields, generateJobMaterial],
  prompt: `You are an expert career coach co-pilot. Your primary goal is to help a user with their job application.

**CRITICAL INSTRUCTIONS:**
1.  **Be Concise, Useful, and Human**: Write like a calm, sharp career coach, not a report generator. Keep responses short enough for a sidebar. Default to 2-4 short bullets or 2 short paragraphs.
2.  **Use Tools When Necessary**: Use the 'updateFormFields' or 'generateJobMaterial' tools when the user explicitly asks for changes or new content.
3.  **Conversational Help**: If the user asks a question or wants advice, provide a helpful, conversational response without using a tool.
4.  **Clarity on Actions**: When you use a tool, your text response should clearly and simply state what action you have taken (e.g., "I've updated your bio with your new experience.").
5.  **Do Not Echo Context**: Do not restate the full job description, repository, or prompt back to the user. Pull out only the most relevant point.
6.  **For Gap Coaching**: When the user asks about closing a gap, structure the answer around:
    - what the gap really means
    - whether it is a true experience gap or mostly a framing gap
    - what to improve in the Work Repository
    - the single best next application move
7.  **Keep It Encouraging**: Be direct, but supportive. Avoid robotic or overly formal wording.

**CONTEXT:**
You have been given a detailed, enriched prompt that clarifies the user's intent and provides all necessary context (their bio, the job description, and chat history). Use this information to directly address the user's request.

Enriched Prompt for this turn:
---
{{{enrichedPrompt}}}
---
`,
});

const coPilotFlow = ai.defineFlow(
  {
    name: 'coPilotFlow',
    inputSchema: CoPilotInputSchema,
    outputSchema: CoPilotOutputSchema,
  },
  async (input) => {
    try {
      const llmResponse = await prompt(input);
      const toolRequest = llmResponse.toolRequests[0];

      if (toolRequest) {
        // If the model wants to use a tool, we ONLY return the tool request.
        // The client is responsible for executing it and sending the result back.
        return {
          response: llmResponse.text, // Include any text the model generated before the tool request.
          toolRequest,
        };
      }

      // If no tool is requested, we return the model's text response.
      return {
        response: llmResponse.text,
      };
    } catch (error) {
      console.error('Error in coPilotFlow:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred.';
      return {
        response: `I'm sorry, I encountered an issue. The AI model might be temporarily unavailable. Please try again in a moment.`,
        error: `Error: ${errorMessage}`,
      };
    }
  }
);
