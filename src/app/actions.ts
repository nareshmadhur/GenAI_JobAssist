"use server";

import { z } from 'zod';
import { analyzeJobDescription } from '@/ai/flows/analyze-job-description';
import { filterBioInformation } from '@/ai/flows/filter-bio-information';
import { generateResponse } from '@/ai/flows/generate-response';
import { JobApplicationSchema, type GenerationResult } from '@/lib/schemas';

type ActionResponse = 
  | { success: true; data: GenerationResult }
  | { success: false; error: string };

export async function generateAction(
  rawData: unknown
): Promise<ActionResponse> {
  const validationResult = JobApplicationSchema.safeParse(rawData);
  if (!validationResult.success) {
    return { success: false, error: "Invalid input." };
  }

  const data = validationResult.data;

  try {
    const [analysis, filteredInfo] = await Promise.all([
      analyzeJobDescription({ jobDescription: data.jobDescription }),
      filterBioInformation({ jobDescription: data.jobDescription, bio: data.bio }),
    ]);

    const response = await generateResponse({
      jobDescription: data.jobDescription,
      userBio: data.bio,
      jobRequirements: data.requirements,
      additionalComments: data.comments ?? '',
    });

    return {
      success: true,
      data: {
        analysis,
        filteredInfo,
        response,
      },
    };
  } catch (error) {
    console.error("Error in generateAction:", error);
    return { success: false, error: "Failed to generate content. Please try again." };
  }
}
