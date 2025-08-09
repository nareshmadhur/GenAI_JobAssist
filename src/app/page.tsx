
import { BotMessageSquare, Briefcase, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { JobSparkLogo } from '@/components/job-spark-logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="w-full border-b border-b-accent bg-primary px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <JobSparkLogo className="h-10 w-10 text-primary-foreground" />
            <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                JobSpark
              </h1>
              <div className="text-xs text-primary-foreground/80">
                Your AI-Powered Career Assistant
              </div>
            </div>
          </div>
           <ThemeToggleButton />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Choose Your Path
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you're starting from scratch or have a job in mind, we can
              help.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Link href="/bio-creator" className="group">
              <Card className="h-full transform-gpu transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <BotMessageSquare className="h-8 w-8 text-accent" />
                    Bio Creator
                  </CardTitle>
                  <CardDescription>
                    Build a professional bio from scratch with our guided AI
                    chatbot. Perfect if you're not sure where to start.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-accent">
                    Start Building &rarr;
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/job-matcher" className="group">
              <Card className="h-full transform-gpu transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Briefcase className="h-8 w-8 text-accent" />
                    Job Matcher
                  </CardTitle>
                  <CardDescription>
                    Already have a job description and bio? Analyze them to
                    generate tailored application materials instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-accent">
                    Start Analyzing &rarr;
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
