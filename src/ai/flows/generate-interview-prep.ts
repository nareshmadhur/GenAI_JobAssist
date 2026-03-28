
'use server';
/**
 * @fileOverview Generates an interview preparation coaching guide.
 *
 * - generateInterviewPrep - A function that handles the interview prep generation.
 * - InterviewPrepInput - The input type for the generateInterviewPrep function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { InterviewPrepOutputSchema } from '@/lib/schemas';
import type { InterviewPrepOutput } from '@/lib/schemas';

const InterviewPrepInputSchema = z.object({
  jobDescription: z.string().describe('The job description to prepare for.'),
  workRepository: z.string().describe("The user's structured work repository."),
});
export type InterviewPrepInput = z.infer<typeof InterviewPrepInputSchema>;

export async function generateInterviewPrep(input: InterviewPrepInput): Promise<InterviewPrepOutput> {
  return generateInterviewPrepFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewPrepPrompt',
  input: { schema: InterviewPrepInputSchema },
  output: { schema: InterviewPrepOutputSchema },
  prompt: `You are a senior executive interview coach with deep expertise in preparing candidates for data, technology, and leadership roles.

Your task is to create a personalized interview preparation coaching guide by comparing the user's Work Repository against the Job Description.

**CRITICAL RULES:**
- Base ALL analysis strictly on the provided Work Repository. Never invent or infer experiences not mentioned.
- Do NOT write scripted answers. Instead, provide coaching angles and story prompts to encourage authentic delivery.
- The readiness score should reflect genuine fit, not flatter the user.

**WHAT TO GENERATE:**

1. **overallReadinessScore** (0-100): Score based on how strongly the work repository matches the requirements. 
   - 80-100: Strong match, most requirements clearly met
   - 60-79: Good match with some gaps
   - 40-59: Moderate match, clear gaps to address
   - Below 40: Significant gaps

2. **readinessSummary**: 1-2 sentences summarising the candidacy from a coach's perspective. Be honest but constructive.

3. **strengths** (3-5 items): Real, specific strengths the candidate should confidently lead with. Reference actual experience from their repository.

4. **gaps** (2-4 items): Each gap should have:
   - \`skill\`: The specific gap (e.g., "No evidence of C-suite stakeholder management")
   - \`tip\`: How to address or bridge this gap verbally in the interview (e.g., "Reframe your project steering committee experience as equivalent executive exposure")

5. **likelyQuestions** (5-8 questions): Realistic questions this interviewer would ask. For each:
   - \`question\`: The interview question
   - \`coachingAngle\`: The strategic framing or angle, not a scripted answer
   - \`storyPrompt\`: Which specific experience from the work repository best supports this answer

6. **negotiationTips** (2-3 items): Specific leverage points for salary/role negotiation based on the candidate's background.

Job Description:
{{{jobDescription}}}

User Work Repository:
{{{workRepository}}}

Generate the interview prep guide now.`,
});

const generateInterviewPrepFlow = ai.defineFlow(
  {
    name: 'generateInterviewPrepFlow',
    inputSchema: InterviewPrepInputSchema,
    outputSchema: InterviewPrepOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
