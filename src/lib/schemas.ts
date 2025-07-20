import { z } from 'zod';

export const JobApplicationSchema = z.object({
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }),
  bio: z.string().min(100, { message: "Your bio must be at least 100 characters long to provide enough detail." }),
  requirements: z.string().min(20, { message: "Please list the key job requirements." }),
  comments: z.string().optional(),
});

export type JobApplicationData = z.infer<typeof JobApplicationSchema>;

export const AnalysisSchema = z.object({
  keySkills: z.string(),
  responsibilities: z.string(),
  companyValues: z.string(),
});

export const FilteredInfoSchema = z.object({
  filteredBio: z.string(),
  relevantInterests: z.string(),
});

export const ResponseSchema = z.object({
  responses: z.string(),
});

export const GenerationResultSchema = z.object({
  analysis: AnalysisSchema,
  filteredInfo: FilteredInfoSchema,
  response: ResponseSchema,
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;
