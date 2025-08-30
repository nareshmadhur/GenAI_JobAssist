
'use client'
import { JobSparkLogo } from '@/components/job-spark-logo';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useAppContext } from '@/context/app-context';


export default function PrivacyPolicyPage() {
    const { setIsCoPilotSidebarOpen } = useAppContext();
  return (
    <div className="flex flex-col flex-1 bg-muted/20">
       <header className="sticky top-0 z-10 w-full border-b border-b-accent bg-primary px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to Home">
                <JobSparkLogo className="h-10 w-10 text-primary-foreground" />
            </Link>
            <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                JobSpark
              </h1>
              <div className="text-xs text-primary-foreground/80">
                Privacy Policy
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
                variant="outline"
                onClick={() => setIsCoPilotSidebarOpen(true)}
            >
                <Bot className="mr-2 h-4 w-4" /> Co-pilot
            </Button>
            <ThemeToggleButton />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>Introduction</h2>
            <p>
              Welcome to JobSpark. We are committed to protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our application.
            </p>

            <h2>Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect via the
              Application includes:
            </p>
            <ul>
              <li>
                <strong>Input Data:</strong> All data you provide, such as job descriptions, personal bios, and
                specific questions, is processed to provide the service. This data is used for the AI generation
                process and is stored temporarily in your browser's local storage to preserve your session.
              </li>
              <li>
                <strong>Usage of Google's Gemini API:</strong> To provide our services, we send your input data (job
                descriptions, bios, etc.) to Google's Gemini API. Google processes this data in accordance with its
                own Privacy Policy and Terms of Service. We do not store this data on our servers after the request
                is completed.
              </li>
              <li>
                <strong>Local Storage:</strong> To provide a seamless user experience, we store your form data and saved
                applications directly in your browser's local storage. This data remains on your device and is not
                transmitted to our servers. Clearing your browser's cache or storage will permanently delete this data.
              </li>
            </ul>

            <h2>Use of Your Information</h2>
            <p>
              Having accurate information permits us to provide you with a smooth, efficient, and customized
              experience. Specifically, we may use information collected about you via the Application to:
            </p>
            <ul>
              <li>Generate tailored job application materials.</li>
              <li>Persist your session data for your convenience.</li>
              <li>Improve the application's functionality and user experience.</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
              The only external service we share your input data with is Google's Gemini API for the sole purpose of
              generating content as requested by you. We are not responsible for the data handling practices of Google.
              We encourage you to review Google's privacy policies.
            </p>

            <h2>Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal
              information. While we have taken reasonable steps to secure the personal information you provide to us,
              please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method
              of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2>Policy for Children</h2>
            <p>
              We do not knowingly solicit information from or market to children under the age of 13. If you become
              aware of any data we have collected from children under age 13, please contact us using the contact
              information provided below.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time in order to reflect, for example, changes to our
              practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by
              posting the new Privacy Policy on this page.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
