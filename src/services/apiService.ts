import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_BACKEND_URL || '';

// Always use absolute URLs for API calls in development

console.log('Backend URL configured:', API_BASE_URL);

// ============================================================================
// AXIOS CLIENT SETUP
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Changed to true to support credentials
  timeout: 30000, // Increased timeout to 30 seconds
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// ============================================================================
// AUTH IMPERSONATION
// ============================================================================

export const impersonateAgent = async (agentUsername: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post(`${API_BASE_URL}/api/auth/impersonate/${agentUsername}`);
    return {
      success: true,
      token: response.data.token,
      role: response.data.role,
    };
  } catch (error) {
    console.error('Impersonation error:', error);
    return {
      success: false,
      message: 'Failed to login as agent',
    };
  }
};

export const impersonateTeam = async (teamUsername: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post(`${API_BASE_URL}/api/auth/impersonate/team/${teamUsername}`);
    
    // Check if the response indicates failure (null token/role)
    if (!response.data.token || !response.data.role) {
      return {
        success: false,
        message: 'Team not found or access denied',
      };
    }
    
    return {
      success: true,
      token: response.data.token,
      role: response.data.role,
    };
  } catch (error) {
    console.error('Team impersonation error:', error);
    return {
      success: false,
      message: 'Failed to login as team',
    };
  }
};

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('API Request:', config.method?.toUpperCase(), config.url, token ? 'Token present' : 'No token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error: AxiosError) => {
    // Don't log expected 403 errors for client endpoint (not implemented yet)
    const isExpectedClientError = error.config?.url === '/api/dashboard/clients' && error.response?.status === 403;
    
    if (!isExpectedClientError) {
      const currentRole = localStorage.getItem('userRole');
      console.error(`API Error [Role: ${currentRole}]:`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    if (error.response?.status === 401) {
      // Only handle 401 Unauthorized - clear auth and redirect to login
      console.log('Authentication failed - clearing session');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    // Don't auto-clear on 403 - let the app handle it
    return Promise.reject(error);
  }
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LoginResponse {
  success: boolean;
  token?: string;
  role?: string;
  message?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    role?: string;
  };
}

export interface Agent {
  id_agent: number;
  ID: number;
  username: string;
  mostCurrentUserGroup?: string;
  costPerHour?: number;
  campaign?: string;
  most_recent_user_group?: string;
  calls: number;
  time?: string;
  pause?: string;
  wait?: string;
  talk?: string;
  dispo?: string;
  dead?: string;
  customer?: string;
  callbk?: number;
  N?: number;
  NI?: number;
  SALE?: number;
  role?: string;
  team?: Team;
}

export interface Team {
  id: number;
  username: string;
  calls: number;
  leads?: number;
  contacts?: number;
  contactRatio?: string;
  nopause_time?: string;
  system_time?: string;
  talkTime?: string;
  Sales: number;
  sales_per_working_hour?: number;
  sales_to_leads_ratio?: string;
  sales_to_contacts_ratio?: string;
  sales_per_hour?: number;
  incomplete_sales?: number;
  cancelled_sales?: number;
  callbacks?: number;
  first_call_resolution?: number;
  avg_sale_time?: string;
  avg_contact_time?: string;
  role?: string;
  agents?: Agent[];
}

export interface SystemSummary {
  totalAgents: number;
  totalTeams: number;
  totalCalls: number;
  totalSales: number;
  systemStatus: string;
  lastUpdated: string;
}

export interface FullView {
  teams: Team[];
  agents: Agent[];
  systemSummary: SystemSummary;
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  /**
   * Login with username and password
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    // Use absolute URL for login
    const response = await apiClient.post<LoginResponse>(
      `/api/auth/login`,
      { username, password },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );
    console.log('Login response:', response.data);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', response.data.role || '');
      localStorage.setItem('userEmail', username);
      console.log('Token stored:', response.data.token);
    }
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post(`/api/auth/logout`);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string, newPassword: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/auth/reset-password`, {
      email,
      newPassword,
    });
    return response.data;
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardAPI = {
  /**
   * Health check
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/api/dashboard/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get system summary
   */
  getSystemSummary: async (): Promise<SystemSummary> => {
    const response = await apiClient.get<SystemSummary>(`/api/dashboard/system-summary`);
    return response.data;
  },

  /**
   * Get full view (for NOVA role)
   */
  getFullView: async (): Promise<FullView> => {
    const response = await apiClient.get<FullView>(`/api/dashboard/full-view`);
    return response.data;
  },

  /**
   * Get all teams
   */
  getTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>(`/api/dashboard/teams`);
    return response.data;
  },
};

// ============================================================================
// TEAM API
// ============================================================================

export const teamAPI = {
  /**
   * Get ALL teams stats (For Admin/Nova Dashboard)
   * Returns a List []
   */
  getAllTeams: async (): Promise<TeamStatsDTO[]> => {
    // 1. Point back to the main endpoint for the list
    const response = await apiClient.get<TeamStatsDTO[]>(`/api/dashboard/teams`);
    return response.data;
  },

  /**
   * Get ONLY connected team stats (For Team Dashboard)
   * Returns a Single Object {}
   */
  getMyTeamStats: async (): Promise<TeamStatsDTO> => {
    // 2. Point to the new /me endpoint
    const response = await apiClient.get<TeamStatsDTO>(`/api/dashboard/teams/me`);
    return response.data;
  },

  /**
   * Get top 5 teams
   */
  getTop5Teams: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>(`/api/dashboard/teams/top-5`);
    return response.data;
  },

  /**
   * Reset team password
   */
  resetPassword: async (id: number, password: string): Promise<string> => {
    const response = await apiClient.patch(`/api/dashboard/teams/${id}/reset-password`, { password });
    return response.data;
  },

  /**
   * Create a new team
   */
  createTeam: async (team: { username: string; password: string; email?: string; telephone?: string }) => {
    const response = await apiClient.post(`/api/dashboard/teams`, team);
    return response.data;
  },
  
  /**
   * Update team cost (Rate/hr)
   */
  updateTeamCost: async (id: number, cost: number): Promise<string> => {
    const response = await apiClient.patch(`/api/dashboard/teams/${id}/cost`, { cost });
    return response.data;
  },
};
// ============================================================================
// AGENT API
// ============================================================================

export const agentAPI = {
  /**
   * Get all agents
   */
  getAllAgents: async (): Promise<Agent[]> => {
    const response = await apiClient.get<Agent[]>(`/api/dashboard/agent/all`);
    return response.data;
  },

  /**
   * Get agent by ID
   */
  getAgentById: async (id: number): Promise<Agent> => {
    const response = await apiClient.get<Agent>(`/api/dashboard/agent/${id}`);
    return response.data;
  },

  /**
   * Get my stats (uses Principal from backend - no username needed)
   */
  getMyStats: async (username?: string): Promise<AgentStatsDTO> => {
    const response = await apiClient.get<AgentStatsDTO>(`/api/dashboard/agent/my-stats`);
    return response.data;
  },

  /**
   * Get top 5 agents
   */
  getTop5Agents: async (): Promise<AgentStatsDTO[]> => {
    const response = await apiClient.get<AgentStatsDTO[]>(`/api/dashboard/agent/top-5`);
    return response.data;
  },

  /**
   * Create agent
   */
  createAgent: async (agent: Partial<Agent>): Promise<Agent> => {
    const response = await apiClient.post<Agent>(`/api/dashboard/agent`, agent);
    return response.data;
  },

  /**
   * Update agent
   */
  updateAgent: async (id: number, agent: Partial<Agent>): Promise<Agent> => {
    const response = await apiClient.put<Agent>(`/api/dashboard/agent/${id}`, agent);
    return response.data;
  },

  /**
   * Reset agent password
   */
  resetPassword: async (id: number, password: string): Promise<{ message: string }> => {
    // 1. Must be .patch
    // 2. Body must have the key "password" to match payload.get("password") in Java
    const response = await apiClient.patch(`/api/dashboard/agent/${id}/reset-password`, { 
      password: password 
    });
    return { message: response.data };
  },

  /**
   * Update agent cost per hour
   */
  // Update this in services/apiService.ts
updateCostPerHour: async (id: number | string, cost: number): Promise<string> => {
  // 1. Ensure ID is valid
  if (!id) throw new Error("Agent ID is missing");

  // 2. Force the payload to match the backend Map<String, Double>
  const payload = { 
    cost: Number(cost) 
  };

  try {
    const response = await apiClient.patch(
      `/api/dashboard/agent/${id}/cost`, 
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Backend Error Details:", error.response?.data);
    throw error;
  }
},
};

// ============================================================================
// CLIENT API
// ============================================================================

/**
 * Format date to YYYY-MM-DD format
 */
const formatDateToYYYYMMDD = (date: any): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  
  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Parse ISO date string or create from Date
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
};

export interface Client {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  adresse?: string;
  code_postal?: string;
  commentaire?: string;
  date_visite?: string;
  date_creation?: string;
  nom_service?: string;
  statut_service?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'en_attente' | 'confirme' | 'termine' | 'annule';
  recordingUrl?: string; 
  agent?: {
    username?: string;
    campaign?: string;
  };
  nomComplet?: string;
  statutService?: string;
}

export const clientAPI = {
  /**
   * Get all clients
   */
  getAllClients: async (): Promise<Client[]> => {
    const response = await apiClient.get<Client[]>(`/api/clients`);
    // Map response and ensure all date fields are properly set
    return response.data.map((client: any) => ({
      ...client,
      // Handle date_creation - try multiple field names that backend might use, and format to YYYY-MM-DD
      date_creation: formatDateToYYYYMMDD(
        client.date_creation || 
        client.dateCreation || 
        client.created_at || 
        client.createdAt ||
        client.date_enregistrement
      ),
      // Ensure date_visite is also properly set and formatted
      date_visite: formatDateToYYYYMMDD(client.date_visite || client.dateVisite || client.date_visit) || 'Not scheduled'
    }));
  },

  /**
   * Get client by ID
   */
  getClientById: async (id: number): Promise<Client> => {
    const response = await apiClient.get<Client>(`/api/clients/${id}`);
    return response.data;
  },

  /**
   * Create client
   */
  createClient: async (client: Partial<Client>): Promise<Client> => {
    const response = await apiClient.post<Client>(`/api/clients`, client);
    return response.data;
  },

  /**
   * Update client
   */
  updateClient: async (id: number, client: Partial<Client>): Promise<Client> => {
    const response = await apiClient.put<Client>(`/api/clients/${id}`, client);
    return response.data;
  },

  /**
   * Update client status
   */
  updateClientStatus: async (id: number, status: string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`/api/clients/${id}/statut`, { statut: status });
    return response.data;
  },

  /**
   * Delete client
   */
  deleteClient: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/api/clients/${id}`);
    return response.data;
  },
};

// ============================================================================
// NOVA API
// ============================================================================

export interface NovaStatsDTO {
  novaName: string;
  teamCount: number;
  grandTotalAgentCount: number;
  grandTotalCalls: number;
  grandTotalSales: number;
  grandTotalEarnings: number;
  top3Teams: TeamStatsDTO[];
  top3Agents: AgentStatsDTO[];
  teamsList: TeamStatsDTO[];
}

export interface TeamStatsDTO {
  teamName: string;
  agentCount: number;
  totalCalls: number;
  totalSales: number;
  totalNi: number;
  totalN: number;
  totalCallbk: number;
  rank: number;
  totalPaidTimeHours: number;
  totalCustomerTimeHours: number;
  totalWaitTimeHours: number;
  totalEstimatedEarnings: number;
  globalTalkTimePercentage: string;
  globalWaitTimePercentage: string;
  agentsList: AgentStatsDTO[];
}

export interface AgentStatsDTO {
  vicidialId: number;
  agentName: string;
  totalCalls: number;
  rank: number;
  totalPaidTimeHours: number;
  customerTimeHours: number;
  talkTimeHours: number;
  waitTimeHours: number;
  talkTimePercentage: string;
  waitTimePercentage: string;
  estimatedEarnings: number;
  campaign: string;
  sale: number;
  ni: number;
  n: number;
  callbk: number;
}

export const novaAPI = {
  /**
   * Get Nova stats for HQ Dashboard
   */
  getMyStats: async (): Promise<NovaStatsDTO> => {
    const response = await apiClient.get<NovaStatsDTO>(`/api/dashboard/nova/my-stats`);
    return response.data;
  },
};

// ============================================================================
// FORMATIONS API
// ============================================================================

import { Formation, FormationDTO, FormationSession, FormationSessionDTO, FormationType, FormationStatus, SessionStatus } from '../../types';

export const formationsAPI = {
  /**
   * Get all formations for the current user
   */
  getAllFormations: async (): Promise<Formation[]> => {
    const response = await apiClient.get<Formation[]>('/api/formations');
    return response.data;
  },

  /**
   * Get a specific formation by ID
   */
  getFormationById: async (id: string): Promise<Formation> => {
    const response = await apiClient.get<Formation>(`/api/formations/${id}`);
    return response.data;
  },

  /**
   * Create a new formation (NOVA role required)
   */
  createFormation: async (formation: Formation): Promise<Formation> => {
    // Remove fields that should be generated by backend
    const { id, createdBy, createdDate, ...formationData } = formation;
    const response = await apiClient.post<Formation>('/api/formations', formationData);
    return response.data;
  },

  /**
   * Update an existing formation (NOVA role required)
   */
  updateFormation: async (id: string, formation: Formation): Promise<Formation> => {
    const response = await apiClient.put<Formation>(`/api/formations/${id}`, formation);
    return response.data;
  },

  /**
   * Delete a formation (NOVA role required)
   */
  deleteFormation: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/formations/${id}`);
  },

  /**
   * Enroll in a formation
   */
  enrollFormation: async (formationId: string): Promise<FormationSession> => {
    const response = await apiClient.post<FormationSession>(
      `/api/formations/sessions/${formationId}/enroll`,
      {}
    );
    return response.data;
  },

  /**
   * Complete a chapter in a formation session
   */
  completeChapter: async (sessionId: string, chapterId: string): Promise<FormationSession> => {
    const response = await apiClient.put<FormationSession>(
      `/api/formations/sessions/${sessionId}/complete-chapter/${chapterId}`,
      {}
    );
    return response.data;
  },

  /**
   * Get user's formation sessions
   */
  getMyFormationSessions: async (): Promise<FormationSession[]> => {
    const response = await apiClient.get<FormationSession[]>('/api/formations/sessions/my');
    return response.data;
  },

  /**
   * Get team formation sessions (NOVA or TEAM role required)
   */
  getTeamFormationSessions: async (teamId: string): Promise<FormationSession[]> => {
    const response = await apiClient.get<FormationSession[]>(`/api/formations/sessions/team/${teamId}`);
    return response.data;
  },
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default apiClient;
