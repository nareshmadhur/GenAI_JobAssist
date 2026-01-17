
'use client';

import React, { useState, useTransition } from 'react';
import { testModelAction, listModelsAction } from '@/app/actions';
import type { TestModelOutput } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { cn } from '@/lib/utils';

const modelsToTest = [
    'gemini-1.0-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro',
];

export default function AdminPage() {
    const [modelName, setModelName] = useState('googleai/gemini-1.5-flash');
    const [isTesting, startTesting] = useTransition();
    const [isListing, startListing] = useTransition();
    const [results, setResults] = useState<TestModelOutput[]>([]);
    const [modelList, setModelList] = useState<string[] | null>(null);
    const [listError, setListError] = useState<string | null>(null);

    const isLoading = isTesting || isListing;

    const handleTestModel = (name: string) => {
        if (!name) return;
        startTesting(async () => {
            const result = await testModelAction({ modelName: name });
            if ('error' in result) {
                setResults(prev => [...prev, { success: false, message: result.error, model: name }]);
            } else {
                setResults(prev => [...prev, result]);
            }
        });
    };
    
    const handleTestAll = () => {
        setResults([]);
        modelsToTest.forEach((model, index) => {
            setTimeout(() => {
                handleTestModel(`googleai/${model}`);
            }, index * 1000); // Stagger requests
        });
    }

    const handleListModels = () => {
        setListError(null);
        setModelList(null);
        startListing(async () => {
            const result = await listModelsAction();
            if ('error' in result) {
                setListError(result.error);
            } else if (result.models) {
                setModelList(result.models);
            }
        });
    };

    return (
        <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
            <header className="sticky top-0 z-10 w-full border-b border-b-accent bg-primary px-4 py-4 sm:px-6 md:px-8">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" aria-label="Back to Home">
                        <AiJobAssistLogo className="h-10 w-10 text-primary-foreground" />
                    </Link>
                    <div className="flex flex-col">
                    <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                        Admin Console
                    </h1>
                    <div className="text-xs text-primary-foreground/80">
                        Model Availability Tester
                    </div>
                    </div>
                </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6 md:p-8">
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Single Model</CardTitle>
                            <CardDescription>
                                Enter a model name to check if it's available. Remember to prefix custom models with `googleai/`.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Input 
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    placeholder="e.g., googleai/gemini-1.5-flash"
                                    disabled={isLoading}
                                />
                                <Button onClick={() => handleTestModel(modelName)} disabled={isLoading || !modelName}>
                                    {isTesting && results.length === 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Test Model
                                </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">Quick test:</span>
                                {modelsToTest.map(m => (
                                    <Button key={m} variant="outline" size="sm" onClick={() => setModelName(`googleai/${m}`)} disabled={isLoading}>{m}</Button>
                                ))}
                                <Button variant="secondary" size="sm" onClick={handleTestAll} disabled={isLoading}>Test All Prefixed</Button>
                            </div>

                            {isTesting && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Testing...</span></div>}

                            {results.length > 0 && (
                                <div className="space-y-2 pt-4">
                                     <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Test Results:</h3>
                                        <Button variant="outline" size="sm" onClick={() => setResults([])}>Clear Results</Button>
                                    </div>
                                    {results.map((result, index) => (
                                        <div key={index} className={cn("p-4 rounded-md border", result.success ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800')}>
                                            <p className="font-bold text-sm">Model: <code className="font-mono">{result.model}</code></p>
                                            <p className={cn("font-semibold", result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
                                                Status: {result.success ? 'Success' : 'Failed'}
                                            </p>
                                            <p className="text-xs mt-1 text-muted-foreground break-words"><code className="font-mono">{result.message}</code></p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>List Available Models</CardTitle>
                            <CardDescription>
                                Fetch a list of all generative models available to your API key.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleListModels} disabled={isLoading}>
                                {isListing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                List All Models
                            </Button>

                            {isListing && <div className="mt-4 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Fetching models...</span></div>}
                            
                            {listError && (
                                <div className="mt-4 p-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                                    <p className="font-bold text-red-700 dark:text-red-300">Error</p>
                                    <p className="text-xs mt-1 text-muted-foreground break-words"><code className="font-mono">{listError}</code></p>
                                </div>
                            )}
                            
                            {modelList && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Available Models ({modelList.length}):</h3>
                                        <Button variant="outline" size="sm" onClick={() => { setModelList(null); setListError(null); }}>Clear List</Button>
                                    </div>
                                    <div className="p-4 rounded-md border bg-muted/50 max-h-60 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {modelList.map(modelName => (
                                                <li key={modelName} className="font-mono text-sm">
                                                    {modelName}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
