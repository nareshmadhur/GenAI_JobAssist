'use server';
/**
 * @fileOverview Scans a job description for explicit questions and generates answers based on a user's bio.
 *
 * - generateQAndA - A function that handles the Q&A generation process.
 * - QAndAInput - The input type for the generateQAndA function.
 * - QAndAOutput - The return type for the generateQAndA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QAndAInputSchema = z.object({
  jobDescription: z.string().describe('The job description to scan for questions.'),
  userBio: z.string().describe("The user's bio to source answers from."),
});
export type QAndAInput = z.infer<typeof QAndAInputSchema>;

const QuestionAnswerPairSchema = z.object({
  question: z.string().describe('The verbatim question found in the job description.'),
  answer: z.string().describe("A concise and professional answer based on the user's bio."),
});

const QAndAOutputSchema = z.object({
  questionsFound: z.boolean().describe('Whether or not any questions were found in the job description.'),
  qaPairs: z.array(QuestionAnswerPairSchema).describe('A list of question and answer pairs.'),
});
export type QAndAOutput = z.infer<typeof QAndAOutputSchema>;

export async function generateQAndA(input: QAndAInput): Promise<QAndAOutput> {
  return generateQAndAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQAndAPrompt',
  input: {schema: QAndAInputSchema},
  output: {schema: QAndAOutputSchema},
  prompt: `You are an expert at parsing job applications. Your task is to find any explicit questions asked in the job description and answer them based on the provided user bio.

**Crucially, you must only use information explicitly present in the User Bio. Do not invent, exaggerate, or infer details that are not mentioned. All answers must be truthful to the provided bio.**

If no questions are found, set 'questionsFound' to false and leave 'qaPairs' as an empty array.
If questions are found, set 'questionsFound' to true. For each question, provide a clear and concise answer derived from the user's bio. The answer should be professional and ready to be copy-pasted.

Job Description:
{{{jobDescription}}}

User Bio:
{{{userBio}}}

Scan for questions and provide the answers now.`,
});

const generateQAndAFlow = ai.defineFlow(
  {
    name: 'generateQAndAFlow',
    inputSchema: QAndAInputSchema,
    outputSchema: QAndAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
