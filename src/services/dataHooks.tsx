import { useState, useEffect } from 'react';
import { dashboardAPI, teamAPI, agentAPI, Agent, Team, SystemSummary } from './apiService';
import { TimePeriod } from '../../types';

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Hook to fetch system summary data
 */
export const useSystemSummary = () => {
  const [data, setData] = useState<SystemSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summary = await dashboardAPI.getSystemSummary();
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching system summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch full view (NOVA role)
 */
export const useFullView = () => {
  const [data, setData] = useState<{ teams: Team[]; agents: Agent[]; systemSummary: SystemSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fullView = await dashboardAPI.getFullView();
      setData(fullView);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching full view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

// ============================================================================
// TEAM HOOKS
// ============================================================================

/**
 * Hook to fetch all teams
 */
export const useTeams = () => {
  const [data, setData] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const teamsDTO = await teamAPI.getAllTeams();
      // Map TeamStatsDTO[] to Team[] (minimal mapping for dashboard display)
      const teams: Team[] = teamsDTO.map(t => ({
        id: 0,
        teamName: t.teamName,
        totalCalls: t.totalCalls ?? 0,
        agentCount: 0,
        totalSales: 0,
        totalNi: 0,
        totalN: 0,
        totalCallbk: 0,
        rank: 0,
        totalPaidTimeHours: 0,
        totalCustomerTimeHours: 0,
        totalWaitTimeHours: 0,
        totalEstimatedEarnings: 0,
        globalTalkTimePercentage: '0%',
        globalWaitTimePercentage: '0%',
        agentsList: [],
        costPerHour: 0,
        calls: t.totalCalls ?? 0,
        Sales: 0,
        username: t.teamName,
      }));
      setData(teams);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch team statistics
 */
// Removed useTeamStats (API method does not exist)

/**
 * Hook to fetch a specific team by ID
 */
// Removed useTeamById (API method does not exist)

// ============================================================================
// AGENT HOOKS
// ============================================================================

/**
 * Hook to fetch all agents
 */
export const useAgents = () => {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const agents = await agentAPI.getAllAgents();
      setData(agents);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch a specific agent by ID
 */
export const useAgentById = (agentId: number | null) => {
  const [data, setData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const agent = await agentAPI.getAgentById(agentId);
      setData(agent);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching agent:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [agentId]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch agent's own stats
 */
export const useMyStats = () => {
  const [data, setData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const stats = await agentAPI.getMyStats();
      // Map AgentStatsDTO to Agent (minimal mapping)
      const agent: Agent = {
        id_agent: 0,
        ID: 0,
        username: stats.agentName,
        calls: (stats as any).stats?.calls ?? 0,
        SALE: 0,
      };
      setData(agent);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching my stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch top 5 agents
 */
export const useTop5Agents = () => {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const agentsDTO = await agentAPI.getTop5Agents();
      // Map AgentStatsDTO[] to Agent[]
      const agents: Agent[] = agentsDTO.map(a => ({
        id_agent: 0,
        ID: 0,
        username: a.agentName,
        calls: (a as any).stats?.calls ?? 0,
        SALE: 0,
      }));
      setData(agents);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching top 5 agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};
