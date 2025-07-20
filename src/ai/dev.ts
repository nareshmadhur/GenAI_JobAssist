import { config } from 'dotenv';
config();

import '@/ai/flows/generate-response.ts';
import '@/ai/flows/analyze-job-description.ts';
import '@/ai/flows/filter-bio-information.ts';