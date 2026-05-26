import { create } from 'zustand';

export interface UserState {
  token: string | null;
  email: string | null;
  role: string | null;
}

interface RouteStore {
  user: UserState;
  roadsGeoJson: any | null;
  complaints: any[];
  activeBudget: number;
  selectedSegmentId: string | null;
  activeSegmentDetails: any | null;
  loading: boolean;
  kpis: any | null;
  complaintKpis: any | null;
  
  // Actions
  login: (email: string, role: string, token: string) => void;
  logout: () => void;
  setBudget: (budget: number) => void;
  selectSegment: (segmentId: string) => void;
  
  // Async operations
  fetchGeoJsonRoads: () => Promise<void>;
  fetchComplaints: () => Promise<void>;
  fetchDashboardKpis: () => Promise<void>;
  runAIEngine: (segmentId: string) => Promise<void>;
  submitComplaint: (title: string, description: string, lng: number, lat: number, category: string) => Promise<void>;
  approveRepair: (segmentId: string, repairType: string, cost: number, agency: string) => Promise<void>;
}

const API_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '/api/v1') : 'http://localhost/api/v1';

export const useRouteStore = create<RouteStore>((set, get) => ({
  user: {
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    email: typeof window !== 'undefined' ? localStorage.getItem('email') : null,
    role: typeof window !== 'undefined' ? localStorage.getItem('role') : null,
  },
  roadsGeoJson: null,
  complaints: [],
  activeBudget: 150000,
  selectedSegmentId: null,
  activeSegmentDetails: null,
  loading: false,
  kpis: null,
  complaintKpis: null,

  login: (email, role, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('email', email);
    set({ user: { token, role, email } });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    set({ user: { token: null, role: null, email: null }, activeSegmentDetails: null, selectedSegmentId: null });
  },

  setBudget: (budget) => set({ activeBudget: budget }),

  selectSegment: async (segmentId) => {
    set({ selectedSegmentId: segmentId, loading: true });
    try {
      const response = await fetch(`${API_URL}/roads/${segmentId}/predictions`);
      if (response.ok) {
        const predictions = await response.json();
        const currentSegment = get().roadsGeoJson?.features?.find(
          (f: any) => f.properties.id === segmentId
        );
        set({
          activeSegmentDetails: {
            properties: currentSegment?.properties || {},
            predictions: predictions || [],
          },
        });
      }
    } catch (e) {
      console.error('Error fetching segment details:', e);
    } finally {
      set({ loading: false });
    }
  },

  fetchGeoJsonRoads: async () => {
    try {
      const response = await fetch(`${API_URL}/roads/geojson`);
      if (response.ok) {
        const data = await response.json();
        set({ roadsGeoJson: data });
      }
    } catch (e) {
      console.error('Failed to load spatial segments:', e);
    }
  },

  fetchComplaints: async () => {
    try {
      const response = await fetch(`${API_URL}/complaints`);
      if (response.ok) {
        const data = await response.json();
        set({ complaints: data });
      }
    } catch (e) {
      console.error('Failed to load complaints:', e);
    }
  },

  fetchDashboardKpis: async () => {
    try {
      // 1. Fetch Roads KPI
      const resRoads = await fetch(`${API_URL}/roads/kpi`);
      const kpis = resRoads.ok ? await resRoads.json() : null;

      // 2. Fetch Complaints KPI
      const resComplaints = await fetch(`${API_URL}/complaints/kpi`);
      const complaintKpis = resComplaints.ok ? await resComplaints.json() : null;

      set({ kpis, complaintKpis });
    } catch (e) {
      console.error('Failed to fetch dashboard metrics:', e);
    }
  },

  runAIEngine: async (segmentId) => {
    const token = get().user.token;
    if (!token) return;
    
    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/roads/${segmentId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        // Refresh spatial layers and KPIs after computation
        await get().fetchGeoJsonRoads();
        await get().fetchDashboardKpis();
        // Update active segment detail preview
        set({
          activeSegmentDetails: {
            properties: {
              ...get().activeSegmentDetails?.properties,
              health: result.currentHealthScore,
              risk: result.riskLevel,
            },
            predictions: result.forecast?.forecast_timeline || [],
            explainability: result.explainability,
          }
        });
      }
    } catch (e) {
      console.error('Failed to run AI scoring pipeline:', e);
    } finally {
      set({ loading: false });
    }
  },

  submitComplaint: async (title, description, lng, lat, category) => {
    try {
      const response = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, lng, lat, category })
      });
      if (response.ok) {
        await get().fetchComplaints();
        await get().fetchDashboardKpis();
      }
    } catch (e) {
      console.error('Failed to submit citizen complaint:', e);
    }
  },

  approveRepair: async (segmentId, repairType, cost, agency) => {
    const token = get().user.token;
    if (!token) return;

    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/maintenance/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ segmentId, repairType, cost, agency })
      });

      if (response.ok) {
        // Refresh details, map segments, and dashboard metrics
        await get().fetchGeoJsonRoads();
        await get().fetchDashboardKpis();
        if (get().selectedSegmentId === segmentId) {
          get().selectSegment(segmentId);
        }
      }
    } catch (e) {
      console.error('Failed to submit repair approval:', e);
    } finally {
      set({ loading: false });
    }
  }
}));
