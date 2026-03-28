import type { CvOutput, DeepAnalysisOutput } from '@/lib/schemas';

const stripMarkdown = (value: string) =>
  value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const uniqueTerms = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const cleaned = stripMarkdown(value);
    if (cleaned.length < 3) {
      return;
    }

    const normalized = cleaned.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(cleaned);
  });

  return result;
};

const extractRequirementCandidates = (deepAnalysis?: DeepAnalysisOutput | null) =>
  (deepAnalysis?.requirements || [])
    .filter((requirement) => requirement.isMet)
    .sort((left, right) => {
      if (left.isMandatory === right.isMandatory) {
        return 0;
      }
      return left.isMandatory ? -1 : 1;
    })
    .flatMap((requirement) => {
      const cleanedRequirement = stripMarkdown(requirement.requirement);
      if (cleanedRequirement.length > 48) {
        return [];
      }

      return [cleanedRequirement];
    });

export function getRoleAlignmentTerms({
  cvData,
  deepAnalysis,
  jobDescription,
}: {
  cvData: CvOutput;
  deepAnalysis?: DeepAnalysisOutput | null;
  jobDescription?: string;
}) {
  const normalizedJobDescription = jobDescription?.toLowerCase() || '';
  const prioritizedSkills = cvData.skills
    .filter((skill) => normalizedJobDescription.includes(skill.toLowerCase()));

  const candidateTerms = uniqueTerms([
    ...prioritizedSkills,
    ...extractRequirementCandidates(deepAnalysis),
    ...cvData.skills,
  ])
    .sort((left, right) => right.length - left.length)
    .slice(0, 8);

  return candidateTerms;
}

export function getHighlightedTextSegments(text: string, highlightTerms: string[]) {
  if (!text.trim() || highlightTerms.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  const matchingTerms = highlightTerms
    .filter((term) => text.toLowerCase().includes(term.toLowerCase()))
    .sort((left, right) => right.length - left.length);

  if (matchingTerms.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  const matcher = new RegExp(
    `(${matchingTerms.map((term) => escapeRegex(term)).join('|')})`,
    'gi'
  );

  return text
    .split(matcher)
    .filter(Boolean)
    .map((segment) => ({
      text: segment,
      isHighlighted: matchingTerms.some(
        (term) => term.toLowerCase() === segment.toLowerCase()
      ),
    }));
}
