'use client';

import React, { useEffect, useState } from 'react';
import { useRouteStore } from '@/store/useRouteStore';
import { Wrench, ShieldCheck, HelpCircle, Check, DollarSign, ArrowUpRight } from 'lucide-react';

export default function PlannerDashboard() {
  const { user, approveRepair } = useRouteStore();
  const [budget, setBudget] = useState<number>(150000);
  const [plannerData, setPlannerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [executingRepairId, setExecutingRepairId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  const fetchOptimizationPlan = async (targetBudget: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/maintenance/optimize?budget=${targetBudget}`);
      if (response.ok) {
        const data = await response.json();
        setPlannerData(data);
      }
    } catch (e) {
      console.error('Error fetching planner optimization:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizationPlan(budget);
  }, [budget]);

  const handleApproveRepair = async (segmentId: string, repairType: string, cost: number) => {
    setExecutingRepairId(segmentId);
    try {
      await approveRepair(segmentId, repairType, cost, 'Municipal DOT Team');
      // Refresh current plan
      await fetchOptimizationPlan(budget);
    } catch (e) {
      console.error(e);
    } finally {
      setExecutingRepairId(null);
    }
  };

  const hasWriteAccess = user.role === 'Admin' || user.role === 'Engineer';

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Title */}
      <div className="border-b border-border/60 pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight">AI Maintenance Planner</h2>
        <p className="text-sm text-textSecondary mt-1">AI-driven budget-aware scheduler. Maximizing road lifespan and ROI under municipal cost constraints.</p>
      </div>

      {/* Budget Optimization Controls */}
      <div className="p-6 rounded-2xl bg-card border border-border grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-baseline">
            <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-widest">Available Maintenance Budget</h3>
            <span className="text-2xl font-extrabold text-white font-mono">${budget.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="20000"
            max="500000"
            step="10000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-electricBlue focus:outline-none"
          />
          <div className="flex justify-between text-[10px] font-mono text-textSecondary">
            <span>$20,000</span>
            <span>$250,000</span>
            <span>$500,000</span>
          </div>
        </div>

        {/* Aggregate Stats */}
        {plannerData && (
          <div className="p-4 bg-cardLight/30 border border-border rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-textSecondary">
              <span>Proposed Cost:</span>
              <span className="font-mono text-white font-semibold">${plannerData.totalCostApproved?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-textSecondary">
              <span>Remaining Buffer:</span>
              <span className="font-mono text-neonGreen font-semibold">${plannerData.remainingBudget?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-textSecondary">
              <span>Section Repairs Approved:</span>
              <span className="font-mono text-white font-semibold">{plannerData.approvedRepairsCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Approved Plan List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench size={18} className="text-electricBlue" /> Prioritized Repairs Recommended
        </h3>

        {loading && !plannerData ? (
          <div className="bg-card border border-border rounded-2xl flex items-center justify-center p-12">
            <div className="h-8 w-8 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
          </div>
        ) : plannerData?.approvedPlan?.length > 0 ? (
          <div className="overflow-x-auto border border-border rounded-2xl">
            <table className="w-full text-left border-collapse bg-card">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase font-mono tracking-widest text-textSecondary">
                  <th className="p-4">Road Name / Segment</th>
                  <th className="p-4">Repair Method</th>
                  <th className="p-4 text-center">Urgency</th>
                  <th className="p-4 text-center">ROI Index</th>
                  <th className="p-4 text-right">Est. Cost</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-textSecondary">
                {plannerData.approvedPlan.map((plan: any) => (
                  <tr key={plan.segmentId} className="hover:bg-cardLight/20 transition duration-150">
                    <td className="p-4 font-semibold text-white">
                      {plan.roadName}
                      <span className="block text-[10px] text-textSecondary font-mono mt-0.5">ID: {plan.segmentId.slice(0, 8)}...</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-border/60 border border-border text-[11px] text-white px-2 py-0.5 rounded">
                        {plan.repairType}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-warningAmber font-mono font-bold">{plan.urgencyScore}/10</span>
                    </td>
                    <td className="p-4 text-center text-neonGreen font-mono font-bold">{plan.roiIndex}x</td>
                    <td className="p-4 text-right text-white font-mono font-semibold">${plan.estimatedCost.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      {hasWriteAccess ? (
                        <button
                          onClick={() => handleApproveRepair(plan.segmentId, plan.repairType, plan.estimatedCost)}
                          disabled={executingRepairId === plan.segmentId}
                          className="bg-neonGreen text-background hover:bg-neonGreen/90 font-bold px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase transition duration-150 flex items-center gap-1.5 ml-auto active:scale-95"
                        >
                          <Check size={12} />
                          {executingRepairId === plan.segmentId ? 'Executing...' : 'Approve Repair'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-textSecondary italic">Forbidden</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center text-center text-textSecondary p-12">
            <HelpCircle size={48} className="text-border mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Recommended Repairs</h3>
            <p className="text-xs max-w-[280px]">All active segments currently exceed health baselines, or budget is set too low.</p>
          </div>
        )}
      </div>

      {/* Deferred Plan List */}
      {plannerData?.deferredPlan?.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-textSecondary uppercase tracking-widest">Deferred Repairs (Budget Backlog)</h4>
          <div className="overflow-x-auto border border-border/60 rounded-2xl">
            <table className="w-full text-left border-collapse bg-card/65">
              <tbody className="divide-y divide-border/60 text-xs text-textSecondary">
                {plannerData.deferredPlan.map((plan: any) => (
                  <tr key={plan.segmentId} className="opacity-60 bg-background/25">
                    <td className="p-4 font-semibold text-textSecondary">
                      {plan.roadName}
                      <span className="block text-[10px] text-textSecondary font-mono mt-0.5">ID: {plan.segmentId.slice(0, 8)}...</span>
                    </td>
                    <td className="p-4">{plan.repairType}</td>
                    <td className="p-4 text-center font-mono">Urgency: {plan.urgencyScore}/10</td>
                    <td className="p-4 text-right text-textSecondary font-mono">${plan.estimatedCost.toLocaleString()}</td>
                    <td className="p-4 text-right italic font-mono text-[10px] text-warningAmber">Out of Budget</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
