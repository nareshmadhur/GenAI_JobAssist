import { z } from 'zod';

export const JobApplicationSchema = z.object({
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
  bio: z.string().min(100, { message: "Your bio must be at least 100 characters long to provide enough detail." }),
  questions: z.string().optional(),
  generationType: z.enum(['coverLetter', 'cv', 'deepAnalysis', 'qAndA']),
});

export type JobApplicationData = z.infer<typeof JobApplicationSchema>;

export const ResponseSchema = z.object({
  responses: z.string(),
});
export type ResponseData = z.infer<typeof ResponseSchema>;

// Schemas for the Q&A flow
export const QuestionAnswerPairSchema = z.object({
  question: z.string().describe('The verbatim question found in the job description.'),
  answer: z.string().describe("A concise and professional answer based on the user's bio. If the answer cannot be found in the bio, return the exact string '[Answer not found in bio]'."),
});

export const QAndAOutputSchema = z.object({
  qaPairs: z.array(QuestionAnswerPairSchema).describe('A list of question and answer pairs.'),
});
export type QAndAOutput = z.infer<typeof QAndAOutputSchema>;


// Schema for the revision flow
export const ReviseResponseSchema = z.object({
  jobDescription: z.string(),
  bio: z.string(),
  originalResponse: z.string().describe("The original AI-generated response that needs to be revised. For Q&A, this will be a stringified JSON of the QAndAOutputSchema."),
  revisionComments: z.string().min(5, { message: "Please provide some feedback to revise the response." }),
  generationType: z.enum(['coverLetter', 'qAndA']),
});

export type ReviseResponseData = z.infer<typeof ReviseResponseSchema>;


export const FeedbackSchema = z.object({
    name: z.string().optional(),
    feedback: z.string().min(1, { message: "Feedback cannot be empty." }),
    jobDescription: z.string().optional(),
    bio: z.string().optional(),
    lastGeneratedOutput: z.string().optional(),
    includeJD: z.boolean().optional().default(true),
    includeBio: z.boolean().optional().default(true),
});

export type FeedbackData = z.infer<typeof FeedbackSchema>;
