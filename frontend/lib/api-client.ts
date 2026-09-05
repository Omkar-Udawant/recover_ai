import axios from "axios";
import {
  AgentRunResponse,
  BatchRunResponse,
  CaseDetailResponse,
  CaseListResponse,
  DashboardData,
  HonestyData,
  PaymentLinkItem,
  PolicyData,
} from "./types";
import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    // 1. Check demo token
    let demoToken = window.localStorage.getItem("recoverai_demo_token");
    if (!demoToken && !supabase) {
      try {
        const res = await axios.post(`${API_BASE}/api/v1/auth/login`, {
          email: "demo@recoverai.local",
          password: "RecoverAI-local-demo-2026",
        });
        demoToken = res.data?.access_token;
        if (demoToken) {
          window.localStorage.setItem("recoverai_demo_token", demoToken);
        }
      } catch {
        // ignore
      }
    }
    if (demoToken) {
      config.headers.Authorization = `Bearer ${demoToken}`;
      return config;
    }

    // 2. Check supabase session
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          config.headers.Authorization = `Bearer ${data.session.access_token}`;
        }
      } catch {
        // ignore
      }
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.localStorage.removeItem("recoverai_demo_token");
    }
    return Promise.reject(error);
  }
);

export const api = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiClient.get<DashboardData>("/api/v1/dashboard");
    return res.data;
  },
  getHonesty: async (): Promise<HonestyData> => {
    const res = await apiClient.get<HonestyData>("/api/v1/agent/honesty");
    return res.data;
  },
  getPaymentLinks: async (limit: number = 20): Promise<PaymentLinkItem[]> => {
    const res = await apiClient.get<PaymentLinkItem[]>("/api/v1/payment-links", {
      params: { limit },
    });
    return res.data;
  },
  getPolicy: async (): Promise<PolicyData> => {
    const res = await apiClient.get<PolicyData>("/api/v1/agent/policy");
    return res.data;
  },
  getCases: async (params?: Record<string, any>): Promise<CaseListResponse> => {
    const res = await apiClient.get<CaseListResponse>("/api/v1/cases", {
      params,
    });
    return res.data;
  },
  getCaseDetail: async (caseId: string): Promise<CaseDetailResponse> => {
    const res = await apiClient.get<CaseDetailResponse>(`/api/v1/cases/${caseId}`);
    return res.data;
  },
  runAgent: async (payload: Record<string, any>): Promise<AgentRunResponse> => {
    const res = await apiClient.post<AgentRunResponse>("/api/v1/agent/run", payload);
    return res.data;
  },
  runBatch: async (payload: {
    limit?: number;
    tone?: string;
    respect_policy?: boolean;
    dry_run?: boolean;
  }): Promise<BatchRunResponse> => {
    const res = await apiClient.post<BatchRunResponse>("/api/v1/agent/run-batch", payload);
    return res.data;
  },
  sendEmail: async (payload: {
    case_id: string;
    tone: string;
    to_email?: string;
  }): Promise<{ to: string; template: string; status: string; cost_paise: number }> => {
    const res = await apiClient.post("/api/v1/send-email", payload);
    return res.data;
  },
  logVoice: async (payload: {
    case_id: string;
    lang: string;
  }): Promise<{ action_id: string; template: string; lang: string; script: string; cost_paise: number }> => {
    const res = await apiClient.post("/api/v1/log-voice", payload);
    return res.data;
  },
};
