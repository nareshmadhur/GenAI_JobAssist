import { config } from 'dotenv';
config();

import '@/ai/flows/generate-cover-letter.ts';
import '@/ai/flows/generate-cv.ts';
import '@/ai/flows/generate-deep-analysis.ts';
import '@/ai/flows/analyze-job-description.ts';
import '@/ai/flows/filter-bio-information.ts';
import '@/ai/flows/revise-response.ts';
