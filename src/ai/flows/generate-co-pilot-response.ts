
'use server';
/**
 * @fileOverview Manages a chatbot conversation to act as a co-pilot for the job application process.
 *
 * - generateCoPilotResponse - The main function to get the next chat message from the AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CoPilotInputSchema, CoPilotOutputSchema } from '@/lib/schemas';
import type { CoPilotInput, CoPilotOutput } from '@/lib/schemas';
import { updateFormFields, generateJobMaterial } from '@/ai/tools/job-app-tools';

export async function generateCoPilotResponse(
  input: CoPilotInput
): Promise<CoPilotOutput> {
  return coPilotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coPilotPrompt',
  input: { schema: CoPilotInputSchema },
  tools: [updateFormFields, generateJobMaterial],
  prompt: `You are an expert career coach co-pilot. Your goal is to help a user complete their job application. Be concise, helpful, and proactive.

**CONTEXT AWARENESS:**
- The user's current 'jobDescription' and 'bio' are provided below. You ALWAYS have this information. DO NOT ask for it or use a tool to get it.
- Use this context to provide expert feedback on how to improve the bio's alignment with the job description.

**USER'S CURRENT DATA:**
---
Job Description: {{{jobDescription}}}
---
Bio: {{{bio}}}
---

**PRIMARY CAPABILITIES & RULES:**
1.  **Edit Content on Request**: If the user asks you to make a change (e.g., "rephrase the first paragraph of my bio"), you MUST use the 'updateFormFields' tool with the newly written text. ALWAYS confirm that you have made the change.
2.  **Trigger Generations**: If the user asks you to "generate the cover letter" or "run the deep analysis", you MUST use the 'generateJobMaterial' tool with the correct 'generationType'.
3.  **Conversational Interaction**: If the user just wants to chat or asks a general question, provide a helpful response without using a tool.
4.  **Be Clear**: When you use a tool to perform an action (like updating the bio or generating a CV), explicitly state what you have done in your response (e.g., "I've updated your bio with the new paragraph." or "Okay, I'm generating the CV now.").

**Chat History:**
---
{{#each chatHistory}}
**{{author}}**: {{content}}
{{/each}}
---

Based on the last message from the user, decide whether to use a tool or provide a conversational response.`,
});

const coPilotFlow = ai.defineFlow(
  {
    name: 'coPilotFlow',
    inputSchema: CoPilotInputSchema,
    outputSchema: CoPilotOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);

    if (llmResponse.toolRequest) {
      // If the model wants to use a tool, we ONLY return the tool request.
      // The client is responsible for executing it and sending the result back.
      return {
        response: '', // No immediate text response
        toolRequest: llmResponse.toolRequest,
      };
    }

    // If no tool is requested, we return the model's text response.
    return {
      response: llmResponse.text,
    };
  }
);
