
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { AppProvider } from '@/context/app-context';
import { CoPilotSidebar } from '@/components/co-pilot-sidebar';
import { PrivacyDialog } from '@/components/privacy-dialog';

export const metadata: Metadata = {
  title: 'AI Job Assist',
  description: 'Allow AI to boost your job application productivity',
};

import { CoPilotFab } from '@/components/co-pilot-fab';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-body antialiased`}>
        <AppProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
            <div className="flex flex-col min-h-screen">
                <div className="flex-1 flex flex-col">
                {children}
                </div>
                <footer className="w-full p-4 bg-muted/40 border-t">
                <div className="mx-auto w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                    <p>
                    Created by{' '}
                    <a
                        href="https://www.nareshmadhur.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:text-foreground"
                    >
                        Naresh Madhur
                    </a>
                    </p>
                    <div className="flex items-center gap-4">
                      <PrivacyDialog
                        trigger={
                          <button className="underline hover:text-foreground">
                            Privacy Policy
                          </button>
                        }
                      />
                    </div>
                </div>
                </footer>
            </div>
            <CoPilotSidebar />
            <CoPilotFab />
            <Toaster />
            </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
