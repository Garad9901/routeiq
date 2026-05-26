'use client';

import React, { useEffect, useState } from 'react';
import { useRouteStore } from '@/store/useRouteStore';
import { 
  Activity, 
  MapPin, 
  AlertOctagon, 
  CheckCircle, 
  TrendingDown, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';

export default function ExecutiveDashboard() {
  const { kpis, complaintKpis, fetchDashboardKpis } = useRouteStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardKpis();
  }, []);

  if (!mounted || !kpis || !complaintKpis) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
          <span className="text-xs text-textSecondary uppercase tracking-widest font-mono">Aggregating Municipal Analytics...</span>
        </div>
      </div>
    );
  }

  // Setup data for graphs
  const riskChartData = [
    { name: 'Low Risk', value: kpis.riskDistribution?.Low || 0, fill: '#39FF14' },
    { name: 'Medium Risk', value: kpis.riskDistribution?.Medium || 0, fill: '#FFD60A' },
    { name: 'High Risk', value: kpis.riskDistribution?.High || 0, fill: '#FF9100' },
    { name: 'Critical', value: kpis.riskDistribution?.Critical || 0, fill: '#FF3B30' },
  ];

  const trendData = [
    { month: 'Jan', health: 82, complaints: 14 },
    { month: 'Feb', health: 79, complaints: 28 },
    { month: 'Mar', health: 78, complaints: 32 },
    { month: 'Apr', health: 74, complaints: 45 },
    { month: 'May', health: kpis.overallHealthIndex, complaints: complaintKpis.total },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Title */}
      <div className="flex justify-between items-center border-b border-border/60 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Executive Dashboard</h2>
          <p className="text-sm text-textSecondary mt-1">Real-time smart road health telemetry and operations control.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl text-xs font-mono text-textSecondary">
          <Clock size={14} className="text-electricBlue" />
          <span>Last Aggregated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Core KPI: Health Index */}
        <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden transition-all duration-300 hover:border-electricBlue/40">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Overall Health Index</span>
            <Activity className="text-electricBlue" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white font-mono">{kpis.overallHealthIndex}%</span>
            <span className="text-xs text-criticalRed flex items-center font-mono font-semibold">
              <TrendingDown size={12} className="mr-0.5" /> -2.4%
            </span>
          </div>
          <div className="w-full bg-border h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-electricBlue h-full rounded-full glow-blue" 
              style={{ width: `${kpis.overallHealthIndex}%` }}
            />
          </div>
        </div>

        {/* Core KPI: Total Km */}
        <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden transition-all duration-300 hover:border-neonGreen/40">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Total Managed network</span>
            <MapPin className="text-neonGreen" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white font-mono">{kpis.totalKm}</span>
            <span className="text-sm text-textSecondary font-mono uppercase">KM</span>
          </div>
          <p className="text-[10px] text-textSecondary mt-4 font-mono uppercase tracking-wider">3 primary routes active</p>
        </div>

        {/* Core KPI: High Risk Km */}
        <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden transition-all duration-300 hover:border-warningAmber/40">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">High Risk Sections</span>
            <AlertOctagon className="text-warningAmber" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-warningAmber font-mono">{kpis.highRiskKm}</span>
            <span className="text-sm text-textSecondary font-mono uppercase">KM</span>
          </div>
          <p className="text-[10px] text-textSecondary mt-4 font-mono uppercase tracking-wider">Requires preventative intervention</p>
        </div>

        {/* Core KPI: Unresolved complaints */}
        <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden transition-all duration-300 hover:border-criticalRed/40">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Citizen Grievances</span>
            <AlertOctagon className="text-criticalRed" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white font-mono">{complaintKpis.total}</span>
            <span className="text-xs text-neonGreen flex items-center font-mono font-semibold">
              <CheckCircle size={12} className="mr-0.5" /> {complaintKpis.resolved} Resolved
            </span>
          </div>
          <p className="text-[10px] text-textSecondary mt-4 font-mono uppercase tracking-wider">{complaintKpis.critical} Critical safety warnings</p>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Graph: Health Trajectory */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-bold text-white mb-6 tracking-wide">Network Health & Grievances Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#23273B" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#8E9AA8" fontSize={12} tickLine={false} />
                <YAxis stroke="#8E9AA8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12141F', border: '1px solid #23273B', borderRadius: '8px' }}
                  labelClassName="text-white font-bold"
                />
                <Area type="monotone" dataKey="health" name="Road Health %" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" />
                <Line type="monotone" dataKey="complaints" name="Complaints Ingested" stroke="#FF3B30" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Graph: Risk Segments counts */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-bold text-white mb-6 tracking-wide">Section Risk Classification</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData}>
                <XAxis dataKey="name" stroke="#8E9AA8" fontSize={11} tickLine={false} />
                <YAxis stroke="#8E9AA8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12141F', border: '1px solid #23273B', borderRadius: '8px' }}
                />
                <Bar dataKey="value" name="Segments Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Operational Highlights panel */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="text-lg font-bold text-white mb-4 tracking-wide">Critical Anomaly Board</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-criticalRed/5 border border-criticalRed/20 p-4 rounded-xl">
            <div className="h-9 w-9 rounded-lg bg-criticalRed/10 border border-criticalRed/20 flex items-center justify-center text-criticalRed shrink-0 font-bold">
              !
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h4 className="text-sm font-semibold text-white truncate">Critical Degradation Alert: FDR Drive Express</h4>
                <span className="text-[10px] font-mono text-textSecondary">Active Anomaly</span>
              </div>
              <p className="text-xs text-textSecondary">
                FastAPI score dropped to 32.0. Visual cracks anomaly detected. Automated maintenance schedule recommendation generated.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-warningAmber/5 border border-warningAmber/20 p-4 rounded-xl">
            <div className="h-9 w-9 rounded-lg bg-warningAmber/10 border border-warningAmber/20 flex items-center justify-center text-warningAmber shrink-0 font-bold">
              !
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h4 className="text-sm font-semibold text-white truncate">Grievance Surge: Broadway Boulevard</h4>
                <span className="text-[10px] font-mono text-textSecondary">Unresolved</span>
              </div>
              <p className="text-xs text-textSecondary">
                3 separate complaints regarding potholes. Sentiment check classified as highly negative. Urgent maintenance team deploy recommended.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
