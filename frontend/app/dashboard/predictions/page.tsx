'use client';

import React, { useEffect, useState } from 'react';
import { useRouteStore } from '@/store/useRouteStore';
import { 
  TrendingDown, 
  AlertTriangle, 
  HelpCircle, 
  Calendar, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PredictionsDashboard() {
  const { roadsGeoJson, activeSegmentDetails, selectSegment, loading } = useRouteStore();
  const [selectedSegId, setSelectedSegId] = useState<string>('');

  useEffect(() => {
    // Select first segment by default if available
    const firstSegment = roadsGeoJson?.features?.[0]?.properties?.id;
    if (firstSegment) {
      setSelectedSegId(firstSegment);
      selectSegment(firstSegment);
    }
  }, [roadsGeoJson]);

  const handleSelectSegment = (id: string) => {
    setSelectedSegId(id);
    selectSegment(id);
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'Critical') return 'text-criticalRed bg-criticalRed/10 border-criticalRed/20';
    if (risk === 'High') return 'text-warningAmber bg-warningAmber/10 border-warningAmber/20';
    if (risk === 'Medium') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-neonGreen bg-neonGreen/10 border-neonGreen/20';
  };

  // Format prediction timeline data for Recharts line chart
  const getChartData = () => {
    if (!activeSegmentDetails?.predictions) return [];
    
    // Add current health as Day 0
    const current = {
      name: 'Day 0',
      health: activeSegmentDetails.properties.health || 80,
    };
    
    const timeline = activeSegmentDetails.predictions.map((p: any) => ({
      name: `Day ${p.days_out || new Date(p.forecastDate).getDate()}`, // parse day out
      health: p.projected_health || p.predictedHealthScore,
    }));

    return [current, ...timeline];
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
      
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight">AI Degradation Forecasting</h2>
        <p className="text-sm text-textSecondary mt-1">90-day time-series projections forecasting structural base failures before they develop.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Segments List */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-0">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-criticalRed" /> Tracked Sections
          </h3>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {roadsGeoJson?.features?.map((f: any) => {
              const properties = f.properties;
              const isSelected = properties.id === selectedSegId;
              return (
                <button
                  key={properties.id}
                  onClick={() => handleSelectSegment(properties.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? 'bg-electricBlue/10 border-electricBlue/60 text-white shadow-lg shadow-electricBlue/5' 
                      : 'bg-cardLight/30 border-border hover:bg-cardLight hover:border-border/80 text-textSecondary hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-semibold truncate">{properties.roadName}</h4>
                    <span className="text-[10px] font-mono">{properties.roadType}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-3">
                    <span className="font-mono">Health: <strong className="text-white">{properties.health}%</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold border ${getRiskColor(properties.risk)}`}>
                      {properties.risk}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Projections Display */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex-1 bg-card border border-border rounded-2xl flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
                <span className="text-xs text-textSecondary uppercase tracking-widest font-mono">Running forecasting models...</span>
              </div>
            </div>
          ) : activeSegmentDetails?.predictions && activeSegmentDetails.predictions.length > 0 ? (
            <>
              {/* Forecast graph card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">90-Day Structural Health Degradation Curve</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid stroke="#23273B" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#8E9AA8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8E9AA8" fontSize={11} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#12141F', border: '1px solid #23273B', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="health" name="Forecasted Health" stroke="#FF9100" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Projections timeline steps */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar size={18} className="text-electricBlue" /> Risk Outlook Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  {activeSegmentDetails.predictions.map((pred: any, index: number) => {
                    const daysOut = pred.days_out || (index + 1) * 30;
                    const health = pred.projected_health || pred.predictedHealthScore;
                    const risk = pred.risk_level || (health < 40 ? 'Critical' : health < 60 ? 'High' : health < 75 ? 'Medium' : 'Low');
                    const date = pred.projected_date || new Date(pred.forecastDate).toLocaleDateString();
                    const action = pred.recommended_action || (health < 40 ? 'Emergency Overhaul' : health < 60 ? 'Overlay Surface' : 'Preventative Seal');
                    
                    return (
                      <div key={index} className="p-4 bg-cardLight/30 border border-border rounded-xl flex flex-col justify-between hover:border-border/80 transition-all duration-200">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-mono font-bold text-electricBlue uppercase tracking-wide">Day {daysOut}</span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getRiskColor(risk)}`}>
                              {risk}
                            </span>
                          </div>
                          <div className="text-2xl font-extrabold font-mono text-white mb-1">{health}%</div>
                          <p className="text-[10px] text-textSecondary mb-4">Est. Date: {date}</p>
                        </div>
                        
                        <div className="border-t border-border pt-3 mt-2 text-xs">
                          <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono block mb-1">Recommended Plan</span>
                          <span className="text-white font-semibold flex items-center gap-1">
                            <ArrowRight size={12} className="text-electricBlue" /> {action}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col items-center justify-center text-center text-textSecondary p-6 min-h-[300px]">
              <HelpCircle size={48} className="text-border mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No AI Forecast Data</h3>
              <p className="text-xs max-w-[320px] leading-relaxed">
                Execute the AI road health scoring engine inside the Live GIS Map view to populate 90-day degradation predictions.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
