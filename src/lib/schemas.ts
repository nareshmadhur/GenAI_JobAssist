import { z } from 'zod';
import type { AllGenerationResults } from '@/app/actions';

export const JobApplicationSchema = z.object({
  jobDescription: z
    .string()
    .min(50, { message: 'Job description must be at least 50 characters long.' }),
  bio: z
    .string()
    .min(100, {
      message: 'Your bio must be at least 100 characters long to provide enough detail.',
    }),
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
  question: z
    .string()
    .describe('The verbatim question found in the job description.'),
  answer: z
    .string()
    .describe(
      "A concise and professional answer based on the user's bio. If the answer cannot be found in the bio, return the exact string '[Answer not found in bio]'."
    ),
});

export const QAndAOutputSchema = z.object({
  qaPairs: z
    .array(QuestionAnswerPairSchema)
    .describe('A list of question and answer pairs.'),
});
export type QAndAOutput = z.infer<typeof QAndAOutputSchema>;

// Schema for the revision flow
export const ReviseResponseSchema = z.object({
  jobDescription: z.string(),
  bio: z.string(),
  originalResponse: z
    .string()
    .describe(
      "The original AI-generated response that needs to be revised. For Q&A, this will be a stringified JSON of the QAndAOutputSchema."
    ),
  revisionComments: z
    .string()
    .min(5, { message: 'Please provide some feedback to revise the response.' }),
  generationType: z.enum(['coverLetter', 'qAndA', 'cv', 'deepAnalysis']),
});

export type ReviseResponseData = z.infer<typeof ReviseResponseSchema>;

// The output of the revision flow can be either a Q&A object or a cover letter string object
export type ReviseResponseOutput = QAndAOutput | ResponseData;

// Schemas for the CV generation flow
const WorkExperienceSchema = z.object({
  jobTitle: z.string().describe("The user's job title."),
  company: z.string().describe("The company where the user worked."),
  duration: z.string().describe("The dates or duration of employment (e.g., '2020 - Present' or 'Jan 2022 - Dec 2023')."),
  responsibilities: z.array(z.string()).describe("A list of key responsibilities and achievements, phrased as bullet points."),
});

const EducationSchema = z.object({
  degree: z.string().describe("The degree or certification obtained."),
  institution: z.string().describe("The name of the university or institution."),
  year: z.string().optional().describe("The year of graduation or completion."),
});

export const CvOutputSchema = z.object({
  fullName: z.string().describe("The user's full name. If not found, return '[Name not found in bio]'."),
  email: z.string().describe("The user's email address. If not found, return '[Information not found in bio]'."),
  phone: z.string().describe("The user's phone number. If not found, return '[Information not found in bio]'."),
  location: z.string().describe("The user's location (e.g., 'City, State'). If not found, return '[Information not found in bio]'."),
  summary: z.string().describe("A 2-4 sentence professional summary, tailored to the job description."),
  workExperience: z.array(WorkExperienceSchema).describe("A list of the user's professional roles."),
  education: z.array(EducationSchema).describe("A list of the user's educational qualifications."),
  skills: z.array(z.string()).describe("A list of key skills relevant to the job description."),
});
export type CvOutput = z.infer<typeof CvOutputSchema>;

// Schema for job detail extraction
export const JobDetailsInputSchema = z.object({
  jobDescription: z.string(),
});
export type JobDetailsInput = z.infer<typeof JobDetailsInputSchema>;

export const JobDetailsOutputSchema = z.object({
    companyName: z.string().describe("The name of the company hiring for the role. If not found, return 'Unknown Company'."),
    jobTitle: z.string().describe("The title of the job position (e.g., 'Senior Software Engineer'). If not found, return 'Unknown Role'."),
});
export type JobDetailsOutput = z.infer<typeof JobDetailsOutputSchema>;


// Schema for a saved job in localStorage
// This is not a Zod schema because it includes a complex object `allResults`
// which doesn't have a single, unified Zod schema.
export interface SavedJob {
  id: string;
  companyName: string;
  jobTitle: string;
  formData: Omit<JobApplicationData, 'generationType'>;
  allResults: AllGenerationResults;
  savedAt: string;
}
