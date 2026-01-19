import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

import { Agent, Team, TimePeriod, UserRole } from '../types';
import KPICard from './KPICard';
import QuickPasswordChange from './QuickPasswordChange';
import { teamAPI, agentAPI, clientAPI, impersonateAgent } from '../src/services/apiService';

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

// Utility to format percentage
function formatPourcentage(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(num)) return '0,00%';
  return num.toFixed(2).replace('.', ',') + '%';
}

interface TeamDashboardProps {
  team: Team;
  agents: Agent[];
  period: TimePeriod;
  teams?: Team[];
  onSelectAgent?: (agentId: string) => void;
  onAddAgent?: (agent: Omit<Agent, 'id'>) => void;
  onUpdateAgent?: (agentId: string, updates: Partial<Agent>) => void;
}

type SortKey = 'name' | 'booked' | 'conversion' | 'paidTime';

const TeamDashboard: React.FC<TeamDashboardProps> = ({
  team,
  agents,
  period,
  teams = [],
  onSelectAgent,
  onAddAgent,
  onUpdateAgent,
}) => {
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const navigate = useNavigate();
  const [userTeamName, setUserTeamName] = useState<string | null>(null);

  // ============================================================================
  // Safety Check
  // ============================================================================
  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500 text-lg">No team data available</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // State Management
  // ============================================================================
  const [teamData, setTeamData] = useState<Team | null>(team);
  const [teamAgentsData, setTeamAgentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'booked',
    direction: 'desc',
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showUpdateRateModal, setShowUpdateRateModal] = useState(false);
  const [selectedAgentForRate, setSelectedAgentForRate] = useState<Agent | null>(null);
  const [newRate, setNewRate] = useState<number>(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAgentForPassword, setSelectedAgentForPassword] = useState<Agent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage] = useState(5);
  const [newAgentForm, setNewAgentForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    hourlyRate: 0,
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [currentClientPage, setCurrentClientPage] = useState(1);
  const [clientsPerPage] = useState(5);
  const [clientStartDate, setClientStartDate] = useState<string>('');
  const [clientEndDate, setClientEndDate] = useState<string>('');
  const [isImportingRecordings, setIsImportingRecordings] = useState(false);
  // Removed unnecessary 'teamStats' state that duplicated data
  const [topTeams, setTopTeams] = useState<any[]>([]);

  // Compute selected client status
  const selectedClientStatus = useMemo(() => {
    return selectedClient ? (selectedClient.statut_service || selectedClient.statutService || '') : '';
  }, [selectedClient]);

  // Client pagination calculations
  const totalClientPages = Math.ceil(filteredClients.length / clientsPerPage);
  const clientStartIndex = (currentClientPage - 1) * clientsPerPage;
  const teamClients = filteredClients.slice(clientStartIndex, clientStartIndex + clientsPerPage);

  // Reset client pagination when filtered clients change
  React.useEffect(() => {
    setCurrentClientPage(1);
  }, [filteredClients]);

  // ============================================================================
  // Data Fetching & JWT Filtering
  // ============================================================================

  useEffect(() => {
    let userTeamId = null;
    let userAgentId = null;
    let jwtTeamName = null;
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decoded: any = jwtDecode(token);
        userTeamId = decoded.team_id || decoded.teamId || decoded.team || null;
        userAgentId = decoded.agent_id || decoded.agentId || decoded.agent || decoded.id_agent || null;
        jwtTeamName = decoded.team_name || decoded.teamName || decoded.team || null;
        setUserTeamName(jwtTeamName);
      }
    } catch (e) {
      // ignore
    }

    if (jwtTeamName && team && team.teamName && jwtTeamName !== team.teamName) {
      navigate(`/dashboard/teams/${jwtTeamName}`, { replace: true });
      return;
    }

    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        setTeamData(null);
        setTeamAgentsData([]);

        // ✅ MODIFIED: Use getMyTeamStats (single object) instead of getAllTeams (list)
        const [myTeamData, clientsResponse] = await Promise.all([
          teamAPI.getMyTeamStats(), // Fetches /api/dashboard/teams/me
          clientAPI.getAllClients(),
        ]);
        
        // ✅ MODIFIED: Directly assign the object, no .find() needed
        if (myTeamData) {
          // Cast TeamStatsDTO to Team type compatibility if needed
          setTeamData(myTeamData as unknown as Team); 
          setTeamAgentsData(myTeamData.agentsList || []);
        }

        setClients(clientsResponse || []);
        
        let filtered = clientsResponse || [];
        if (userAgentId) {
          filtered = filtered.filter((c: any) => c.agent_id === userAgentId || c.agent?.id === userAgentId || c.agent_id === String(userAgentId));
        } else if (myTeamData && myTeamData.agentsList) {
          // Filter clients belonging to any agent in this team
          const teamAgentIds = myTeamData.agentsList.map((a: any) => a.vicidialId || a.id || a.agentName);
          filtered = filtered.filter((c: any) => 
            teamAgentIds.includes(c.agent_id) || 
            teamAgentIds.includes(c.agent?.id) || 
            (c.agent?.username && teamAgentIds.some((ta:any) => ta.toString() === c.agent.username))
          );
        }
        // Apply date range filtering
        filtered = filtered.filter((c: any) => {
          if (!clientStartDate && !clientEndDate) return true;
          const clientDate = c.date_creation || c.date_visite;
          if (!clientDate) return false;
          const cDate = new Date(clientDate).getTime();
          const startTime = clientStartDate ? new Date(clientStartDate).getTime() : 0;
          const endTime = clientEndDate ? new Date(clientEndDate).getTime() + 86400000 : Infinity;
          return cDate >= startTime && cDate <= endTime;
        });
        setFilteredClients(filtered);
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTopTeams = async () => {
      try {
        const topTeamsResponse = await teamAPI.getTop5Teams();
        setTopTeams(topTeamsResponse);
      } catch (error) {
        console.error('Error fetching top teams:', error);
      }
    };

    fetchTeamData();
    fetchTopTeams();
    // Removed legacy fetchTeamStats call
  }, [team.teamName]);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirme':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'en_attente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'annule':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirme': return 'Confirmed';
      case 'en_attente': return 'Pending';
      case 'annule': return 'Cancelled';
      default: return status;
    }
  };

  const currentTeam = teamData || team;
  const teamAgents = teamAgentsData;

  const effectiveTeamName = userTeamName || currentTeam.teamName;
  // Fallback to currentTeam if we can't find it in teams list (since teams list might be empty for normal users)
  const effectiveTeam = currentTeam; 

  const clientStats = {
    total: filteredClients.length,
    pending: filteredClients.filter(c => (c.statut_service || c.statutService) === 'en_attente').length,
    confirmed: filteredClients.filter(c => (c.statut_service || c.statutService) === 'confirme').length,
    completed: filteredClients.filter(c => (c.statut_service || c.statutService) !== 'en_attente' && (c.statut_service || c.statutService) !== 'confirme').length,
  };

  const totals = useMemo(() => {
    return {
      sumCalls: currentTeam.totalCalls || 0,
      sumBooked: currentTeam.totalSales || 0,
      sumTalk: (currentTeam.totalCustomerTimeHours || 0) * 60, 
      sumWait: (currentTeam.totalWaitTimeHours || 0) * 60,
    };
  }, [currentTeam]);

  const avgConversion = totals.sumCalls > 0
    ? (totals.sumBooked / totals.sumCalls * 100)
    : 0;

  const dispositionData = [
    { name: 'Booked', value: currentTeam.totalSales || 0, color: '#10b981' },
    { name: 'Callback', value: currentTeam.totalCallbk || 0, color: '#3b82f6' },
    { name: 'No Answer', value: currentTeam.totalN || 0, color: '#f59e0b' },
    { name: 'Not Interested', value: currentTeam.totalNi || 0, color: '#ef4444' },
  ];

  const sortedAndFilteredAgents = useMemo(() => {
    let result = teamAgents.filter(a => {
      const name = a.agentName || a.name || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    result.sort((a, b) => {
      let valA: any, valB: any;
      
      switch (sortConfig.key) {
        case 'name': 
          valA = a.agentName || a.name || '';
          valB = b.agentName || b.name || '';
          break;
        case 'booked': 
          valA = a.sale || 0;
          valB = b.sale || 0;
          break;
        case 'conversion': 
          valA = a.totalCalls > 0 ? (a.sale || 0) / a.totalCalls : 0;
          valB = b.totalCalls > 0 ? (b.sale || 0) / b.totalCalls : 0;
          break;
        case 'paidTime':
          valA = a.totalPaidTimeHours || 0;
          valB = b.totalPaidTimeHours || 0;
          break;
        default: valA = 0; valB = 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [teamAgents, searchTerm, sortConfig]);

  const totalAgents = sortedAndFilteredAgents.length;
  const totalPages = Math.ceil(totalAgents / agentsPerPage);
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const paginatedAgents = sortedAndFilteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleLoginAsAgent = async (agentUsername: string) => {
    try {
      const currentToken = localStorage.getItem('authToken');
      const currentRole = localStorage.getItem('userRole');
      const currentUsername = localStorage.getItem('username') || '';
      
      // Get or initialize navigation stack
      let navigationStack = [];
      const stackJson = localStorage.getItem('navigationStack');
      if (stackJson) {
        navigationStack = JSON.parse(stackJson);
      }
      
      // Push current level to stack
      if (currentToken && currentRole) {
        navigationStack.push({
          token: currentToken,
          role: currentRole,
          username: currentUsername
        });
      }
      
      const response = await impersonateAgent(agentUsername);
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.role || 'AGENT');
        localStorage.setItem('username', agentUsername);
        localStorage.setItem('navigationStack', JSON.stringify(navigationStack));
        window.location.reload();
      } else {
        showNotification('Failed to login as agent: ' + (response.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error logging in as agent:', error);
      showNotification('Error logging in as agent. Please try again.', 'error');
    }
  };

  const handleAddAgent = () => {
    if (newAgentForm.name.trim()) {
      const idNum = parseInt(newAgentForm.id) || Math.floor(Math.random() * 100000);
      onAddAgent?.({
        id_agent: idNum,
        ID: idNum,
        username: newAgentForm.name,
        calls: 0,
        name: newAgentForm.name,
        email: newAgentForm.email,
        phone: newAgentForm.phone,
        address: newAgentForm.address,
        avatar: 'https://picsum.photos/seed/agent/200',
        hourlyRate: newAgentForm.hourlyRate,
        campaign: team.teamName,
        role: UserRole.AGENT,
        streakDays: 0,
        stats: {
          [TimePeriod.TODAY]: { calls: 0, booked: 0, talkTimeMinutes: 0, waitTimeMinutes: 0, paidPauseHours: 0, dispositions: { booked: 0, callback: 0, noAnswer: 0, notInterested: 0 } },
          [TimePeriod.WEEK]: { calls: 0, booked: 0, talkTimeMinutes: 0, waitTimeMinutes: 0, paidPauseHours: 0, dispositions: { booked: 0, callback: 0, noAnswer: 0, notInterested: 0 } },
          [TimePeriod.MONTH]: { calls: 0, booked: 0, talkTimeMinutes: 0, waitTimeMinutes: 0, paidPauseHours: 0, dispositions: { booked: 0, callback: 0, noAnswer: 0, notInterested: 0 } }
        }
      });
      setNewAgentForm({ id: '', name: '', email: '', phone: '', address: '', hourlyRate: 0 });
      setShowAddAgentModal(false);
    }
  };

  // ✅ MODIFIED: Use topTeams from API for ranking instead of filtering prop
  // This ensures we see correct rankings even if we can't see all team data
  const teamRanks = useMemo(() => {
    // If topTeams is populated (from API), use it. Otherwise fall back to props.
    const sourceData = topTeams.length > 0 ? topTeams : teams;
    
    return sourceData.map((t: any) => ({
      ...t,
      totalBooked: t.totalSales,
      totalCalls: t.totalCalls,
      convRate: t.totalCalls > 0 ? (t.totalSales / t.totalCalls * 100) : 0,
      agentCount: t.agentCount
    })).sort((a: any, b: any) => b.totalBooked - a.totalBooked);
  }, [teams, topTeams, period]);

  const handleImportRecordings = async () => {
    try {
      setIsImportingRecordings(true);
      const response = await fetch(`${(import.meta as any).env.VITE_BACKEND_URL || 'http://novaadmin.ca'}/api/batch/import-recordings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        showNotification('Recordings import job started successfully!', 'success');
        const clientsResponse = await clientAPI.getAllClients();
        setClients(clientsResponse || []);
      } else {
        const errorText = await response.text();
        showNotification('Failed to start import job: ' + errorText, 'error');
      }
    } catch (error) {
      console.error('Error importing recordings:', error);
      showNotification('Error importing recordings. Please try again.', 'error');
    } finally {
      setIsImportingRecordings(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">{effectiveTeamName}</h1>
          <p className="text-slate-500 font-bold tracking-wide uppercase text-[10px]">Command Center</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-block bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black px-3 py-1.5 rounded-lg">
              👥 {teamAgents.length} Agent{teamAgents.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="w-full lg:w-80 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
          <div className="flex justify-between text-xs mb-3">
            <span className="text-slate-500 font-black uppercase tracking-widest">Goal Progress</span>
            <span className="text-blue-600 font-black">{totals.sumBooked}/15 Booked</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 relative"
              style={{ width: `${Math.min((totals.sumBooked / 15) * 100, 100)}%` }}
            >
              <div className="absolute top-0 right-0 w-8 h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-tight">
            Next Level: Top Performer Bonus
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Total Calls</p>
          <p className="text-3xl font-black text-blue-900">{totals.sumCalls}</p>
          <p className="text-xs text-blue-600 mt-2">this period</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Paid Time</p>
          <p className="text-3xl font-black text-emerald-900">{(currentTeam.totalCustomerTimeHours || 0).toFixed(1)}h</p>
          <p className="text-xs text-emerald-600 mt-2">Talk: {(currentTeam.totalCustomerTimeHours || 0).toFixed(1)}h</p>
          {/*<p className="text-xs text-emerald-600 mt-2">Talk: {(currentTeam.totalCustomerTimeHours || 0).toFixed(1)}h | Wait: {(currentTeam.totalWaitTimeHours || 0).toFixed(1)}h</p>*/}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2">Est. Earnings</p>
          <p className="text-3xl font-black text-purple-900">${(currentTeam.totalEstimatedEarnings || 0).toFixed(2)}</p>
          <p className="text-xs text-purple-600 mt-2">Rate: ${(currentTeam.costPerHour || 20).toFixed(0)}/hr</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Team Size</p>
          <p className="text-3xl font-black text-indigo-900">{teamAgents.length}</p>
          <p className="text-xs text-indigo-600 mt-2">agents</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[60%] bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
              Disposition Analysis
            </h2>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Avg: {formatPourcentage(avgConversion)}</div>
          </div>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-full h-full max-w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
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
                    <Cell fill="#10b981" stroke="#fff" strokeWidth={3} />
                    <Cell fill="#3b82f6" stroke="#fff" strokeWidth={3} />
                    <Cell fill="#f59e0b" stroke="#fff" strokeWidth={3} />
                    <Cell fill="#ef4444" stroke="#fff" strokeWidth={3} />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto mt-6 md:mt-0">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Booked</span>
                </div>
                <span className="text-slate-900 font-black text-2xl">{currentTeam.totalSales || 0}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Callback</span>
                </div>
                <span className="text-slate-900 font-black text-2xl">{currentTeam.totalCallbk || 0}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No Answer</span>
                </div>
                <span className="text-slate-900 font-black text-2xl">{currentTeam.totalN || 0}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Not Interested</span>
                </div>
                <span className="text-slate-900 font-black text-2xl">{currentTeam.totalNi || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[40%] bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <h2 className="text-xl font-black mb-6 text-slate-900 flex items-center gap-3">
            <span className="w-2 h-8 bg-emerald-600 rounded-full block"></span>
            Team Rankings
          </h2>
          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {teamRanks.map((t, index) => {
            const isCurrentTeam = t.teamName === (effectiveTeamName);
            const medals = ['🥇', '🥈', '🥉'];
            
            return (
              <div 
                key={t.id}
                className={`p-4 rounded-xl border-2 ${isCurrentTeam ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'bg-slate-50 border-slate-200'} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{index < 3 ? medals[index] : `#${index + 1}`}</span>
                    <h3 className="font-black text-base text-slate-900">{t.teamName}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Booked</p>
                    <p className="text-lg font-black text-blue-600">{t.totalSales}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conv %</p>
                    <p className="text-lg font-black text-emerald-600">{t.totalCalls > 0 ? formatPourcentage((t.totalSales / t.totalCalls) * 100) : '0,00%'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agents</p>
                    <p className="text-lg font-bold text-slate-700">{t.agentCount}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Agent Matrix</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none md:w-72">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input 
                  type="text" 
                  placeholder="Find operative..." 
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder-slate-300 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-8 py-5 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>Agent</th>
                  <th className="px-8 py-5 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('booked')}>Booked</th>
                  <th className="px-8 py-5 cursor-pointer hover:text-slate-900 transition-colors text-right" onClick={() => handleSort('conversion')}>Conv %</th>
                  <th className="px-8 py-5 text-right">Rate/Hour</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedAgents.map((agent, index) => {
                  const agentName = agent.agentName || agent.name || 'N/A';
                  const booked = agent.sale || 0;
                  const calls = agent.totalCalls || 0;
                  const conv = calls > 0 ? (booked / calls) * 100 : 0;
                  const agentId = agent.vicidialId || agent.id || agent.agentName;
                  const hourlyRate = agent.costPerHour || agent.hourlyRate || 0;
                  
                  return (
                    <tr key={`agent-${agentId}-${index}`} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl shadow-md border border-slate-200 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-all">
                            {agentName.charAt(0).toUpperCase()}
                          </div>
                          <button 
                            onClick={() => handleLoginAsAgent(agent.username || agentName)}
                            className="font-black text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                            title="Login as this agent"
                          >
                            {agentName}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-blue-600 text-lg text-right">{booked}</td>
                      <td className="px-8 py-5 font-bold text-slate-500 text-right">{formatPourcentage(conv)}</td>
                      <td className="px-8 py-5 font-bold text-slate-600 text-right">${hourlyRate.toFixed(2)}/hr</td>
                      <td className="px-8 py-5 text-center relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === agentId ? null : agentId)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <span className="text-xl font-black text-slate-400">⋮</span>
                        </button>
                        {openMenuId === agentId && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setSelectedAgentForPassword(agent as any);
                                setShowPasswordModal(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-amber-50 text-slate-900 font-bold text-sm transition-all border-b border-slate-100"
                            >
                              Update Password
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAgentForRate(agent as any);
                                setShowUpdateRateModal(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-600 font-bold text-sm transition-all"
                            >
                              Update Rate/hr
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-8 py-6 border-t border-slate-100">
                <div className="text-sm text-slate-600 font-bold">
                  Showing {indexOfFirstAgent + 1}-{Math.min(indexOfLastAgent, totalAgents)} of {totalAgents} agents
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black text-sm transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-black text-sm transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black text-sm transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl shadow-2xl overflow-hidden border-0">
        <div className="p-10 border-b border-blue-100 bg-blue-50/60 rounded-t-3xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight uppercase">Client Database</h2>
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mt-2">Team Client Interactions • Live Updates</p>
          </div>
          <div className="flex gap-3">
            <button
              aria-label="Import Recordings"
              onClick={handleImportRecordings}
              disabled={isImportingRecordings}
              className={`px-6 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                isImportingRecordings 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isImportingRecordings ? 'Importing...' : '📥 Import Recordings'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 px-10 pb-2">
          <div className="bg-white border-2 border-blue-300 p-6 rounded-2xl shadow-md text-center hover:scale-105 hover:shadow-xl transition-all">
            <p className="text-xs text-blue-600 font-extrabold uppercase tracking-widest mb-2">Total Clients</p>
            <p className="text-3xl font-extrabold text-blue-900">{clientStats.total}</p>
          </div>
          <div className="bg-white border-2 border-amber-300 p-6 rounded-2xl shadow-md text-center hover:scale-105 hover:shadow-xl transition-all">
            <p className="text-xs text-amber-600 font-extrabold uppercase tracking-widest mb-2">Pending</p>
            <p className="text-3xl font-extrabold text-amber-900">{clientStats.pending}</p>
          </div>
          <div className="bg-white border-2 border-emerald-300 p-6 rounded-2xl shadow-md text-center hover:scale-105 hover:shadow-xl transition-all">
            <p className="text-xs text-emerald-600 font-extrabold uppercase tracking-widest mb-2">Confirmed</p>
            <p className="text-3xl font-extrabold text-emerald-900">{clientStats.confirmed}</p>
          </div>
          <div className="bg-white border-2 border-slate-300 p-6 rounded-2xl shadow-md text-center hover:scale-105 hover:shadow-xl transition-all">
            <p className="text-xs text-slate-600 font-extrabold uppercase tracking-widest mb-2">Completed</p>
            <p className="text-3xl font-extrabold text-slate-900">{clientStats.completed}</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="px-10 py-6 bg-white/50 border-b border-blue-100 flex flex-col sm:flex-row gap-4 items-center">
          <label className="text-sm font-bold text-slate-700">Filter by Date:</label>
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="date"
              value={clientStartDate}
              onChange={(e) => {
                setClientStartDate(e.target.value);
                setCurrentClientPage(1);
              }}
              className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <span className="text-slate-600 font-bold">to</span>
            <input
              type="date"
              value={clientEndDate}
              onChange={(e) => {
                setClientEndDate(e.target.value);
                setCurrentClientPage(1);
              }}
              className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
            {(clientStartDate || clientEndDate) && (
              <button
                onClick={() => {
                  setClientStartDate('');
                  setClientEndDate('');
                  setCurrentClientPage(1);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto mt-8">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur">
              <tr className="text-blue-300 text-[10px] uppercase tracking-wider font-extrabold">
                <th className="px-2 py-2">Client Name</th>
                <th className="px-2 py-2">Contact Info</th>
                <th className="px-2 py-2">Agent</th>
                <th className="px-2 py-2">Service</th>
                <th className="px-2 py-2">Visit Date</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Recording</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teamClients.map((client) => {
                return (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg shadow-md border border-slate-200 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-[9px]">
                          {(client.nom_complet || client.nomComplet || 'N/A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[11px]">{client.nom_complet || client.nomComplet || 'N/A'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">ID: {client.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-slate-700 flex items-center gap-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          <span className="text-blue-600 flex-shrink-0">📧</span> <span className="truncate">{client.email}</span>
                        </p>
                        <p className="text-[9px] font-bold text-slate-700 flex items-center gap-0.5">
                          <span className="text-emerald-600 flex-shrink-0">📱</span> {client.telephone}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-900">{client.agent?.username || 'N/A'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{client.agent?.campaign || ''}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-900">{client.nom_service || 'N/A'}</p>
                        {client.adresse && (
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 max-w-[150px] truncate">{client.adresse}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-[9px] font-bold text-slate-700 whitespace-nowrap">
                        {client.date_visite || 'Not scheduled'}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusColor(client.statut_service || client.statutService || '')}`}>
                        {getStatusLabel(client.statut_service || client.statutService || '')}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {client.recordingUrl ? (
                        <a
                          href={client.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                        >
                          🎧 Listen
                        </a>
                      ) : (
                        <span className="text-[9px] text-slate-400 whitespace-nowrap">No recording</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button 
                        onClick={() => {
                          setSelectedClient(client);
                          setShowViewModal(true);
                        }}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded border border-blue-200 transition-all whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalClientPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100 bg-white">
              <div className="text-xs font-bold text-slate-500">
                Page {currentClientPage} of {totalClientPages} • {filteredClients.length} total
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentClientPage(prev => Math.max(1, prev - 1))}
                  disabled={currentClientPage === 1}
                  className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                    currentClientPage === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95'
                  }`}
                >
                  ← Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalClientPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentClientPage(page)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                        currentClientPage === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentClientPage(prev => Math.min(totalClientPages, prev + 1))}
                  disabled={currentClientPage === totalClientPages}
                  className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                    currentClientPage === totalClientPages
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Add New Agent to {team.teamName}</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Agent ID</label>
                <input
                  type="text"
                  placeholder="AG-001"
                  value={newAgentForm.id}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Wick"
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newAgentForm.email}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={newAgentForm.phone}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                <input
                  type="text"
                  placeholder="123 Main St, City, State 12345"
                  value={newAgentForm.address}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hourly Rate ($)</label>
                <input
                  type="number"
                  placeholder="25"
                  value={newAgentForm.hourlyRate || ''}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddAgentModal(false)}
                className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgent}
                disabled={!newAgentForm.name.trim() || !newAgentForm.id.trim()}
                className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black transition-all"
              >
                Add Agent to {team.teamName}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateRateModal && selectedAgentForRate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Update Hourly Rate</h3>
            <p className="text-sm text-slate-500 mb-6">Agent: <span className="font-black text-slate-900">{selectedAgentForRate.name}</span></p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">New Rate ($/hr)</label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-blue-600">$</span>
                  <input
                    type="number"
                    placeholder="25"
                    value={newRate || ''}
                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                  <span className="text-xl font-black text-slate-400">/hr</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Current Rate</p>
                <p className="text-2xl font-black text-blue-900">${selectedAgentForRate.hourlyRate}/hr</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateRateModal(false);
                  setSelectedAgentForRate(null);
                }}
                className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                // TeamDashboard.tsx inside the Update Rate Modal button
onClick={async () => {
  if (selectedAgentForRate && newRate >= 0) {
    try {
      // Try every possible ID field the object might have 
      // since the backend requires the numeric Vicidial ID or Database ID
      const agentId = 
        selectedAgentForRate.ID || 
        selectedAgentForRate.id_agent || 
        (selectedAgentForRate as any).vicidialId;

      if (!agentId) {
showNotification("Error: Could not find a valid ID for this agent.", 'error');
        return;
      }

      await agentAPI.updateCostPerHour(agentId, newRate);
      
      setShowUpdateRateModal(false);
      setSelectedAgentForRate(null);
      
      // Refresh to show new data
      window.location.reload(); 
    } catch (e) {
      showNotification('Failed to update rate. Check console for details.', 'error');
    }
  }
}}
                disabled={newRate <= 0}
                className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black transition-all"
              >
                Update Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedAgentForPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Reset Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedAgentForPassword(null);
                }}
                className="text-white hover:text-amber-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              <QuickPasswordChange
  // Use casting to 'any' to allow access to backend-specific fields
  userEmail={(selectedAgentForPassword as any).agentName || selectedAgentForPassword.name || ''}
  agentId={(selectedAgentForPassword as any).vicidialId || selectedAgentForPassword.id} 
  title={`Reset password for ${(selectedAgentForPassword as any).agentName || selectedAgentForPassword.name}`}
  isAdminReset={true}
  onClose={() => {
    setShowPasswordModal(false);
    setSelectedAgentForPassword(null);
  }}
/>
            </div>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {showViewModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-black text-white">Client Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedClient(null);
                }}
                className="text-white hover:text-blue-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Client ID</label>
                  <p className="text-sm font-black text-slate-900">#{selectedClient.id}</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                  <p className={`inline-block px-2 py-1 rounded-lg text-xs font-black uppercase ${getStatusColor(selectedClientStatus)}`}>
                    {getStatusLabel(selectedClientStatus)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <p className="text-sm font-black text-slate-900">{selectedClient.nom_complet || selectedClient.nomComplet || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email</label>
                  <p className="text-xs font-bold text-slate-700">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Phone</label>
                  <p className="text-xs font-bold text-slate-700">{selectedClient.telephone}</p>
                </div>
              </div>

              {selectedClient.agent && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Agent</label>
                    <p className="text-xs font-bold text-slate-700">{selectedClient.agent.username}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Team</label>
                    <p className="text-xs font-bold text-slate-700">{selectedClient.agent.campaign || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Service</label>
                <p className="text-xs font-bold text-slate-700">{selectedClient.nom_service || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Address</label>
                <p className="text-xs font-bold text-slate-700">{selectedClient.adresse || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Visit Date</label>
                <p className="text-xs font-bold text-slate-700">{selectedClient.date_visite || 'Not scheduled'}</p>
              </div>

              {selectedClient.commentaire && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Comments</label>
                  <p className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedClient.commentaire}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedClient(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-all"
                >
                  Close
                </button>
              </div>
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

      {/* Main component closing */}
    </div>
  );
};

export default TeamDashboard;