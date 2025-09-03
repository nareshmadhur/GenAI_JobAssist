
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/app-context';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { PrivacyDialog } from '@/components/privacy-dialog';
import { signupSchema } from '@/lib/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});


type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, signup } = useAuth();

  const isLoginMode = mode === 'login';
  const schema = isLoginMode ? loginSchema : signupSchema;

  const form = useForm<LoginData | SignupData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      ...(isLoginMode ? {} : { privacyPolicy: false }),
    },
  });

  const onSubmit = async (data: LoginData | SignupData) => {
    setError(null);
    setIsPending(true);

    let result;
    if (isLoginMode) {
      result = await login(data.email, data.password);
    } else {
      result = await signup(data.email, data.password);
    }

    if (result?.error) {
      setError(result.error);
    }
    
    setIsPending(false);
  };
  
  const { formState: { errors } } = form;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input id={`${mode}-email`} type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input id={`${mode}-password`} type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isLoginMode && (
            <FormField
            control={form.control}
            name="privacyPolicy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md py-1">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                     I have read and agree to the{' '}
                    <PrivacyDialog
                        trigger={
                            <span className="cursor-pointer text-accent underline">
                                Privacy Policy
                            </span>
                        }
                    />
                  </FormLabel>
                   <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        {error && <p className="text-xs text-destructive pt-1">{error}</p>}
        
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
}


export default function AuthPage() {
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
                Account
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Tabs defaultValue="login" className="w-full max-w-sm sm:w-96">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
             <Card>
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AuthForm mode="login" />
                </CardContent>
             </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
                <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>Sign up to save your progress and access your data from anywhere.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AuthForm mode="signup" />
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
