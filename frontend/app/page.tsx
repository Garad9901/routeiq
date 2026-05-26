'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteStore } from '@/store/useRouteStore';

export default function RootIndex() {
  const router = useRouter();
  const { user } = useRouteStore();

  useEffect(() => {
    if (user.token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user.token, router]);

  return (
    <div className="min-screen bg-background flex flex-col items-center justify-center h-screen w-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold font-mono tracking-wider text-white">ROUTE<span className="text-electricBlue">IQ</span></h2>
        <p className="text-xs text-textSecondary uppercase tracking-widest animate-pulse">Initializing Security Session...</p>
      </div>
    </div>
  );
}
