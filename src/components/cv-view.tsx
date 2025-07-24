import React, { Fragment } from 'react';
import Markdown from 'react-markdown';
import type { CvOutput } from '@/ai/flows/generate-cv';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, BookOpen, Wrench, GraduationCap, Lightbulb, Star, Award, User } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  'summary': <User className="h-6 w-6 text-primary" />,
  'personal statement': <User className="h-6 w-6 text-primary" />,
  'work experience': <Briefcase className="h-6 w-6 text-primary" />,
  'education': <GraduationCap className="h-6 w-6 text-primary" />,
  'skills': <Wrench className="h-6 w-6 text-primary" />,
  'projects': <Lightbulb className="h-6 w-6 text-primary" />,
  'awards': <Award className="h-6 w-6 text-primary" />,
  'presentations': <BookOpen className="h-6 w-6 text-primary" />,
  'contact information': <User className="h-6 w-6 text-primary" />,
  'hobbies and interests': <Star className="h-6 w-6 text-primary" />,
  'professional affiliations': <Briefcase className="h-6 w-6 text-primary" />,
};

function getIcon(title: string): React.ReactNode {
    const lowerCaseTitle = title.toLowerCase();
    return ICON_MAP[lowerCaseTitle] || <Briefcase className="h-6 w-6 text-primary" />;
}

export function CvView({ cvData }: { cvData: CvOutput }) {
  if (!cvData || !cvData.sections || cvData.sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No CV advice could be generated based on the provided input.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {cvData.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getIcon(section.title)}
              <span className="capitalize">{section.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.content && (
              <div className="prose prose-sm max-w-none">
                <Markdown>{section.content}</Markdown>
              </div>
            )}
            {section.advice && section.advice.length > 0 && (
              <ul className="prose prose-sm max-w-none list-disc pl-5 space-y-2">
                {section.advice.map((point, i) => (
                  <li key={i} className="ml-5">
                    <div className="prose prose-sm max-w-none">
                        <Markdown components={{ p: Fragment }}>{point}</Markdown>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
