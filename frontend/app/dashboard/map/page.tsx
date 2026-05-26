'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouteStore } from '@/store/useRouteStore';
import { ShieldCheck, Cpu, HelpCircle, TrafficCone, Compass } from 'lucide-react';

// Load Leaflet component dynamically to avoid SSR window issues
const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-card border border-border flex items-center justify-center rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
        <span className="text-xs text-textSecondary uppercase tracking-widest font-mono">Initializing Maps API...</span>
      </div>
    </div>
  )
});

export default function GeospatialMapDashboard() {
  const { 
    roadsGeoJson, 
    complaints, 
    fetchGeoJsonRoads, 
    fetchComplaints, 
    activeSegmentDetails, 
    runAIEngine, 
    loading,
    user
  } = useRouteStore();

  useEffect(() => {
    fetchGeoJsonRoads();
    fetchComplaints();
  }, []);

  const handleTriggerAI = async () => {
    if (!activeSegmentDetails?.properties?.id) return;
    await runAIEngine(activeSegmentDetails.properties.id);
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'Critical') return 'text-criticalRed bg-criticalRed/10 border-criticalRed/30';
    if (risk === 'High') return 'text-warningAmber bg-warningAmber/10 border-warningAmber/30';
    if (risk === 'Medium') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    return 'text-neonGreen bg-neonGreen/10 border-neonGreen/30';
  };

  const hasWriteAccess = user.role === 'Admin' || user.role === 'Engineer';

  return (
    <div className="flex-1 flex gap-6 min-h-0 w-full max-w-7xl mx-auto">
      
      {/* Map Column */}
      <div className="flex-1 min-w-0 h-[80vh] flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Geospatial Intelligence Map</h2>
          <p className="text-sm text-textSecondary mt-1">Overlaying Sentinel-2 computer vision indices, citizen reports, and road segments.</p>
        </div>
        <div className="flex-1 relative">
          <MapComponent />
        </div>
      </div>

      {/* Control / Details Column */}
      <div className="w-80 shrink-0 flex flex-col bg-card border border-border rounded-2xl p-6 h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4 border-b border-border/60 pb-3 flex items-center gap-2">
          <Compass size={18} className="text-electricBlue" /> Section Inspector
        </h3>

        {activeSegmentDetails ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Properties summary */}
            <div className="space-y-5">
              <div>
                <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono">Road Name</span>
                <h4 className="text-base font-bold text-white mt-0.5">{activeSegmentDetails.properties.roadName}</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono">Current Health</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{activeSegmentDetails.properties.health}%</div>
                </div>
                <div>
                  <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono">Risk Level</span>
                  <div className={`text-xs font-mono font-bold uppercase mt-1.5 px-2 py-0.5 rounded border inline-block ${getRiskColor(activeSegmentDetails.properties.risk)}`}>
                    {activeSegmentDetails.properties.risk}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono">Length</span>
                  <div className="text-sm font-semibold mt-0.5 text-white">{activeSegmentDetails.properties.length} M</div>
                </div>
                <div>
                  <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono">Daily Traffic</span>
                  <div className="text-sm font-semibold mt-0.5 text-white">{activeSegmentDetails.properties.traffic} cars</div>
                </div>
              </div>

              {/* Explainable AI factors */}
              {activeSegmentDetails.explainability ? (
                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-bold text-electricBlue uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Cpu size={14} /> Explainable AI Insights
                  </h4>
                  <p className="text-xs text-white bg-cardLight p-3 rounded-lg border border-border/80 italic leading-relaxed mb-4">
                    "{activeSegmentDetails.explainability.primary_issue}"
                  </p>
                  
                  <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono block mb-2">SHAP Feature Weights</span>
                  <div className="space-y-2 text-xs">
                    {Object.entries(activeSegmentDetails.explainability.shap_values).map(([feature, val]: any) => {
                      const percentage = Math.abs(val) * 3;
                      const isNegative = val < 0;
                      return (
                        <div key={feature} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="capitalize text-textSecondary">{feature.replace('_', ' ')}</span>
                            <span className={`font-mono font-semibold ${isNegative ? 'text-criticalRed' : 'text-neonGreen'}`}>
                              {val > 0 ? `+${val}` : val}
                            </span>
                          </div>
                          <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isNegative ? 'bg-criticalRed' : 'bg-neonGreen'}`} 
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-border/60 bg-cardLight/30 rounded-xl p-4 flex gap-3 text-xs text-textSecondary leading-relaxed">
                  <HelpCircle className="text-textSecondary shrink-0" size={16} />
                  <span>Execute the AI road health scoring engine to extract explainable feature logs and risk weights.</span>
                </div>
              )}
            </div>

            {/* AI Calculation Trigger */}
            <div className="border-t border-border pt-4 mt-6">
              {hasWriteAccess ? (
                <button
                  onClick={handleTriggerAI}
                  disabled={loading}
                  className="w-full bg-electricBlue text-background py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-electricBlue/90 active:scale-[0.98] transition-all duration-200 glow-blue disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Cpu size={14} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Executing AI Models...' : 'Trigger AI Road Scorer'}
                </button>
              ) : (
                <div className="border border-border bg-cardLight/20 text-[10px] text-textSecondary p-2 rounded-lg text-center flex items-center justify-center gap-1.5 font-mono">
                  <ShieldCheck size={12} className="text-warningAmber" /> READ-ONLY PORTAL ACCESS
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-textSecondary gap-3">
            <TrafficCone size={48} className="text-border" />
            <p className="text-xs max-w-[200px] leading-relaxed">
              Select a road segment on the interactive map to inspect structural properties.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
