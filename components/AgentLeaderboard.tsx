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
}

type DateFilter = 'today' | 'yesterday' | 'this-week';
type SortField = 'rdv_count' | 'rdv_per_hour' | 'cost_per_rdv' | 'calls' | 'hours_worked' | 'cost_total';

const AgentLeaderboard: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('rdv_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [campaigns, setCampaigns] = useState<string[]>(['NOVA_ECO', 'NOVA_PREMIUM', 'NOVA_CLASSIC']);

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

        let data: AgentData[] = uniqueAgents;

        // Filter by campaign
        if (campaignFilter !== 'all') {
          data = data.filter(agent => agent.campaign === campaignFilter);
        }

        // Sort data
        data.sort((a, b) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">✅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total RDV</p>
                <p className="text-2xl font-bold text-gray-900">{totals.rdv_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">€</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coût moyen / RDV</p>
                <p className="text-2xl font-bold text-gray-900">{avgCostPerRdv}€</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">⏱️</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heures totales</p>
                <p className="text-2xl font-bold text-gray-900">{totals.hours_worked.toFixed(1)}h</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-3xl">📱</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Appels totaux</p>
                <p className="text-2xl font-bold text-gray-900">{totals.calls}</p>
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
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('hours_worked')}
                    >
                      Heures travaillées {sortField === 'hours_worked' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('calls')}
                    >
                      Appels {sortField === 'calls' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('rdv_count')}
                    >
                      RDV {sortField === 'rdv_count' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('rdv_per_hour')}
                    >
                      RDV/heure {sortField === 'rdv_per_hour' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('cost_total')}
                    >
                      Coût total {sortField === 'cost_total' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('cost_per_rdv')}
                    >
                      Coût/RDV {sortField === 'cost_per_rdv' && (sortDirection === 'desc' ? '↓' : '↑')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    return (
                      <tr
                        key={agent.agent_id}
                        className={`${isTop3 ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getMedal(rank) && <span className="text-lg">{getMedal(rank)}</span>}
                            <span className="text-sm font-medium text-gray-900">#{rank}</span>
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
                              <div className="text-sm font-medium text-gray-900">{agent.agent_name}</div>
                              <div className="text-sm text-gray-500">ID: {agent.agent_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agent.hours_worked.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.calls}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {agent.rdv_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.rdv_per_hour}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agent.cost_total.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agent.cost_per_rdv.toFixed(2)}€
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      TOTAL NOVA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {totals.hours_worked.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{totals.calls}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{totals.rdv_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{avgRdvPerHour}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {totals.cost_total.toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{avgCostPerRdv}€</td>
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
