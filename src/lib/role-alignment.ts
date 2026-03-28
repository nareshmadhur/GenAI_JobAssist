import type { CvOutput, DeepAnalysisOutput } from '@/lib/schemas';

export interface RoleAlignmentHighlight {
  title: string;
  detail: string;
  emphasis: 'mandatory' | 'preferred' | 'skill';
}

const MAX_DETAIL_LENGTH = 120;

const stripMarkdown = (value: string) =>
  value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value: string, maxLength = MAX_DETAIL_LENGTH) => {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value.slice(0, maxLength).trim();
  const safeBreakpoint = Math.max(
    shortened.lastIndexOf('.'),
    shortened.lastIndexOf(','),
    shortened.lastIndexOf(' ')
  );

  return `${shortened.slice(0, safeBreakpoint > 40 ? safeBreakpoint : maxLength).trim()}...`;
};

const summariseJustification = (value: string) => {
  const cleaned = stripMarkdown(value);
  const firstSentence = cleaned.split(/(?<=[.!?])\s/)[0] || cleaned;
  return truncate(firstSentence);
};

const findEvidenceForSkill = (cvData: CvOutput, skill: string) => {
  const skillNeedle = skill.toLowerCase();
  const matchingBullet = cvData.workExperience
    .flatMap((job) => job.responsibilities)
    .find((responsibility) => responsibility.toLowerCase().includes(skillNeedle));

  if (matchingBullet) {
    return truncate(stripMarkdown(matchingBullet));
  }

  if (cvData.summary.toLowerCase().includes(skillNeedle)) {
    return 'Highlighted directly in your tailored professional summary.';
  }

  return 'Included as one of the most relevant skills for this application.';
};

export function getRoleAlignmentHighlights({
  cvData,
  deepAnalysis,
  jobDescription,
}: {
  cvData: CvOutput;
  deepAnalysis?: DeepAnalysisOutput | null;
  jobDescription?: string;
}): RoleAlignmentHighlight[] {
  const matchedRequirements = (deepAnalysis?.requirements || [])
    .filter((requirement) => requirement.isMet)
    .sort((left, right) => {
      if (left.isMandatory === right.isMandatory) {
        return 0;
      }
      return left.isMandatory ? -1 : 1;
    })
    .slice(0, 3)
    .map((requirement) => ({
      title: requirement.requirement,
      detail: summariseJustification(requirement.justification),
      emphasis: requirement.isMandatory ? ('mandatory' as const) : ('preferred' as const),
    }));

  if (matchedRequirements.length > 0) {
    return matchedRequirements;
  }

  const normalizedJobDescription = jobDescription?.toLowerCase() || '';
  const matchedSkills = cvData.skills
    .filter((skill) => normalizedJobDescription.includes(skill.toLowerCase()))
    .slice(0, 3)
    .map((skill) => ({
      title: skill,
      detail: findEvidenceForSkill(cvData, skill),
      emphasis: 'skill' as const,
    }));

  if (matchedSkills.length > 0) {
    return matchedSkills;
  }

  return cvData.skills.slice(0, 3).map((skill) => ({
    title: skill,
    detail: findEvidenceForSkill(cvData, skill),
    emphasis: 'skill' as const,
  }));
}
