
'use client';

import React from 'react';
import { useAuth } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { withAuth } from '@/components/with-auth';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import Link from 'next/link';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Bot } from 'lucide-react';

function AccountPage() {
  const { user, logout } = useAuth();

  return (
     <div className="flex flex-1 flex-col bg-muted/20">
       <header className="sticky top-0 z-10 w-full border-b border-b-accent bg-primary px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to Home">
                <AiJobAssistLogo className="h-10 w-10 text-primary-foreground" />
            </Link>
            <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                AI Job Assist
              </h1>
              <div className="text-xs text-primary-foreground/80">
                Your Account
              </div>
            </div>
          </div>
           <div className="flex items-center gap-2">
            <ThemeToggleButton />
           </div>
        </div>
      </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome!</CardTitle>
                        <CardDescription>
                            You are signed in and your data will be saved to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">
                            <strong>Email:</strong> {user?.email}
                        </p>
                        <Button onClick={logout} className="w-full">
                            Log Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}

export default withAuth(AccountPage);
