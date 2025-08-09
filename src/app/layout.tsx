
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'JobSpark',
  description: 'Allow AI to boost your job application productivity',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <div className='flex-1 flex flex-col'>
            {children}
          </div>
          <Toaster />
          <footer className="w-full p-4 bg-muted/40 border-t">
            <div className="mx-auto w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
               <p>
                Created by{' '}
                <a
                  href="https://nareshmadhur.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-accent"
                >
                  Naresh
                </a>
              </p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="underline hover:text-accent">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
