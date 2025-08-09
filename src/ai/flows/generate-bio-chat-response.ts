
'use server';
/**
 * @fileOverview Manages a chatbot conversation to incrementally build a user's professional bio.
 *
 * - generateBioChatResponse - The main function to get the next chat message from the AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { BioChatInputSchema, BioChatOutputSchema, generateBioChatResponse as generateBioChatResponseAction } from '@/lib/schemas';
import type { BioChatInput, BioChatOutput } from '@/lib/schemas';


export async function generateBioChatResponse(input: BioChatInput): Promise<BioChatOutput> {
  try {
    const response = await generateBioChatResponseFlow(input);
    return response;
  } catch (error) {
    console.error("Error in Bio Chat Flow: ", error);
    return {
      response: "I'm sorry, I encountered an error. Could you please try rephrasing your last message?",
      updatedBio: input.currentBio,
      error: error instanceof Error ? error.message : "An unknown error occurred."
    }
  }
}

const prompt = ai.definePrompt({
  name: 'bioChatPrompt',
  input: { schema: BioChatInputSchema },
  output: { schema: BioChatOutputSchema },
  prompt: `You are an expert career coach chatbot. Your goal is to help a user build a professional bio. Be concise and helpful.

**Primary Capabilities:**
1.  **Guided Questions:** Ask short, single questions to build the bio section by section.
2.  **Text Structuring:** If the user pastes a large block of text, parse it, extract only professionally relevant information, and structure it into a clean bio format. Ignore conversational filler.

**Process & Rules:**
1.  Analyze the user's latest message and the current bio.
2.  **Update the Bio**: Based on the new information, update the bio. If they provided a large text dump, replace the current bio with a newly structured version. The bio should be a clean, plain-text document. **Do NOT use Markdown (like **, ##, or *).**
3.  **Assess Completeness**: After updating, check if the bio contains key elements (e.g., name, contact info, a summary, at least one job, and some skills).
4.  **Respond to the User**:
    *   Provide a short, concise response.
    *   Provide 'suggestedReplies' to guide the user. These should be short, user-centric actions, like "Add a job" or "List my skills." The user will click these to populate their input box.
    *   Prioritize suggestions for sections that are still missing from the bio.
    *   If the bio seems reasonably complete, congratulate the user, and **one of the 'suggestedReplies' MUST be "Go to Job Matcher".**
    *   If they pasted a lot of text, confirm you've updated the bio and ask them to review it. Then provide suggestions for what to add next.

**Current Bio (Plain Text):**
---
{{currentBio}}
---

**Chat History:**
---
{{#each chatHistory}}
**{{author}}**: {{content}}
{{/each}}
---

Based on the last message from the user, generate your concise response, the updated plain-text bio, and a list of suggested replies.`,
});

const generateBioChatResponseFlow = ai.defineFlow(
  {
    name: 'generateBioChatResponseFlow',
    inputSchema: BioChatInputSchema,
    outputSchema: BioChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
