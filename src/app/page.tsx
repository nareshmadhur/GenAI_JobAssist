
'use client';

import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/app-context';
import {
  Loader2,
  LogOut,
  Rocket,
  ScanText,
  User,
  UserRoundCheck,
  Sparkles,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

import { motion } from 'framer-motion';

export default function WelcomePage() {
  const { user, authLoading, logout } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b border-primary/5">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur group-hover:bg-primary/30 transition-all"></div>
              <AiJobAssistLogo className="h-8 w-8 text-primary relative" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI Job Assist</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:flex">
              <Link href="/job-matcher">Application Studio</Link>
            </Button>
            <Button asChild variant="ghost" className="hidden lg:flex">
              <Link href="/admin">
                <List className="mr-2 h-4 w-4" /> Application Tracker
              </Link>
            </Button>
            {authLoading ? (
              <Button variant="outline" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Application Tracker</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="shadow-lg shadow-primary/20">
                <Link href="/login">Log In</Link>
              </Button>
            )}
            <ThemeToggleButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 text-center md:pt-20 md:pb-24 bg-gradient-to-b from-primary/5 via-background to-background">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] -z-10"></div>
          
          <div className="absolute inset-x-0 top-0 h-full -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          
          <motion.div 
            className="container mx-auto max-w-5xl px-4 relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6 backdrop-blur-sm"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Trusted by ambitious job seekers
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="font-headline text-5xl font-extrabold tracking-tight text-foreground md:text-7xl lg:text-8xl text-balance leading-[1.1]"
            >
              Your AI Advantage in the
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x pb-2"> Job Market.</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground text-balance leading-relaxed"
            >
              Unlock the power of AI to transform your resume, build tailored cover letters, and master your interviews. Stop applying in the dark. <span className="text-foreground font-medium underline decoration-primary/30">Start getting offers.</span>
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
            >
              <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:-translate-y-1 relative group overflow-hidden rounded-2xl">
                <Link href="/job-matcher">
                  <span className="relative z-10 flex items-center gap-2">Build Your Application Now <Rocket className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-20 bg-muted/20 relative border-y border-primary/5">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center relative">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Three Steps to Your Next Offer
              </h2>
              <div className="h-1 w-20 bg-primary/20 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid gap-6 md:grid-cols-3 relative z-10">
              {[
                {
                  icon: ScanText,
                  title: "1. Extract & Build",
                  description: "Paste your dusty resume or LinkedIn bio. Let our AI instantly structure your professional history into a powerful Master Profile."
                },
                {
                  icon: UserRoundCheck,
                  title: "2. Analyze the Role",
                  description: "Drop in any Job Description. Our engine instantly extracts core requirements and scores your match percentage before you apply."
                },
                {
                  icon: Rocket,
                  title: "3. Generate & Win",
                  description: "With one click, produce ATS-beating resumes, highly tailored cover letters, and master your interviews with the AI Simulator."
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link href="/job-matcher" className="block group h-full">
                    <Card className="h-full bg-card/40 backdrop-blur-sm border-muted-foreground/10 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(124,58,237,0.1)] hover:-translate-y-2 relative overflow-hidden rounded-2xl border-primary/5 hover:border-primary/20">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary/10"></div>
                      <CardHeader className="items-start text-left pb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-xl shadow-primary/20 transition-transform group-hover:rotate-6">
                            <step.icon className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{step.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-left text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
