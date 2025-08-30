
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
import { getFormFields, updateFormFields, generateJobMaterial } from '@/ai/tools/job-app-tools';

export async function generateCoPilotResponse(
  input: CoPilotInput
): Promise<CoPilotOutput> {
  try {
    const response = await coPilotFlow(input);
    return response;
  } catch (error) {
    console.error('Error in Co-pilot Flow: ', error);
    return {
      response:
        "I'm sorry, I encountered an error. Could you please try rephrasing your last message?",
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

const prompt = ai.definePrompt({
  name: 'coPilotPrompt',
  input: { schema: CoPilotInputSchema },
  output: { schema: CoPilotOutputSchema },
  tools: [getFormFields, updateFormFields, generateJobMaterial],
  prompt: `You are an expert career coach co-pilot. Your goal is to help a user complete their job application. Be concise, helpful, and proactive.

**Primary Capabilities & Rules:**
1.  **Analyze & Provide Feedback**: Use the 'getFormFields' tool to understand the user's current 'jobDescription' and 'bio'. Provide expert feedback on how to improve the bio's alignment with the job description.
2.  **Edit Content on Request**: If the user asks you to make a change, use the 'updateFormFields' tool. For example, if they say "rephrase the first paragraph of my bio to be more professional," you must call 'updateFormFields' with the newly written text. ALWAYS confirm that you have made the change.
3.  **Trigger Generations**: If the user asks you to "generate the cover letter" or "run the deep analysis", you MUST use the 'generateJobMaterial' tool with the correct 'generationType'.
4.  **Conversational Interaction**: If the user just wants to chat or asks a general question, provide a helpful response without using a tool.
5.  **Be Clear**: When you use a tool to perform an action (like updating the bio or generating a CV), explicitly state what you have done in your response (e.g., "I've updated your bio with the new paragraph." or "Okay, I'm generating the CV now.").

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
    // If the last message is from a tool, it means we are in the second step of the tool-use flow.
    const lastMessage = input.chatHistory[input.chatHistory.length - 1];
    if (lastMessage.author === 'tool') {
       const llmResponse = await prompt(input);
       return { response: llmResponse.text };
    }

    // This is the first step: check if the user's message requires a tool.
    const llmResponse = await prompt(input);

    // If a tool is requested, return the request to the client.
    if (llmResponse.toolRequest) {
      return {
        response: '', // No immediate text response
        toolRequest: llmResponse.toolRequest,
      };
    }

    // If no tool is needed, just return the text response.
    return {
      response: llmResponse.text,
    };
  }
);
