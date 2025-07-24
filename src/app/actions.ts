"use server";

import { z } from 'zod';
import { generateCoverLetter, type CoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { generateCv, type CvOutput } from '@/ai/flows/generate-cv';
import { generateDeepAnalysis, type DeepAnalysisOutput } from '@/ai/flows/generate-deep-analysis';
import { generateQAndA } from '@/ai/flows/generate-q-and-a';
import { reviseResponse } from '@/ai/flows/revise-response';
import { JobApplicationSchema, ReviseResponseSchema, type ResponseData, type QAndAOutput, type ReviseResponseData, FeedbackSchema, type FeedbackData } from '@/lib/schemas';

type SingleGenerateActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

type ReviseActionResponse = 
  | { success: true; data: ResponseData | QAndAOutput }
  | { success: false; error: string };

export type GenerationResult = 
    | CoverLetterOutput
    | CvOutput
    | DeepAnalysisOutput
    | QAndAOutput;

export type AllGenerationResults = {
    coverLetter?: CoverLetterOutput;
    cv?: CvOutput;
    deepAnalysis?: DeepAnalysisOutput;
    qAndA?: QAndAOutput;
};

const SingleGenerationSchema = JobApplicationSchema.pick({ jobDescription: true, bio: true, generationType: true, questions: true });

export async function generateAction(
  rawData: unknown
): Promise<
    | SingleGenerateActionResponse<CoverLetterOutput>
    | SingleGenerateActionResponse<CvOutput>
    | SingleGenerateActionResponse<DeepAnalysisOutput>
    | SingleGenerateActionResponse<QAndAOutput>
    | { success: false; error: string }
> {
    const validationResult = SingleGenerationSchema.safeParse(rawData);
    if (!validationResult.success) {
        const errorMessage = validationResult.error.issues.map((issue) => issue.message).join(' ');
        return { success: false, error: errorMessage || "Invalid input." };
    }
    const { jobDescription, bio, generationType, questions } = validationResult.data;

    try {
        let response;
        switch (generationType) {
            case 'cv':
                response = await generateCv({ jobDescription, userBio: bio });
                break;
            case 'deepAnalysis':
                response = await generateDeepAnalysis({ jobDescription, userBio: bio });
                break;
            case 'qAndA':
                response = await generateQAndA({ jobDescription, userBio: bio, questions });
                break;
            case 'coverLetter':
            default:
                response = await generateCoverLetter({ jobDescription, userBio: bio });
                break;
        }
        return { success: true, data: response };
    } catch (error) {
        console.error(`Error in generateAction for ${generationType}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to generate ${generationType}: ${errorMessage}.` };
    }
}


export async function reviseAction(
  rawData: unknown
): Promise<ReviseActionResponse> {
  const validationResult = ReviseResponseSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues.map((issue) => issue.message).join(' ');
    return { success: false, error: errorMessage || "Invalid input for revision." };
  }
  const validatedData = validationResult.data as ReviseResponseData;
  if (validatedData.generationType === 'cv') {
      return { success: false, error: "Revision is not supported for this format." };
  }

  const response = await reviseResponse(validatedData);
  return {
    success: true,
    data: response,
  };
}

export async function submitFeedbackAction(
    rawData: unknown
  ): Promise<{ success: boolean; error?: string }> {
    const validationResult = FeedbackSchema.safeParse(rawData);
    if (!validationResult.success) {
      return { success: false, error: "Invalid feedback data." };
    }
    const data = validationResult.data;
  
    const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSevlFVGQ1i4EBKiZLquITCGtCxFtetWpumNxKFLN9vGzd7aTw/formResponse";
    
    const formData = new URLSearchParams();
    if (data.jobDescription) formData.append("entry.685011891", data.jobDescription);
    if (data.bio) formData.append("entry.1458936165", data.bio);
    if (data.lastGeneratedOutput) formData.append("entry.292295861", data.lastGeneratedOutput);
    formData.append("entry.1898597184", data.feedback);
    if (data.name) formData.append("entry.145348937", data.name);
  
    try {
      const response = await fetch(googleFormUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        mode: 'no-cors',
      });
  
      // With 'no-cors', we can't inspect the response, but we assume it succeeded if no network error was thrown.
      // Google Forms redirects after submission, which would cause a CORS error if not for 'no-cors' mode.
      // The fetch promise will reject only on network errors.
      if (response.type === 'opaque') {
        return { success: true };
      }
  
      // This part is unlikely to be reached with 'no-cors', but is good practice.
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: `Submission failed with status: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // This is the expected outcome of a no-cors request to a cross-origin endpoint that redirects.
        // We can treat it as a success.
        return { success: true };
      }
      console.error("Error submitting feedback:", error);
      return { success: false, error: "An unexpected error occurred during submission." };
    }
  }