
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, ScanText, UserRoundCheck } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <AiJobAssistLogo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AI Job Assist</span>
          </Link>
          <nav className="flex items-center gap-2">
             <Button asChild variant="ghost">
                <Link href="/job-matcher">Job Matcher</Link>
            </Button>
             <Button asChild variant="ghost">
                <Link href="/admin">Admin</Link>
            </Button>
            <Button asChild>
                <Link href="/login">Log In</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 text-center md:py-32">
          <div className="container mx-auto max-w-4xl px-4">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Land Your Dream Job, Faster.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              AI Job Assist is your personal AI assistant. We analyze job
              descriptions, tailor your bio, and generate everything you need for
              a standout application.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/job-matcher">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-muted/40 py-20 md:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-headline text-3xl font-bold text-foreground">
                How It Works
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                A simple, powerful three-step process to a better application.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Link href="/job-matcher" className="block group">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="items-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <ScanText className="h-6 w-6" />
                      </div>
                    <CardTitle>1. Craft Your Bio</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-sm text-muted-foreground">
                    Use our integrated AI-powered chat to build a comprehensive professional
                    bio from scratch, or simply paste your existing resume.
                  </CardContent>
                </Card>
              </Link>
              <Link href="/job-matcher" className="block group">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <UserRoundCheck className="h-6 w-6" />
                      </div>
                    <CardTitle>2. Analyze the Role</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-sm text-muted-foreground">
                    Provide a job description, and our AI will pinpoint the key
                    skills, requirements, and company values.
                  </CardContent>
                </Card>
              </Link>
              <Link href="/job-matcher" className="block group">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="items-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <Rocket className="h-6 w-6" />
                      </div>
                    <CardTitle>3. Generate & Apply</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-sm text-muted-foreground">
                    Instantly generate a tailored cover letter, CV, and answers
                    to specific questions, giving you a powerful head start.
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
