/**
 * Agent Dashboard Component
 * * Updated to use real-time backend data for Top Agents and Personal Stats
 * via agentAPI.
 */

import React, { useState, useEffect } from 'react';
import { Agent, TimePeriod, Client } from '../types';
import KPICard from './KPICard';
import AddClientCard, { ClientFormData } from './AddClientCard';
import { clientAPI, agentAPI, AgentStatsDTO } from '../src/services/apiService'; // Ensure AgentStatsDTO is imported
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Flash Notification Component
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const FlashNotification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-50 border-emerald-300',
    error: 'bg-red-50 border-red-300',
    info: 'bg-blue-50 border-blue-300',
    warning: 'bg-amber-50 border-amber-300',
  }[notification.type];

  const textColor = {
    success: 'text-emerald-700',
    error: 'text-red-700',
    info: 'text-blue-700',
    warning: 'text-amber-700',
  }[notification.type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[notification.type];

  return (
    <div className={`fixed bottom-6 right-6 ${bgColor} border rounded-lg px-6 py-4 shadow-lg animate-fade-in z-50 max-w-sm`}>
      <div className="flex items-start gap-3">
        <span className={`${textColor} text-xl font-black flex-shrink-0`}>{icon}</span>
        <div className="flex-1">
          <p className={`${textColor} font-bold`}>{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 flex-shrink-0 ml-2`}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Utilitaire pour formater un pourcentage avec 2 décimales et virgule
function formatPourcentage(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(num)) return '0,00%';
  return num.toFixed(2).replace('.', ',') + '%';
}

// Interface for the UI Leaderboard display
interface DisplayAgent {
  id: number;
  name: string;
  rank: number;
  calls: number;
  talkTime: number; // Stored in minutes to match existing UI logic
  waitTime: number; // Stored in minutes
  paidTime: number; // Talk time + wait time in minutes
  booked: number;
  conversion: number;
  isCurrentAgent: boolean;
}

interface AgentDashboardProps {
  agent: Agent;
  period: TimePeriod;
  agents?: Agent[];
  clients?: Client[];
  onUpdateAgent?: (agentId: string, updates: Partial<Agent>) => void;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ agent, period, agents = [], clients = [], onUpdateAgent }) => {
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ============================================================================
  // Safety Check
  // ============================================================================
  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500 text-lg">No agent data available</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // State Management
  // ============================================================================
  const [metricsView, setMetricsView] = useState<'booked' | 'conversion'>('booked');
  const [clientFilter, setClientFilter] = useState<'all' | 'confirme' | 'en_attente' | 'annule'>('all');
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [currentClientPage, setCurrentClientPage] = useState(1);
  const [clientStartDate, setClientStartDate] = useState<string>('');
  const [clientEndDate, setClientEndDate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const itemsPerPage = 5;
  
  const [editedAgent, setEditedAgent] = useState({
    email: agent.email,
    phone: agent.phone,
    address: agent.address,
  });

  // API Data States
  const [agentStats, setAgentStats] = useState<AgentStatsDTO | null>(null);
  const [topAgentsDisplay, setTopAgentsDisplay] = useState<DisplayAgent[]>([]);
  const [currentAgentRank, setCurrentAgentRank] = useState<number | string>('-');

  // ============================================================================
  // API Data Fetching
  // ============================================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Top 5 Agents (AgentStatsDTO[])
        const top5Data: AgentStatsDTO[] = await agentAPI.getTop5Agents();

        // 2. Fetch My Personal Stats based on period
        let myStatsData: AgentStatsDTO;
        if (period === TimePeriod.WEEK) {
          // For WEEK, call getHistory
          myStatsData = await agentAPI.getHistory('WEEK');
          console.log('Fetched WEEK stats:', myStatsData);
        } else if (period === TimePeriod.MONTH) {
          // For MONTH, call getHistory
          myStatsData = await agentAPI.getHistory('MONTH');
          console.log('Fetched MONTH stats:', myStatsData);
        } else {
          // For TODAY, use getMyStats (default)
          myStatsData = await agentAPI.getMyStats();
          console.log('Fetched TODAY stats:', myStatsData);
        }
        console.log('Setting agentStats state to:', myStatsData);
        setAgentStats(myStatsData);
        if (myStatsData) {
          setCurrentAgentRank(myStatsData.rank);
        }

        // 3. Get current username for highlighting
        const currentUsername = localStorage.getItem('userEmail') || '';

        // 4. Map Backend DTO to UI Display
        const mappedAgents: DisplayAgent[] = (top5Data || []).map((dto: AgentStatsDTO) => {
          // Calculate Conversion: (Sales / Calls) * 100
          const conversionRate = dto.totalCalls > 0 
            ? (dto.sale / dto.totalCalls) * 100 
            : 0;
          // Calculate paid time in minutes (talk + wait)
          const talkTimeMinutes = dto.talkTimeHours * 60;
          const waitTimeMinutes = dto.waitTimeHours * 60;
          const paidTimeMinutes = talkTimeMinutes + waitTimeMinutes;
          return {
            id: dto.vicidialId,
            name: dto.agentName,
            rank: dto.rank,
            calls: dto.totalCalls,
            talkTime: talkTimeMinutes,
            waitTime: waitTimeMinutes,
            paidTime: paidTimeMinutes,
            booked: dto.sale,
            conversion: conversionRate,
            isCurrentAgent: dto.agentName === currentUsername
          };
        });
        setTopAgentsDisplay(mappedAgents);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, [period]);

  // ============================================================================
  // Client Management
  // ============================================================================
  const handleAddClient = async (clientData: ClientFormData) => {
  try {
    const newClient = await clientAPI.createClient({
      nom_complet: clientData.nom_complet,
      email: clientData.email,
      telephone: clientData.telephone,
      adresse: clientData.adresse,
      code_postal: clientData.code_postal,
      commentaire: clientData.commentaire,
      date_visite: clientData.date_visite,
      nom_service: clientData.nom_service,
      // MUST match the enum statut_service in your Java package
      statut_service: 'en_attente',
      agent: {
        username: agent.name,
        campaign: agent.campaign,
      }
    });
    setShowAddClient(false);
    showNotification('Client ajouté avec succès!', 'success');
    // Add the new client to the local clients list if the component has access
  } catch (error) {
    console.error('Error adding client:', error);
    showNotification('Erreur lors de l\'ajout du client', 'error');
  }
};

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  // ============================================================================
  // Local Performance Calculations (Fallback / Immediate Display)
  // ============================================================================
  const stats = agent?.stats?.[period] || {
    calls: 0,
    booked: 0,
    talkTimeMinutes: 0,
    waitTimeMinutes: 0,
    paidPauseHours: 0,
    dispositions: {
      booked: 0,
      callback: 0,
      noAnswer: 0,
      notInterested: 0
    }
  };

  // Prefer API data if available, otherwise fallback to props
  const talkHours = agentStats ? agentStats.talkTimeHours : (stats.talkTimeMinutes / 60);
  const waitHours = agentStats ? agentStats.waitTimeHours : (stats.waitTimeMinutes / 60);
  const paidTimeHours = agentStats ? agentStats.totalPaidTimeHours : (talkHours + waitHours); // Simplified fallback
  const estimatedEarnings = agentStats ? agentStats.estimatedEarnings.toFixed(2) : ((paidTimeHours * (agent?.hourlyRate || 0)).toFixed(2));
  
  // Debug logging
  console.log('AgentDashboard render - agentStats:', agentStats);
  console.log('AgentDashboard render - talkHours:', talkHours, 'waitHours:', waitHours, 'paidTimeHours:', paidTimeHours);
  
  // Disposition analysis data for pie chart
  // Map API response fields to disposition names
  const dispositionData = [
    { name: 'Booked', value: agentStats ? agentStats.booked : stats.dispositions?.booked || 0, color: '#10b981' },
    { name: 'Callback', value: agentStats ? agentStats.callbk : stats.dispositions?.callback || 0, color: '#3b82f6' },
    { name: 'No Answer', value: agentStats ? agentStats.n : stats.dispositions?.noAnswer || 0, color: '#f59e0b' },
    { name: 'Not Interested', value: agentStats ? agentStats.ni : stats.dispositions?.notInterested || 0, color: '#ef4444' },
  ];

  // Goal tracking - 3 sales per day
  const targetBooked = 3;
  const currentBooked = agentStats ? agentStats.sale : stats.booked;
  const progressPercent = Math.min((currentBooked / targetBooked) * 100, 100);

  // Client interaction history filtered by status and agent ownership
  const allAgentClients = clients
    .filter(c => {
      // If client has no agent, include it (for backward compatibility)
      // Otherwise match by agent username or agent name
      if (!c.agent?.username) return true;
      return c.agent.username === agent.name || c.agent.username === agent.email;
    })
    .filter(c => {
      // Match by status (handle both statut_service and statutService)
      const clientStatus = c.statut_service || c.statutService;
      return clientFilter === 'all' || clientStatus === clientFilter;
    })
    .filter(c => {
      // Filter by date range
      if (!clientStartDate && !clientEndDate) return true;
      const clientDate = c.date_creation || c.date_visite;
      if (!clientDate) return false;
      const cDate = new Date(clientDate).getTime();
      const startTime = clientStartDate ? new Date(clientStartDate).getTime() : 0;
      const endTime = clientEndDate ? new Date(clientEndDate).getTime() + 86400000 : Infinity;
      return cDate >= startTime && cDate <= endTime;
    });

  // Calculate pagination
  const totalPages = Math.ceil(allAgentClients.length / itemsPerPage);
  const startIndex = (currentClientPage - 1) * itemsPerPage;
  const agentClients = allAgentClients.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentClientPage(1);
  }, [clientFilter, clientStartDate, clientEndDate]);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirme':
        return 'text-emerald-600 bg-emerald-50 border border-emerald-100';
      case 'en_attente':
        return 'text-blue-600 bg-blue-50 border border-blue-100';
      case 'annule':
        return 'text-red-600 bg-red-50 border border-red-100';
      default:
        return 'text-slate-600 bg-slate-50 border border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative cursor-pointer" onClick={() => setShowAgentDetails(true)}>
            <img src={agent.avatar} alt={agent.name} className="w-24 h-24 rounded-2xl object-cover border border-slate-100 shadow-xl hover:shadow-2xl transition-all hover:scale-105" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg border-2 border-white">
              Online
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{agent.name}</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              {agentStats?.campaign || (typeof agent.team === 'object' ? agent.team.teamName : String(agent.team))} • ID: #{agentStats?.vicidialId || agent.id.toUpperCase()}
            </p>
            <div className="flex gap-2 mt-4">
              <span className="bg-amber-50 text-amber-700 text-[10px] px-3 py-1.5 rounded-lg font-black flex items-center gap-2 border border-amber-100 shadow-sm">
                🔥 {agent.streakDays} Day Streak
              </span>
              {(typeof currentAgentRank === 'number' && currentAgentRank <= 3) && (
                  <span className="bg-blue-50 text-blue-700 text-[10px] px-3 py-1.5 rounded-lg font-black border border-blue-100 shadow-sm">
                    Top 3 in Team
                  </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-80 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
          <div className="flex justify-between text-xs mb-3">
            <span className="text-slate-500 font-black uppercase tracking-widest">Goal Progress</span>
            <span className="text-blue-600 font-black">{currentBooked}/{targetBooked} Booked</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 right-0 w-8 h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-tight">
            Daily Target: 3 Sales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard 
          label="Total Calls" 
          value={agentStats ? agentStats.totalCalls : stats.calls} 
          subtext="This period"
          color="bg-slate-600"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
        />
        <KPICard 
          label="Paid Time" 
          value={`${talkHours.toFixed(1)}h`} 
          subtext={`Talk: ${talkHours.toFixed(1)}h`}
          /* subtext={`Talk: ${talkHours.toFixed(1)}h |  Wait: ${waitHours.toFixed(1)}h`} */
          color="bg-blue-600"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard 
          label="Est. Earnings" 
          value={`$${estimatedEarnings}`} 
          subtext={`Based on current activity`}
          color="bg-emerald-600"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
              Disposition Analysis
            </h2>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Avg: 12.4%</div>
          </div>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-full h-full max-w-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <PieChart>
                  <Pie
                    data={dispositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {dispositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto mt-6 md:mt-0">
              {dispositionData.map((d, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{d.name}</span>
                  </div>
                  <span className="text-slate-900 font-black text-2xl">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8">
            <span className="w-2 h-8 bg-purple-600 rounded-full block"></span>
            Time Breakdown
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Talk Time</p>
              <p className="text-4xl font-black text-purple-600">{talkHours.toFixed(1)}h</p>
            </div>
            {/* <div className="w-full h-px bg-slate-200"></div>
            {/* <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Wait Time</p>
              <p className="text-4xl font-black text-slate-400">{waitHours.toFixed(1)}h</p>
            </div>
            <div className="w-full h-px bg-slate-200"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Paid Pause</p>
              <p className="text-4xl font-black text-slate-400">{stats.paidPauseHours?.toFixed(1) || '0.0'}h</p>
            </div> */}
          </div>
        </div>
      </div>

      {/* TOP AGENTS SECTION - INTEGRATED WITH API */}
      <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Top Agents</h2>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rank</p>
            <p className="text-2xl font-black text-emerald-600">#{currentAgentRank}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setMetricsView('booked')}
            className={`px-4 py-2 text-sm font-medium rounded transition-all ${
              metricsView === 'booked'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Booked
          </button>
          <button
            onClick={() => setMetricsView('conversion')}
            className={`px-4 py-2 text-sm font-medium rounded transition-all ${
              metricsView === 'conversion'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Conversion %
          </button>
        </div>

        <div className="space-y-3">
          {topAgentsDisplay.map((a) => {
            const actualRank = a.rank;
            const medalColors: Record<number, string> = {
              1: 'bg-yellow-400',
              2: 'bg-gray-400',
              3: 'bg-orange-400'
            };
            const bgColors: Record<number, string> = {
              1: 'bg-yellow-50 border-yellow-200',
              2: 'bg-gray-50 border-gray-200',
              3: 'bg-orange-50 border-orange-200'
            };
            const currentMedalColor = medalColors[actualRank] || 'bg-blue-400';
            const currentBgColor = bgColors[actualRank] || 'bg-slate-50 border-slate-200';
            
            return (
              <div 
                key={a.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${a.isCurrentAgent ? 'bg-emerald-50 border-emerald-200' : currentBgColor}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentMedalColor} text-white`}>
                    #{actualRank}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{a.name} {a.isCurrentAgent && <span className="text-[10px] font-black text-emerald-600">(You)</span>}</p>
                    {/* Display paid time (talk + wait) in hours */}
                    <p className="text-xs text-gray-500">{a.calls} calls • {(a.talkTime / 60).toFixed(1)}h</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {metricsView === 'booked' ? a.booked : formatPourcentage(a.conversion)}
                  </p>
                  <p className="text-xs text-gray-500">{metricsView === 'booked' ? 'booked' : 'conversion %'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Client Details Modal */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Client Details</h3>
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setSelectedClient(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.nom_complet || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold break-all">
                  {selectedClient.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.telephone || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.nom_service || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.adresse || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Postal Code</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.code_postal || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Created Date</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.date_creation ? new Date(selectedClient.date_creation).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visit Date</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {selectedClient.date_visite ? new Date(selectedClient.date_visite).toLocaleDateString() : 'Not scheduled'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <div className={`border-2 rounded-2xl px-4 py-3 font-bold text-center ${getStatusColor(selectedClient.statut_service)}`}>
                  {selectedClient.statut_service || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Comments</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold max-h-24 overflow-y-auto">
                  {selectedClient.commentaire || 'No comments'}
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setSelectedClient(null);
                }}
                className="w-full px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgentDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Agent Information</h3>
              <div className="flex items-center gap-2">
                {!isEditingDetails ? (
                  <button
                    onClick={() => setIsEditingDetails(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit Details"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setShowAgentDetails(false);
                    setIsEditingDetails(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">
              <div className="flex justify-center mb-4">
                <img src={agent.avatar} alt={agent.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-200 shadow-lg" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {agent.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Agent ID</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold uppercase">
                  #{agentStats?.vicidialId || agent.id}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Campaign</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  {agentStats?.campaign || (typeof agent.team === 'object' ? agent.team.teamName : String(agent.team))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rank</label>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                  #{agentStats?.rank || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                {isEditingDetails ? (
                  <input
                    type="email"
                    value={editedAgent.email}
                    onChange={(e) => setEditedAgent({ ...editedAgent, email: e.target.value })}
                    className="w-full bg-white border-2 border-blue-300 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                ) : (
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold break-all">
                    {agent.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                {isEditingDetails ? (
                  <input
                    type="tel"
                    value={editedAgent.phone}
                    onChange={(e) => setEditedAgent({ ...editedAgent, phone: e.target.value })}
                    className="w-full bg-white border-2 border-blue-300 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                ) : (
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                    {agent.phone}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                {isEditingDetails ? (
                  <textarea
                    value={editedAgent.address}
                    onChange={(e) => setEditedAgent({ ...editedAgent, address: e.target.value })}
                    className="w-full bg-white border-2 border-blue-300 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                    rows={3}
                  />
                ) : (
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold">
                    {agent.address}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hourly Rate</label>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3 text-blue-900 font-black text-lg">
                  ${agentStats?.estimatedEarnings ? (agentStats.estimatedEarnings / agentStats.totalPaidTimeHours).toFixed(2) : agent.hourlyRate}/hr
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Earnings</label>
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-4 py-3 text-emerald-900 font-black text-lg">
                  ${agentStats?.estimatedEarnings?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-slate-100">
              {isEditingDetails ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditingDetails(false);
                      setEditedAgent({ email: agent.email, phone: agent.phone, address: agent.address });
                    }}
                    className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onUpdateAgent?.(agent.id, {
                        email: editedAgent.email,
                        phone: editedAgent.phone,
                        address: editedAgent.address
                      });
                      setIsEditingDetails(false);
                    }}
                    className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAgentDetails(false)}
                  className="w-full px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-0 right-0 p-6 space-y-2 pointer-events-none">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <FlashNotification
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentDashboard;