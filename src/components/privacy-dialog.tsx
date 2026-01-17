
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface PrivacyDialogProps {
  trigger: React.ReactNode;
}

export function PrivacyDialog({ trigger }: PrivacyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              Welcome to AI Job Assist. We are committed to protecting your
              privacy. This application uses paid, secure AI services to process
              your data, offered to you at no cost by the developer, Naresh Madhur. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              application.
            </p>

            <h2>Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The
              information we may collect via the Application includes:
            </p>
            <ul>
              <li>
                <strong>Input Data:</strong> All data you provide, such as job
                descriptions and personal bios, is processed to provide the
                service. This data is used for the AI generation process and is
                stored temporarily in your browser's local storage to preserve
                your session. If you are logged in, this data is stored securely
                in your personal Firebase account.
              </li>
              <li>
                <strong>Local Storage:</strong> To provide a seamless user
                experience, we store your form data and saved applications
                directly in your browser's local storage. This data remains on
                your device and is not transmitted to our servers unless you are
                logged in.
              </li>
              <li>
                <strong>Analytics:</strong> We may collect anonymized usage data
                to understand how our application is used and to improve its
                functionality. This data does not include the content of your
                job descriptions or bios.
              </li>
            </ul>

            <h2>Use of Your Information</h2>
            <p>
              Having accurate information permits us to provide you with a
              smooth, efficient, and customized experience. Specifically, we may
              use information collected about you via the Application to:
            </p>
            <ul>
              <li>Generate tailored job application materials.</li>
              <li>Persist your session data for your convenience.</li>
              <li>Monitor and analyze usage and trends to improve your experience.</li>
              <li>Improve the application's functionality and user experience.</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally
              identifiable information to outside parties. The only external
              services we share your input data with are for the sole purpose of
              providing the application's core functionality:
            </p>
            <ul>
              <li>
                <strong>Google's Gemini API:</strong> To provide our services,
                we send your input data (job descriptions, bios, etc.) to
                Google's Gemini API for content generation. According to
                Google's policies, data sent to their paid enterprise APIs is not
                used for training their models and is secured in transit and at
                rest.
              </li>
              <li>
                <strong>Firebase:</strong> If you create an account, your data
                is stored in Google's Firebase services.
              </li>
            </ul>
            <p>
              We are not responsible for the data handling practices of these
              services. We encourage you to review their privacy policies.
            </p>

            <h2>Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures
              to help protect your personal information. While we have taken
              reasonable steps to secure the personal information you provide to
              us, please be aware that despite our efforts, no security
              measures are perfect or impenetrable, and no method of data
              transmission can be guaranteed against any interception or other
              type of misuse.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy,
              please contact us.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
