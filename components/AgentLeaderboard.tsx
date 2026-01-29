import React, { useState, useEffect, useMemo } from 'react';
import { agentAPI, novaAPI, teamAPI } from '../src/services/apiService';

interface AgentData {
  agent_id: string | number;
  agent_name: string;
  avatar_url?: string;
  calls: number;
  rdv_count: number;
  hours_worked: number;
  cost_total: number;
  rdv_per_hour: number;
  cost_per_rdv: number;
  campaign?: string;
  rank?: number;
  // API fields
  totalCalls?: number;
  totalPaidTimeHours?: number;
  costPerHour?: number;
  loginTimeHours?: number;
  dispoTimeHours?: number;
  deadTimeHours?: number;
  talkTimeHours?: number;
  talkTimePercentage?: string;
  estimatedEarnings?: number;
  callbk?: number;
  n?: number;
  ni?: number;
  booked?: number;
  pauseTimeHours?: number;
  paidPauseHours?: number;
  customerTimeHours?: number;
  waitTimeHours?: number;
  waitTimePercentage?: string;
  workingDays?: number;
}

type DateFilter = 'today' | 'yesterday' | 'this-week' | 'year';
type SortField = 'rdv_count' | 'rdv_per_hour' | 'cost_per_rdv' | 'calls' | 'hours_worked' | 'cost_total';

type ColumnMetric = 
  | 'totalCalls' 
  | 'totalPaidTimeHours' 
  | 'costPerHour' 
  | 'loginTimeHours' 
  | 'dispoTimeHours' 
  | 'deadTimeHours' 
  | 'talkTimeHours' 
  | 'talkTimePercentage' 
  | 'estimatedEarnings' 
  | 'callbk' 
  | 'n' 
  | 'ni' 
  | 'booked'
  | 'workingDays';

interface AgentLeaderboardProps {
  onSelectAgent?: (agentId: number, agentName: string) => void;
}

const AgentLeaderboard: React.FC<AgentLeaderboardProps> = ({ onSelectAgent }) => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('rdv_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [campaigns, setCampaigns] = useState<string[]>(['NOVA_ECO', 'NOVA_PREMIUM', 'NOVA_CLASSIC']);
  const [historyStats, setHistoryStats] = useState<AgentData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<ColumnMetric[]>([
    'totalCalls',
    'totalPaidTimeHours',
    'costPerHour',
    'workingDays',
  ]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const availableMetrics: { key: ColumnMetric; label: string }[] = [
    { key: 'totalCalls', label: 'Total Appels' },
    { key: 'totalPaidTimeHours', label: 'Heures travaillées' },
    { key: 'costPerHour', label: 'Coût/Heure' },
    { key: 'loginTimeHours', label: 'Heures de connexion' },
    { key: 'dispoTimeHours', label: 'Heures Dispo' },
    { key: 'deadTimeHours', label: 'Heures Dead' },
    { key: 'talkTimeHours', label: 'Heures Talk' },
    { key: 'talkTimePercentage', label: 'Talk %%' },
    { key: 'estimatedEarnings', label: 'Gains estimés' },
    { key: 'callbk', label: 'Callback' },
    { key: 'n', label: 'N' },
    { key: 'ni', label: 'NI' },
    { key: 'booked', label: 'Réservé' },
    { key: 'workingDays', label: 'Jour travaillé' },
  ];

  // Fetch working days from Performance Metrics API (once for all agents)
  const fetchAllWorkingDays = async (): Promise<Map<number, number>> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return new Map();
      }

      const response = await fetch('https://novaadmin.ca/api/test/history/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch working days:', response.status, response.statusText);
        return new Map();
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn('Working days data is not an array');
        return new Map();
      }

      // Count working days by agent ID (try multiple possible field names)
      const workingDaysMap = new Map<number, number>();
      
      data.forEach((item: any) => {
        // Try multiple possible field names for agent ID
        const agentId = item.vicidialId || item.agentId || (item.vicidialId && parseInt(item.vicidialId));
        
        if (agentId) {
          const id = typeof agentId === 'string' ? parseInt(agentId) : agentId;
          if (!isNaN(id)) {
            workingDaysMap.set(id, (workingDaysMap.get(id) || 0) + 1);
          }
        }
      });

      console.log('Working days calculated:', workingDaysMap);
      console.log('Sample of data received:', data.length > 0 ? data[0] : 'No data');
      return workingDaysMap;
    } catch (err) {
      console.error('Error fetching working days:', err);
      return new Map();
    }
  };

  // Calculate metrics from API response
  const calculateMetrics = (agent: any): AgentData => {
    // Map API response (AgentStatsDTO) to AgentData interface
    const hours_worked = agent.totalPaidTimeHours || 0;
    const calls = agent.totalCalls || 0;
    const rdv_count = agent.sale || 0; // Sales count as RDVs
    const cost_per_hour = 18; // Default rate
    const cost_total = hours_worked * cost_per_hour;
    const rdv_per_hour = hours_worked > 0 ? Math.round((rdv_count / hours_worked) * 100) / 100 : 0;
    const cost_per_rdv = rdv_count > 0 ? Math.round((cost_total / rdv_count) * 100) / 100 : 0;

    return {
      agent_id: agent.vicidialId,
      agent_name: agent.agentName,
      avatar_url: undefined,
      calls: calls,
      rdv_count: rdv_count,
      hours_worked: hours_worked,
      cost_total: Math.round(cost_total * 100) / 100,
      rdv_per_hour,
      cost_per_rdv,
      campaign: agent.campaign,
      rank: agent.rank,
      // Preserve all API fields
      totalCalls: agent.totalCalls || 0,
      totalPaidTimeHours: agent.totalPaidTimeHours || 0,
      costPerHour: agent.costPerHour || 0,
      loginTimeHours: agent.loginTimeHours || 0,
      dispoTimeHours: agent.dispoTimeHours || 0,
      deadTimeHours: agent.deadTimeHours || 0,
      talkTimeHours: agent.talkTimeHours || 0,
      talkTimePercentage: agent.talkTimePercentage || '0%',
      estimatedEarnings: agent.estimatedEarnings || 0,
      callbk: agent.callbk || 0,
      n: agent.n || 0,
      ni: agent.ni || 0,
      booked: agent.booked || 0,
      pauseTimeHours: agent.pauseTimeHours || 0,
      paidPauseHours: agent.paidPauseHours || 0,
      customerTimeHours: agent.customerTimeHours || 0,
      waitTimeHours: agent.waitTimeHours || 0,
      waitTimePercentage: agent.waitTimePercentage || '0%',
      workingDays: agent.workingDays || 0,
    };
  };

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userRole = localStorage.getItem('userRole');
        console.log('User role:', userRole);
        
        let allAgents: AgentData[] = [];

        // Fetch history stats for yearly data (only for AGENT and TEAM roles)
        if (userRole === 'AGENT' || userRole === 'TEAM') {
          try {
            const historyData = await agentAPI.getHistory('YEAR');
            console.log('History data received:', historyData);
            if (historyData) {
              setHistoryStats(calculateMetrics(historyData));
            }
          } catch (historyErr) {
            console.warn('Failed to fetch history stats:', historyErr);
            setHistoryStats(null);
          }
        }

        if (userRole === 'NOVA') {
          // NOVA: Fetch all agents from all teams
          const novaStats = await novaAPI.getMyStats();
          console.log('Nova stats received:', novaStats);
          
          // Add top 3 agents
          if (novaStats.top3Agents && novaStats.top3Agents.length > 0) {
            allAgents = allAgents.concat(novaStats.top3Agents.map(calculateMetrics));
          }
          
          // Add agents from all teams
          if (novaStats.teamsList && novaStats.teamsList.length > 0) {
            novaStats.teamsList.forEach(team => {
              if (team.agentsList && team.agentsList.length > 0) {
                allAgents = allAgents.concat(team.agentsList.map(calculateMetrics));
              }
            });
          }
        } else if (userRole === 'TEAM') {
          // TEAM: Fetch only their team's agents
          const teamStats = await teamAPI.getMyTeamStats();
          console.log('Team stats received:', teamStats);
          
          if (teamStats.agentsList && teamStats.agentsList.length > 0) {
            allAgents = teamStats.agentsList.map(calculateMetrics);
          }
        } else if (userRole === 'AGENT') {
          // AGENT: Fetch their own stats
          const agentStats = await agentAPI.getMyStats();
          console.log('Agent stats received:', agentStats);
          
          if (agentStats) {
            allAgents = [calculateMetrics(agentStats)];
          }
        }
        
        // Remove duplicates (by agent ID)
        const uniqueAgents = Array.from(
          new Map(allAgents.map(agent => [agent.agent_id, agent])).values()
        );
        
        console.log('All agents collected:', uniqueAgents.length);
        
        if (!uniqueAgents || uniqueAgents.length === 0) {
          console.warn('No agents found');
          setAgents([]);
          setLoading(false);
          return;
        }

        // Fetch all working days at once
        const workingDaysMap = await fetchAllWorkingDays();

        // Add working days to each agent
        const agentsWithWorkingDays = uniqueAgents.map((agent) => {
          const workingDaysValue = workingDaysMap.get(agent.agent_id as number) || 0;
          if (agent.agent_id === 754 || agent.agent_id === 301) {
            console.log(`Agent ${agent.agent_name} (ID: ${agent.agent_id}): workingDays = ${workingDaysValue}`);
          }
          return {
            ...agent,
            workingDays: workingDaysValue
          };
        });

        let data: AgentData[] = agentsWithWorkingDays;

        // Filter by campaign
        if (campaignFilter !== 'all') {
          data = data.filter(agent => agent.campaign === campaignFilter);
        }

        // Sort data: First by rank, then by selected metric
        data.sort((a, b) => {
          // Primary sort: by rank (ascending - rank 1 first)
          const rankA = a.rank || Infinity;
          const rankB = b.rank || Infinity;
          
          if (rankA !== rankB) {
            return rankA - rankB; // Lower rank number comes first
          }
          
          // Secondary sort: by selected field for agents with same rank
          const aVal = a[sortField];
          const bVal = b[sortField];
          return sortDirection === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
        });

        setAgents(data);
      } catch (err) {
        console.error('Failed to load agent data:', err);
        setError(`Failed to load agent data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [campaignFilter, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    return agents.reduce(
      (acc, agent) => ({
        hours_worked: acc.hours_worked + agent.hours_worked,
        calls: acc.calls + agent.calls,
        rdv_count: acc.rdv_count + agent.rdv_count,
        cost_total: acc.cost_total + agent.cost_total,
      }),
      { hours_worked: 0, calls: 0, rdv_count: 0, cost_total: 0 }
    );
  }, [agents]);

  const avgRdvPerHour = totals.hours_worked > 0 ? (totals.rdv_count / totals.hours_worked).toFixed(2) : '0.00';
  const avgCostPerRdv = totals.rdv_count > 0 ? (totals.cost_total / totals.rdv_count).toFixed(2) : '0.00';

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle column selection
  const handleColumnToggle = (metric: ColumnMetric) => {
    setSelectedColumns(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Get metric value from agent
  const getMetricValue = (agent: any, metric: ColumnMetric): string | number => {
    switch (metric) {
      case 'totalCalls':
        return agent.totalCalls || 0;
      case 'totalPaidTimeHours':
        return (agent.totalPaidTimeHours || 0).toFixed(2);
      case 'costPerHour':
        return (agent.costPerHour || 0).toFixed(2);
      case 'loginTimeHours':
        return (agent.loginTimeHours || 0).toFixed(2);
      case 'dispoTimeHours':
        return (agent.dispoTimeHours || 0).toFixed(2);
      case 'deadTimeHours':
        return (agent.deadTimeHours || 0).toFixed(2);
      case 'talkTimeHours':
        return (agent.talkTimeHours || 0).toFixed(2);
      case 'talkTimePercentage':
        return agent.talkTimePercentage || '0%';
      case 'estimatedEarnings':
        return (agent.estimatedEarnings || 0).toFixed(2);
      case 'callbk':
        return agent.callbk || 0;
      case 'n':
        return agent.n || 0;
      case 'ni':
        return agent.ni || 0;
      case 'booked':
        return agent.booked || 0;
      case 'workingDays':
        return agent.workingDays || 0;
      default:
        return '0';
    }
  };

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Get medal
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  // Get date label
  const getDateLabel = (filter: DateFilter) => {
    switch (filter) {
      case 'today': return "Aujourd'hui";
      case 'yesterday': return 'Hier';
      case 'this-week': return 'Cette semaine';
      case 'year': return 'Cette année';
      default: return "Aujourd'hui";
    }
  };

  // Get campaign label
  const getCampaignLabel = (filter: string) => {
    return filter === 'all' ? 'Toutes les campagnes' : filter;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">NOVA</h1>
          <h2 className="text-2xl text-gray-600 mb-4">Classement des agents</h2>
          <div className="text-sm text-gray-500">
            {getCampaignLabel(campaignFilter)} • {agents.length} agent(s)
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campagne</label>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les campagnes</option>
                {campaigns.map((campaign) => (
                  <option key={campaign} value={campaign}>
                    {campaign}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rdv_count">Nombre de RDV</option>
                <option value="rdv_per_hour">RDV par heure</option>
                <option value="cost_per_rdv">Coût par RDV</option>
                <option value="calls">Nombre d'appels</option>
                <option value="hours_worked">Heures travaillées</option>
                <option value="cost_total">Coût total</option>
              </select>
            </div>
          </div>
          
          {/* Column Filter */}
          {/*<div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Colonnes à afficher</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableMetrics.map((metric) => (
                <label key={metric.key} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(metric.key)}
                    onChange={() => handleColumnToggle(metric.key)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{metric.label}</span>
                </label>
              ))}
            </div>
          </div>*/}

          {/* Column Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-700">
                Colonnes ({selectedColumns.length}/{availableMetrics.length})
              </span>
              <span className={`transition-transform ${showColumnDropdown ? 'transform rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {showColumnDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableMetrics.map((metric) => (
                    <label key={metric.key} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(metric.key)}
                        onChange={() => handleColumnToggle(metric.key)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">✅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total RDV <span className="text-xs text-gray-400">(Cette année)</span></p>
                <p className="text-2xl font-bold text-gray-900">{historyStats?.rdv_count || totals.rdv_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">€</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coût moyen / RDV <span className="text-xs text-gray-400">(Cette année)</span></p>
                <p className="text-2xl font-bold text-gray-900">{historyStats ? historyStats.cost_per_rdv.toFixed(2) : avgCostPerRdv}€</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">⏱️</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heures totales <span className="text-xs text-gray-400">(Cette année)</span></p>
                <p className="text-2xl font-bold text-gray-900">{historyStats ? historyStats.hours_worked.toFixed(1) : totals.hours_worked.toFixed(1)}h</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">📱</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Appels totaux <span className="text-xs text-gray-400">(Cette année)</span></p>
                <p className="text-2xl font-bold text-gray-900">{historyStats?.calls || totals.calls}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
            <p className="text-gray-600 mt-4">Chargement des données...</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && agents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Classement des agents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    {selectedColumns.map((metric) => {
                      const metricLabel = availableMetrics.find(m => m.key === metric)?.label || metric;
                      return (
                        <th
                          key={metric}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (metric === 'totalCalls') handleSort('calls');
                            else if (metric === 'totalPaidTimeHours') handleSort('hours_worked');
                            else if (metric === 'booked') handleSort('rdv_count');
                          }}
                        >
                          {metricLabel}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent, index) => {
                    const apiRank = agent.rank || (index + 1);
                    const isTop3 = apiRank <= 3;
                    return (
                      <tr
                        key={agent.agent_id}
                        onClick={() => onSelectAgent && onSelectAgent(Number(agent.agent_id), agent.agent_name)}
                        className={`cursor-pointer transition-colors ${isTop3 ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-100'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getMedal(apiRank) && <span className="text-lg">{getMedal(apiRank)}</span>}
                            <span className="text-sm font-medium text-gray-900">#{apiRank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(agent.agent_name)}`}
                            >
                              {getInitials(agent.agent_name)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 hover:text-blue-600">{agent.agent_name}</div>
                              <div className="text-sm text-gray-500">ID: {agent.agent_id}</div>
                            </div>
                          </div>
                        </td>
                        {selectedColumns.map((metric) => (
                          <td key={`${agent.agent_id}-${metric}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getMetricValue(agent, metric)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      TOTAL NOVA
                    </td>
                    {selectedColumns.map((metric) => (
                      <td key={`total-${metric}`} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {metric === 'totalCalls' && totals.calls}
                        {metric === 'totalPaidTimeHours' && totals.hours_worked.toFixed(1)}
                        {metric === 'costPerHour' && (totals.hours_worked > 0 ? (18).toFixed(2) : '0.00')}
                        {metric === 'booked' && totals.rdv_count}
                        {!['totalCalls', 'totalPaidTimeHours', 'costPerHour', 'booked'].includes(metric) && '0'}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && agents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentLeaderboard;
