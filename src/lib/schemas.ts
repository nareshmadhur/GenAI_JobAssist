
import { z } from 'zod';
import type { AllGenerationResults } from '@/app/actions';
import type { ToolRequestPart } from 'genkit';

export const JobApplicationSchema = z.object({
  jobDescription: z
    .string()
    .min(50, { message: 'Job description must be at least 50 characters long.' }),
  workRepository: z
    .string()
    .min(100, {
      message: 'Your work repository must be at least 100 characters long to provide enough detail.',
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
      "A concise and professional answer based on the user's work repository. If the answer cannot be found in the repository, return the exact string '[Answer not found in repository]'."
    ),
});

export const QAndAOutputSchema = z.object({
  qaPairs: z
    .array(QuestionAnswerPairSchema)
    .describe('A list of question and answer pairs.'),
});
export type QAndAOutput = z.infer<typeof QAndAOutputSchema>;

// Schema for the Interview Prep Guide flow
export const InterviewPrepGapSchema = z.object({
  skill: z.string().describe('The skill or area that is missing or weak.'),
  tip: z.string().describe('A coaching tip on how to bridge this gap verbally in the interview.'),
});

export const InterviewPrepQuestionSchema = z.object({
  question: z.string().describe('A likely interview question for this role.'),
  coachingAngle: z.string().describe('How to frame your answer — the angle, not a scripted answer.'),
  storyPrompt: z.string().describe('Which experience from the work repository to draw from.'),
});

export const InterviewPrepOutputSchema = z.object({
  overallReadinessScore: z.number().min(0).max(100).describe('An overall readiness score from 0-100 based on the match between the work repository and job requirements.'),
  readinessSummary: z.string().describe('A 1-2 sentence coaching summary of the candidacy.'),
  strengths: z.array(z.string()).describe('3-5 genuine strengths to confidently lead with in the interview.'),
  gaps: z.array(InterviewPrepGapSchema).describe('2-4 gaps or weaker areas, each with a verbal bridging tip.'),
  likelyQuestions: z.array(InterviewPrepQuestionSchema).describe('5-8 likely interview questions with coaching angles and story prompts.'),
  recommendations: z.array(z.string()).describe('List of specific, actionable steps to improve the application.'),
  coachingGuide: z.string().describe('A comprehensive coaching guide including SWOT analysis, gap-filling strategies, and interview talking points based on the match analysis.'),
  negotiationTips: z.array(z.string()).describe('2-3 salary or role negotiation leverage points.'),
});
export type InterviewPrepOutput = z.infer<typeof InterviewPrepOutputSchema>;
// Match Requirement Schema
export const RequirementSchema = z.object({
  requirement: z
    .string()
    .describe('A concise summary of the specific requirement extracted from the job description.'),
  category: z
    .string()
    .describe(
      "The category of the requirement (e.g., 'Experience', 'Education', 'Skills', 'Certification')."
    ),
  isMandatory: z
    .boolean()
    .describe(
      'A boolean indicating if the requirement is mandatory (must-have) or preferred (nice-to-have).'
    ),
  isMet: z
    .boolean()
    .describe("A boolean indicating if the requirement is met by the user's repository."),
  justification: z
    .string()
    .describe(
      "A brief justification for why the requirement is marked as met or not met, citing evidence from the user's repository or lack thereof."
    ),
});

// Deep Analysis Schema
export const DeepAnalysisOutputSchema = z.object({
  matchScore: z.number().min(0).max(100).describe('An overall match score from 0-100 between the repository and the job description.'),
  jobSummary: z
    .string()
    .describe(
      "A professional summary of the job description, abstracting jargon and focusing on key takeaways, with important elements bolded. If relevant, it may also include comments on the job description's structure, language, and tone."
    ),
  requirements: z
    .array(RequirementSchema)
    .describe(
      'A consolidated list of all requirements (both mandatory and preferred) from the job description.'
    ),
  improvementAreas: z
    .array(z.string())
    .describe(
      "A list of specific bullet points providing areas where the user's repository could be improved for this role. Each bullet point MUST start with a bolded category (e.g., '**Quantify Achievements:** ...')."
    ),
  coachingGuide: z.string().describe('A comprehensive coaching guide including strategic advice, gap-filling tips, and interview talking points based on the match analysis.'),
});
export type DeepAnalysisOutput = z.infer<typeof DeepAnalysisOutputSchema>;


// Schema for the revision flow
export const ReviseResponseSchema = z.object({
  jobDescription: z.string(),
  workRepository: z.string(),
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
  fullName: z.string().describe("The user's full name. If not found, return '[Name not found in repository]'."),
  email: z.string().describe("The user's email address. If not found, return '[Information not found in repository]'."),
  phone: z.string().describe("The user's phone number. If not found, return '[Information not found in repository]'."),
  location: z.string().describe("The user's location (e.g., 'City, State'). If not found, return '[Information not found in repository]'."),
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
    extractedQuestions: z.array(z.string()).optional().describe("A list of specific application questions or personal statement prompts found in the job description (e.g., 'Why do you want to work here?', 'Describe a time you failed')."),
});
export type JobDetailsOutput = z.infer<typeof JobDetailsOutputSchema>;


export type JobStatus = 'draft' | 'applied' | 'in_process' | 'accepted' | 'rejected' | 'interviewing' | 'offer';
export type SavedJobView = 'coverLetter' | 'cv' | 'deepAnalysis' | 'qAndA';
export type ResultInputSignatures = Partial<Record<SavedJobView, string>>;

// Schema for a saved job in localStorage
export interface SavedJob {
  id: string;
  companyName: string;
  jobTitle: string;
  status?: JobStatus;
  lastActiveView?: SavedJobView;
  resultInputSignatures?: ResultInputSignatures;
  formData: Omit<JobApplicationData, 'generationType'>;
  allResults: AllGenerationResults;
  savedAt: string;
}

// Schema for a saved repository
export interface SavedRepository {
  id: string;
  name: string;
  workRepository: string;
  savedAt: string;
}


// Schemas for the Co-pilot chatbot
export const CoPilotMessageSchema = z.object({
  author: z.enum(['user', 'assistant', 'tool']),
  content: z.string(),
  type: z.enum(['message', 'tool-step']).default('message').optional(),
  toolRequestId: z.string().optional(),
});
export type CoPilotMessage = z.infer<typeof CoPilotMessageSchema>;

export const CoPilotInputSchema = z.object({
  enrichedPrompt: z.string().describe("The enriched, detailed prompt for the AI to follow."),
});
export type CoPilotInput = z.infer<typeof CoPilotInputSchema>;

export const CoPilotOutputSchema = z.object({
  response: z.string().describe("The chatbot's next concise message to the user."),
  toolRequest: z.any().optional().describe('A request from the model to use a tool.'),
  error: z.string().optional().describe('An error message if the model failed to process the request.'),
});
export type CoPilotOutput = z.infer<typeof CoPilotOutputSchema>;


// Schemas for bio completeness analysis
export const BioCompletenessInputSchema = z.object({
  workRepository: z.string(),
});
export type BioCompletenessInput = z.infer<typeof BioCompletenessInputSchema>;

export const BioCompletenessOutputSchema = z.object({
  hasContactInfo: z.boolean().describe('True if contact information is present.'),
  hasSummary: z.boolean().describe('True if a professional summary is present.'),
  hasWorkExperience: z.boolean().describe('True if work experience is present.'),
  hasEducation: z.boolean().describe('True if education history is present.'),
  hasSkills: z.boolean().describe('True if a skills section is present.'),
});
export type BioCompletenessOutput = z.infer<typeof BioCompletenessOutputSchema>;

// Schemas for Bio Creator Chat
export const BioChatMessageSchema = z.object({
    author: z.enum(['user', 'assistant']),
    content: z.string(),
    suggestedReplies: z.array(z.string()).optional(),
});
export type BioChatMessage = z.infer<typeof BioChatMessageSchema>;

export const BioChatInputSchema = z.object({
    chatHistory: z.array(BioChatMessageSchema),
    currentWorkRepository: z.string(),
});

export const BioChatOutputSchema = z.object({
    response: z.string().describe("The chatbot's next message to the user."),
    updatedWorkRepository: z.string().describe("The full, updated work repository text after incorporating the user's last message."),
    suggestedReplies: z.array(z.string()).optional().describe("A few short, relevant suggested replies for the user."),
    error: z.string().optional().describe("An error message if the model failed to process the request."),
});
export type BioChatOutput = z.infer<typeof BioChatOutputSchema>;


// Schema for user signup
export const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  privacyPolicy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy to continue.',
  }),
});
