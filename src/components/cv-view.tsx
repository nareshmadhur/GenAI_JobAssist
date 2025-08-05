import React, { Fragment } from 'react';
import Markdown from 'react-markdown';
import type { CvOutput } from '@/ai/flows/generate-cv';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, BookOpen, Wrench, GraduationCap, Lightbulb, Star, Award, User } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  'summary': <User className="h-6 w-6 text-foreground" />,
  'personal statement': <User className="h-6 w-6 text-foreground" />,
  'work experience': <Briefcase className="h-6 w-6 text-foreground" />,
  'education': <GraduationCap className="h-6 w-6 text-foreground" />,
  'skills': <Wrench className="h-6 w-6 text-foreground" />,
  'projects': <Lightbulb className="h-6 w-6 text-foreground" />,
  'awards': <Award className="h-6 w-6 text-foreground" />,
  'presentations': <BookOpen className="h-6 w-6 text-foreground" />,
  'contact information': <User className="h-6 w-6 text-foreground" />,
  'hobbies and interests': <Star className="h-6 w-6 text-foreground" />,
  'professional affiliations': <Briefcase className="h-6 w-6 text-foreground" />,
};

function getIcon(title: string): React.ReactNode {
    const lowerCaseTitle = title.toLowerCase();
    return ICON_MAP[lowerCaseTitle] || <Briefcase className="h-6 w-6 text-foreground" />;
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
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <Markdown>{section.content}</Markdown>
              </div>
            )}
            {section.advice && section.advice.length > 0 && (
              <ul className="prose prose-sm max-w-none dark:prose-invert list-disc pl-5 space-y-2">
                {section.advice.map((point, i) => (
                  <li key={i} className="ml-5">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
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
