import { JobSparkLogo } from '@/components/job-spark-logo';
import { JobSparkApp } from '@/components/job-spark-app';

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl mb-8">
        <div className="flex items-center gap-3">
          <JobSparkLogo className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl font-headline text-primary">
            JobSpark
          </h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Tailor your job applications in a spark. Let AI craft the perfect responses for you.
        </p>
      </header>
      <main className="w-full max-w-4xl">
        <JobSparkApp />
      </main>
      <footer className="w-full max-w-4xl py-8 mt-16 text-center text-sm border-t text-muted-foreground">
        <p>Built with ❤️ to make job hunting easier.</p>
      </footer>
    </div>
  );
}
