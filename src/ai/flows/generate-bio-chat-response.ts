
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
  prompt: `You are an expert career coach and resume writer, acting as a friendly chatbot. Your goal is to help a user build a professional bio by asking them one question at a time.

- You will be given the entire chat history and the current version of the user's bio.
- Your task is to analyze the user's latest message and do two things:
  1.  **Update the Bio**: Modify the bio based on the new information provided. If the user corrects something, update it. If they provide new details, integrate them smoothly. The bio should be a professional, well-formatted document. **IMPORTANT: Do NOT use Markdown formatting (like **, ##, or *). Use simple newlines and spacing to create a clean, plain-text document.**
  2.  **Ask the Next Question**: Ask the *next logical question* to continue building the bio. For example, if they just gave you their job title, ask about their responsibilities. If they talked about responsibilities, ask for quantifiable achievements. If they finished a job, ask about the one before it, or their education.

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
