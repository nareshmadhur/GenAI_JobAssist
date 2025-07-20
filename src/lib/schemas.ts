import { z } from 'zod';

export const JobApplicationSchema = z.object({
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
  bio: z.string().min(100, { message: "Your bio must be at least 100 characters long to provide enough detail." }),
  // This is now optional and will be populated after the first generation
  response: z.object({ responses: z.string() }).optional(),
});

export type JobApplicationData = z.infer<typeof JobApplicationSchema>;

export const AnalysisSchema = z.object({
  matches: z.array(z.string()).describe("A list of points where the user's bio matches the job requirements."),
  gaps: z.array(z.string()).describe("A list of points where the user's bio has gaps when compared to the job requirements."),
});

export const FilteredInfoSchema = z.object({
  filteredBio: z.string(),
  relevantInterests: z.string(),
});

export const ResponseSchema = z.object({
  responses: z.string(),
});
export type ResponseData = z.infer<typeof ResponseSchema>;

export const GenerationResultSchema = z.object({
  analysis: AnalysisSchema,
  filteredInfo: FilteredInfoSchema,
  response: ResponseSchema,
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;

// Schema for the revision flow
export const ReviseResponseSchema = z.object({
  jobDescription: z.string(),
  bio: z.string(),
  originalResponse: z.string().describe("The original AI-generated response that needs to be revised."),
  revisionComments: z.string().min(5, { message: "Please provide some feedback to revise the response." }),
});

export type ReviseResponseData = z.infer<typeof ReviseResponseSchema>;
