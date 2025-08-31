
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/app-context';
import { Loader2 } from 'lucide-react';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuth(props: P) {
    const { user, authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!authLoading && !user) {
        router.push('/login');
      }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return <Component {...props} />;
  };
}
