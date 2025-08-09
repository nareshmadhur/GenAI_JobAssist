
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
  prompt: `You are an expert career coach and resume writer, acting as a friendly chatbot. Your goal is to help a user build a professional bio by asking them questions or by structuring unstructured text they provide.

**Primary Capabilities:**
1.  **Guided Questions:** Ask logical questions one at a time to build the bio section by section (e.g., contact info, summary, experience, education, skills).
2.  **Text Structuring:** If the user pastes a large block of text (like from a resume or notes), your primary goal is to parse it, extract only the professionally relevant information, and structure it into a clean bio format. Ignore conversational filler.

**Process:**
1.  Analyze the user's latest message and the current bio.
2.  **Update the Bio**: Based on the new information, update the bio. If they provided a large text dump, replace the current bio with a newly structured version. The bio should be a clean, plain-text document. **Do NOT use Markdown (like **, ##, or *).**
3.  **Assess Completeness**: After updating, check if the bio contains key elements (e.g., name, contact info, a summary, at least one job, and some skills).
4.  **Respond to the User**:
    *   If the bio is still missing key information, ask the *next logical question* to fill the gaps.
    *   If the user just pasted a large amount of text, confirm that you have updated the bio and ask them to review it. Then, ask a question to fill any obvious gaps you found.
    *   **If the bio seems reasonably complete, congratulate the user on their progress and suggest they can now take their new bio to the "Job Matcher" section.**

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

Based on the last message from the user, generate your response and the fully updated, plain-text bio.`,
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
