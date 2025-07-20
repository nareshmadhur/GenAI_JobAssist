import { JobSparkLogo } from '@/components/job-spark-logo';
import { JobSparkApp } from '@/components/job-spark-app';

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 w-full px-4 py-4 bg-background/80 backdrop-blur-sm border-b sm:px-6 md:px-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <JobSparkLogo className="w-10 h-10 text-primary" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold md:text-3xl font-headline text-primary">
                AI Job Assist
              </h1>
              <p className="text-xs text-muted-foreground">
                An attempt to make job application easier (for chickadee) made with love.
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="w-full max-w-7xl mx-auto flex-1">
        <JobSparkApp />
      </main>
      <footer className="w-full max-w-7xl mx-auto py-6 px-4 text-center text-sm border-t text-muted-foreground">
        <p>Built with ❤️ to make job hunting easier.</p>
      </footer>
    </div>
  );
}
