'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteStore } from '@/store/useRouteStore';
import { Eye, EyeOff, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useRouteStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  useEffect(() => {
    if (user.token) {
      router.push('/dashboard');
    }
  }, [user.token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials or connection issue.');
      }

      const data = await response.json();
      login(data.user.email, data.user.role, data.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Prefill helper for demo ease
  const handlePrefill = (role: 'Admin' | 'Engineer') => {
    if (role === 'Admin') {
      setEmail('admin@routeiq.com');
      setPassword('admin_routeiq_2026');
    } else {
      setEmail('engineer@routeiq.com');
      setPassword('engineer_routeiq_2026');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-electricBlue/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-neonGreen/5 blur-[120px]" />

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel glow-blue/20 relative z-10 transition-all duration-300">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-electricBlue flex items-center justify-center glow-blue text-background font-black text-2xl font-mono">
            RIQ
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-wider text-white">ROUTE<span className="text-electricBlue">IQ</span></h2>
          <p className="text-xs text-textSecondary uppercase tracking-widest mt-1">Smart Road Intelligence Platform</p>
        </div>

        {/* Security Warning Alert */}
        <div className="mb-6 border border-border bg-cardLight/30 rounded-xl p-3 flex gap-3 text-xs text-textSecondary items-center">
          <ShieldCheck className="text-neonGreen shrink-0" size={18} />
          <span>Restricted Portal. Authorized personnel only. User sessions are logged and audited.</span>
        </div>

        {/* Error Messages */}
        {errorMsg && (
          <div className="mb-4 bg-criticalRed/10 border border-criticalRed/20 text-criticalRed text-xs p-3 rounded-lg text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Email address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-textSecondary">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@city.gov"
                className="w-full bg-cardLight border border-border/80 focus:border-electricBlue rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">Access Key (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-textSecondary">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-cardLight border border-border/80 focus:border-electricBlue rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-electricBlue text-background py-2.5 rounded-lg text-sm font-semibold tracking-wider hover:bg-electricBlue/90 active:scale-[0.98] transition-all duration-200 glow-blue disabled:opacity-50 mt-6"
          >
            {loading ? 'Authenticating Security Logs...' : 'Authorize Login'}
          </button>
        </form>

        {/* Demo Prefills */}
        <div className="mt-8 border-t border-border/60 pt-6">
          <p className="text-[10px] text-textSecondary text-center uppercase tracking-widest mb-3 font-semibold">Prefill Demo Roles</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePrefill('Admin')}
              className="bg-cardLight border border-border hover:border-electricBlue text-xs py-2 rounded-lg text-textSecondary hover:text-white transition duration-200"
            >
              City Admin
            </button>
            <button
              onClick={() => handlePrefill('Engineer')}
              className="bg-cardLight border border-border hover:border-neonGreen text-xs py-2 rounded-lg text-textSecondary hover:text-white transition duration-200"
            >
              DOT Engineer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
