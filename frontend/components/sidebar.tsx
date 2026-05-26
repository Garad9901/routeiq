'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRouteStore } from '@/store/useRouteStore';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  Wrench, 
  AlertTriangle, 
  LogOut, 
  Activity, 
  User 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useRouteStore();

  const menuItems = [
    { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live GIS Map', path: '/dashboard/map', icon: Map },
    { name: 'Risk Predictions', path: '/dashboard/predictions', icon: TrendingUp },
    { name: 'Optimized Planner', path: '/dashboard/planner', icon: Wrench },
    { name: 'Citizen Intelligence', path: '/dashboard/complaints', icon: AlertTriangle },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between py-6 px-4 shrink-0">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-electricBlue flex items-center justify-center glow-blue text-background font-extrabold text-xl font-mono">
            RIQ
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono tracking-wider text-white">ROUTE<span className="text-electricBlue">IQ</span></h1>
            <p className="text-[10px] text-textSecondary uppercase tracking-widest">Smart Infrastructure</p>
          </div>
        </div>

        {/* User profile capsule */}
        {user.token && (
          <div className="mb-6 bg-cardLight/50 border border-border/60 rounded-xl p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-textSecondary">
              <User size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.email}</p>
              <span className="text-[10px] text-neonGreen font-mono uppercase bg-neonGreen/10 border border-neonGreen/20 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-electricBlue/10 text-electricBlue border-l-2 border-electricBlue pl-2.5' 
                    : 'text-textSecondary hover:bg-cardLight hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-electricBlue' : 'text-textSecondary'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="border-t border-border pt-4">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-textSecondary hover:bg-criticalRed/10 hover:text-criticalRed transition-all duration-200"
        >
          <LogOut size={18} />
          <span>System Logout</span>
        </button>
        <div className="mt-4 px-3 flex items-center justify-between text-[10px] text-textSecondary">
          <span className="flex items-center gap-1">
            <Activity size={10} className="text-neonGreen animate-pulse" /> Core Gateway
          </span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
