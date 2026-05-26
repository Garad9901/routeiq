'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteStore } from '@/store/useRouteStore';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useRouteStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!user.token) {
      router.push('/login');
    } else {
      setAuthChecked(true);
    }
  }, [user.token, router]);

  if (!authChecked) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
          <span className="text-xs text-textSecondary uppercase tracking-widest font-mono">Authenticating Portal Token...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-background text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0 p-8">
        {children}
      </main>
    </div>
  );
}
