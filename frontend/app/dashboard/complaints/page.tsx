'use client';

import React, { useEffect, useState } from 'react';
import { useRouteStore } from '@/store/useRouteStore';
import { 
  AlertTriangle, 
  MapPin, 
  HeartCrack, 
  Plus, 
  Sparkles, 
  Activity, 
  MessageSquare,
  BadgeAlert
} from 'lucide-react';

export default function CitizenIntelligenceDashboard() {
  const { complaints, fetchComplaints, submitComplaint, loading } = useRouteStore();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [lng, setLng] = useState<number>(-73.985);
  const [lat, setLat] = useState<number>(40.759);
  
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    await submitComplaint(title, description, lng, lat, category);
    setTitle('');
    setDescription('');
    setFormOpen(false);
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'Critical') return 'text-criticalRed bg-criticalRed/10 border-criticalRed/30';
    if (severity === 'High') return 'text-warningAmber bg-warningAmber/10 border-warningAmber/30';
    if (severity === 'Medium') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    return 'text-neonGreen bg-neonGreen/10 border-neonGreen/30';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Negative') return 'text-criticalRed border-criticalRed/20';
    return 'text-textSecondary border-border';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-border/60 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Citizen Complaint Intelligence</h2>
          <p className="text-sm text-textSecondary mt-1">NLP semantic diagnostics and sentiment mapping of citizen grievance logs.</p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="bg-electricBlue text-background hover:bg-electricBlue/95 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition duration-150 flex items-center gap-2 active:scale-95"
        >
          <Plus size={16} /> File New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Left Column: NLP / Category Analytics Stats */}
        <div className="bg-card border border-border rounded-2xl p-6 h-fit space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-electricBlue animate-pulse" /> NLP Semantic Diagnostics
          </h3>
          
          <div className="p-4 bg-cardLight/30 border border-border rounded-xl space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-textSecondary uppercase tracking-widest font-mono">Semantic Classifier</span>
              <p className="text-xs text-textSecondary leading-relaxed">
                Ingested complaints undergo automated sentiment score parsing and severity categorization using heuristic string arrays.
              </p>
            </div>
            <div className="h-px bg-border/60" />
            <div className="flex items-center gap-3 text-xs text-white">
              <Activity size={16} className="text-neonGreen" />
              <span>Real-time WebSocket alerting active for Critical classifications.</span>
            </div>
          </div>

          {/* Form Modal overlay (renders inline in sidebar column) */}
          {formOpen && (
            <form onSubmit={handleFormSubmit} className="p-5 border border-electricBlue/50 bg-electricBlue/[0.02] rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-electricBlue uppercase tracking-wider font-mono">File New Grievance</h4>
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-textSecondary uppercase tracking-wider block">Grievance Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep pothole next to intersection"
                  className="w-full bg-cardLight border border-border focus:border-electricBlue rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-textSecondary uppercase tracking-wider block">Detailed description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe dimensions, location details..."
                  rows={3}
                  className="w-full bg-cardLight border border-border focus:border-electricBlue rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-textSecondary uppercase tracking-wider block">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="w-full bg-cardLight border border-border focus:border-electricBlue rounded-lg p-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-textSecondary uppercase tracking-wider block">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="w-full bg-cardLight border border-border focus:border-electricBlue rounded-lg p-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-electricBlue text-background py-2 rounded-lg text-xs font-bold uppercase hover:bg-electricBlue/90 transition-all duration-200 glow-blue"
              >
                Ingest Report
              </button>
            </form>
          )}

        </div>

        {/* Right Column: Ingested Feed List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col min-h-0">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-electricBlue" /> Citizen Reports Feed
          </h3>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {complaints.length > 0 ? (
              complaints.map((c) => (
                <div key={c._id} className="p-5 bg-cardLight/30 border border-border rounded-xl space-y-4 hover:border-border/80 transition duration-150">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                      <p className="text-xs text-textSecondary mt-1 leading-relaxed">{c.description}</p>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${getSeverityColor(c.severity)}`}>
                      {c.severity}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40 text-[10px] font-mono text-textSecondary">
                    <span className="bg-border/60 text-white px-2 py-0.5 rounded uppercase">{c.category}</span>
                    <span className={`border px-2 py-0.5 rounded uppercase ${getSentimentColor(c.sentiment)}`}>
                      Sentiment: {c.sentiment}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-electricBlue" /> {c.location.coordinates[0].toFixed(4)}, {c.location.coordinates[1].toFixed(4)}
                    </span>
                    <span className="ml-auto text-[9px] text-textSecondary">
                      Reported: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-textSecondary p-12">
                <HeartCrack size={48} className="text-border mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">No Ingested Complaints</h3>
                <p className="text-xs max-w-[280px]">Citizen complaints database is currently empty.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
