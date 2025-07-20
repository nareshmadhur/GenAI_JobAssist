import { z } from 'zod';

export const JobApplicationSchema = z.object({
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
  bio: z.string().min(100, { message: "Your bio must be at least 100 characters long to provide enough detail." }),
  generationType: z.enum(['coverLetter', 'cv', 'deepAnalysis']),
});

export type JobApplicationData = z.infer<typeof JobApplicationSchema>;

export const ResponseSchema = z.object({
  responses: z.string(),
});
export type ResponseData = z.infer<typeof ResponseSchema>;


// Schema for the revision flow
export const ReviseResponseSchema = z.object({
  jobDescription: z.string(),
  bio: z.string(),
  originalResponse: z.string().describe("The original AI-generated response that needs to be revised."),
  revisionComments: z.string().min(5, { message: "Please provide some feedback to revise the response." }),
  generationType: z.enum(['coverLetter', 'cv', 'deepAnalysis']),
});

export type ReviseResponseData = z.infer<typeof ReviseResponseSchema>;
