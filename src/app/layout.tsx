import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <footer className="w-full py-4 text-center text-sm text-muted-foreground">
            <Link href="https://www.nareshmadhur.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Created with ❤️ by Naresh
            </Link>
        </footer>
      </body>
    </html>
  );
}
