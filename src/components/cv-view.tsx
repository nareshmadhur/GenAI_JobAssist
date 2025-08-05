
import React, { useState } from 'react';
import type { CvOutput } from '@/ai/flows/generate-cv';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, GraduationCap, Wrench, User, Mail, Phone, MapPin, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';

function CopyButton({ textToCopy, className }: { textToCopy: string, className?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setIsCopied(true);
        toast({ title: 'CV content copied to clipboard!' });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Failed to copy text:', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Could not write to clipboard.',
        });
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      aria-label="Copy text"
      className={className}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

const formatCvToText = (cvData: CvOutput): string => {
  let text = '';
  text += `${cvData.fullName}\n`;
  text += `${cvData.email} | ${cvData.phone} | ${cvData.location}\n\n`;
  
  text += '--- Summary ---\n';
  text += `${cvData.summary}\n\n`;

  text += '--- Work Experience ---\n';
  cvData.workExperience.forEach(job => {
    text += `${job.jobTitle} | ${job.company} (${job.duration})\n`;
    job.responsibilities.forEach(res => {
      text += `- ${res}\n`;
    });
    text += '\n';
  });

  text += '--- Education ---\n';
  cvData.education.forEach(edu => {
    text += `${edu.degree}, ${edu.institution} (${edu.year || 'N/A'})\n`;
  });
  text += '\n';

  text += '--- Skills ---\n';
  text += cvData.skills.join(', ');

  return text;
};

export function CvView({ cvData }: { cvData: CvOutput }) {
  if (!cvData) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No CV could be generated based on the provided input.</p>
        </CardContent>
      </Card>
    );
  }
  
  const plainTextCv = formatCvToText(cvData);

  return (
    <Card className="font-sans">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mockup CV</CardTitle>
            <CopyButton textToCopy={plainTextCv} />
        </CardHeader>
      <CardContent className="p-6 text-sm">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">{cvData.fullName}</h1>
          <div className="mt-2 flex justify-center items-center gap-x-4 gap-y-1 text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{cvData.email}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{cvData.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{cvData.location}</div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Summary Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
            <User className="h-5 w-5" /> Professional Summary
          </h2>
          <p className="text-muted-foreground">{cvData.summary}</p>
        </div>

        <Separator className="my-6" />

        {/* Work Experience Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Work Experience
          </h2>
          <div className="space-y-6">
            {cvData.workExperience.map((job, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-semibold text-foreground">{job.jobTitle}</h3>
                  <p className="text-sm text-muted-foreground">{job.duration}</p>
                </div>
                <h4 className="text-md font-medium text-primary">{job.company}</h4>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                  {job.responsibilities.map((responsibility, i) => (
                    <li key={i}>{responsibility}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Education Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Education
          </h2>
          <div className="space-y-2">
            {cvData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{edu.degree}</h3>
                    <p className="text-md text-muted-foreground">{edu.institution}</p>
                </div>
                <p className="text-sm text-muted-foreground">{edu.year}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Skills Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
            <Wrench className="h-5 w-5" /> Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {cvData.skills.map((skill, index) => (
              <div key={index} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                {skill}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
