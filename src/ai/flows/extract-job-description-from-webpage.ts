'use server';

import { z } from 'genkit';

import { ai } from '@/ai/genkit';

const ExtractJobDescriptionFromWebpageInputSchema = z.object({
  url: z.string().url(),
  pageTitle: z.string(),
  pageText: z.string(),
  candidateBlocksText: z.string(),
});

const ExtractJobDescriptionFromWebpageOutputSchema = z.object({
  jobDescription: z
    .string()
    .describe('A clean, application-ready job description in Markdown with only relevant role content.'),
  isLikelyJobPosting: z
    .boolean()
    .describe('Whether the provided webpage content looks like a real job posting.'),
});

export type ExtractJobDescriptionFromWebpageInput = z.infer<
  typeof ExtractJobDescriptionFromWebpageInputSchema
>;
export type ExtractJobDescriptionFromWebpageOutput = z.infer<
  typeof ExtractJobDescriptionFromWebpageOutputSchema
>;

export async function extractJobDescriptionFromWebpage(
  input: ExtractJobDescriptionFromWebpageInput
): Promise<ExtractJobDescriptionFromWebpageOutput> {
  return extractJobDescriptionFromWebpageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractJobDescriptionFromWebpagePrompt',
  input: { schema: ExtractJobDescriptionFromWebpageInputSchema },
  output: { schema: ExtractJobDescriptionFromWebpageOutputSchema },
  prompt: `You clean raw webpage extractions into a job description that a job applicant can use immediately.

Rules:
1. Use only the provided webpage text. Do not invent missing details.
2. Keep only content that belongs to the actual role: title, summary, responsibilities, requirements, qualifications, team/context, compensation if specific, and any application questions or prompts.
3. Remove navigation, cookie banners, marketing copy, generic company boilerplate, repeated text, related jobs, and page chrome.
4. Rewrite the result into clear Markdown with concise headings and bullet points where helpful.
5. If the page does not look like a real job posting, set isLikelyJobPosting to false and explain that briefly in jobDescription.

URL: {{{url}}}
Page title: {{{pageTitle}}}

Best candidate sections:
{{{candidateBlocksText}}}

Fallback webpage text:
{{{pageText}}}

Return a clean job description now.`,
});

const extractJobDescriptionFromWebpageFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFromWebpageFlow',
    inputSchema: ExtractJobDescriptionFromWebpageInputSchema,
    outputSchema: ExtractJobDescriptionFromWebpageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
