  // Utility to map all status codes to user-friendly labels
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirme':
      case 'confirmed':
        return 'Confirmed';
      case 'en_attente':
      case 'pending':
        return 'Pending';
      case 'annule':
      case 'cancelled':
        return 'Cancelled';
      case 'termine':
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };
import React, { useEffect, useState } from 'react';
import { Agent, Team, TimePeriod, Client } from '../types';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { novaAPI, NovaStatsDTO, clientAPI, teamAPI, impersonateTeam } from '../src/services/apiService';
import axios from 'axios';

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

interface HQDashboardProps {
  teams: Team[];
  agents: Agent[];
  period: TimePeriod;
  clients?: Client[];
  periodStats?: any;
}

const HQDashboard: React.FC<HQDashboardProps> = ({ teams, agents, period, clients = [], periodStats }) => {
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [novaStats, setNovaStats] = useState<NovaStatsDTO | null>(null);
  const [clientsData, setClientsData] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientPage, setClientPage] = useState(1);
  const [clientsPerPage] = useState(5);
  const [clientSortField, setClientSortField] = useState<string>('nom_complet');
  const [clientSortOrder, setClientSortOrder] = useState<'asc' | 'desc'>('asc');
  const [clientStartDate, setClientStartDate] = useState<string>('');
  const [clientEndDate, setClientEndDate] = useState<string>('');
  
  // Initialize edit form data
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [currentTeamPage, setCurrentTeamPage] = useState(1);
  const [teamsPerPage] = useState(5);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [recordingsImported, setRecordingsImported] = useState(false);
  const [isImportingRecordings, setIsImportingRecordings] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let statsData: NovaStatsDTO;
        
        // Use periodStats if available (from period button click), otherwise fetch default
        if (periodStats) {
          // Convert API response to NovaStatsDTO format
          console.log('HQDashboard: Using periodStats:', {
            calls: periodStats.grandTotalCalls,
            booked: periodStats.grandTotalBooked,
            period: period
          });
          statsData = {
            novaName: periodStats.novaName || 'admin_nova',
            teamCount: periodStats.teamCount || 0,
            grandTotalAgentCount: periodStats.grandTotalAgentCount || 0,
            grandTotalCalls: periodStats.grandTotalCalls || 0,
            grandTotalBooked: periodStats.grandTotalBooked || 0,
            grandTotalSales: periodStats.grandTotalBooked || 0,
            grandTotalTalkTimeHours: periodStats.grandTotalTalkTimeHours || 0,
            grandTotalWaitTimeHours: periodStats.grandTotalWaitTimeHours || 0,
            grandTotalEarnings: periodStats.grandTotalEarnings || 0,
            top3Teams: periodStats.top3Teams || [],
            top3Agents: periodStats.top3Agents || [],
            teamsList: periodStats.teamsList || [],
          };
          console.log('HQDashboard: Converted to statsData - calls:', statsData.grandTotalCalls);
        } else {
          // Fetch default stats for TODAY
          console.log('HQDashboard: Fetching default stats for period:', period);
          statsData = await novaAPI.getMyStats();
          console.log('HQDashboard: Fetched default stats - calls:', statsData.grandTotalCalls);
        }
        
        const clientsResponse = await clientAPI.getAllClients();
        
        console.log('HQDashboard: Setting novaStats - calls:', statsData.grandTotalCalls, 'booked:', statsData.grandTotalBooked);
        setNovaStats(statsData);
        setClientsData(clientsResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [periodStats]);

  // Initial load when component mounts - fetch default stats
  useEffect(() => {
    if (!periodStats && !novaStats) {
      const fetchInitial = async () => {
        try {
          setIsLoading(true);
          const [statsData, clientsResponse] = await Promise.all([
            novaAPI.getMyStats(),
            clientAPI.getAllClients()
          ]);
          console.log('HQDashboard: Initial load - calls:', statsData.grandTotalCalls);
          setNovaStats(statsData);
          setClientsData(clientsResponse);
        } catch (error) {
          console.error('Error in initial load:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitial();
    }
  }, []);

  // Map frontend status to backend and vice versa
  const statusMap: Record<string, string> = {
    pending: 'en_attente',
    confirmed: 'confirme',
    cancelled: 'annule',
    completed: 'termine',
    en_attente: 'pending',
    confirme: 'confirmed',
    annule: 'cancelled',
    termine: 'completed',
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirme':
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'en_attente':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'annule':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'termine':
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleStatusChange = async (clientId: number, newStatus: string) => {
    try {
      // 1. Optimistic UI Update (Update table immediately)
      setClientsData(prevClients => 
        prevClients.map(c => 
          c.id === clientId 
            ? { ...c, statut_service: newStatus as any, statutService: newStatus } 
            : c
        )
      );

      // 2. Call API
      await clientAPI.updateClientStatus(clientId, newStatus);
      
      // Optional: Refetch to ensure consistency
      // const clientsResponse = await clientAPI.getAllClients();
      // setClientsData(clientsResponse);
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Failed to update status', 'error');
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditFormData({
      nom_complet: client.nom_complet || client.nomComplet,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
      code_postal: client.code_postal,
      date_visite: client.date_visite,
      nom_service: client.nom_service,
      statut_service: client.statut_service || client.statutService as any,
      commentaire: client.commentaire,
    });
    setShowEditModal(true);
  };

  const handleSaveClient = async () => {
    if (!selectedClient) return;
    try {
      await clientAPI.updateClient(selectedClient.id, editFormData);
      
      // Optimistic update
      setClientsData(prev => prev.map(c => 
        c.id === selectedClient.id ? { ...c, ...editFormData } : c
      ));

      // Close modal
      setShowEditModal(false);
      setSelectedClient(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating client:', error);
      showNotification('Failed to update client. Please try again.', 'error');
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedTeam || !newPassword) {
      showNotification('Please enter a password', 'warning');
      return;
    }

    if (newPassword.length < 3) {
      showNotification('Password must be at least 3 characters', 'warning');
      return;
    }

    try {
      await teamAPI.resetPassword(selectedTeam.teamId || selectedTeam.id, newPassword);
      showNotification('Password updated successfully', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('Failed to update password. Please try again.', 'error');
    }
  };

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
        setRecordingsImported(true);
        const clientsResponse = await clientAPI.getAllClients();
        setClientsData(clientsResponse);
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

  const handleDeleteClient = async (clientId: number, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      try {
        await clientAPI.deleteClient(clientId);
        setClientsData(prevClients => prevClients.filter(c => c.id !== clientId));
        showNotification('Client deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('Failed to delete client. Please try again.', 'error');
      }
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (window.confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      try {
        // Assuming there's a deleteTeam function in teamAPI
        // If not, we'll need to add it to apiService.ts
        await fetch(`${(import.meta as any).env.VITE_BACKEND_URL || 'http://novaadmin.ca'}/api/dashboard/teams/${teamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        // Refresh teams list
        const statsData = await novaAPI.getMyStats();
        setNovaStats(statsData);
        showNotification('Team deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting team:', error);
        showNotification('Failed to delete team. Please try again.', 'error');
      }
    }
  };

  const handleLoginAsTeam = async (teamUsername: string) => {
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

      const response = await impersonateTeam(teamUsername);
      
      if (!response.success) {
        showNotification(response.message || 'Failed to login as team', 'error');
        return;
      }
      
      localStorage.setItem('authToken', response.token ?? '');
      localStorage.setItem('userRole', response.role ?? '');
      localStorage.setItem('username', teamUsername);
      localStorage.setItem('navigationStack', JSON.stringify(navigationStack));
      
      window.location.reload();
    } catch (error) {
      console.error('Error impersonating team:', error);
      showNotification('Failed to login as team. Please try again.', 'error');
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamData.username || !newTeamData.email || !newTeamData.phoneNumber || !newTeamData.password) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    if (newTeamData.password.length < 3) {
      showNotification('Password must be at least 3 characters', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newTeamData.email)) {
      showNotification('Please enter a valid email address', 'warning');
      return;
    }

    try {
      await teamAPI.createTeam({
        username: newTeamData.username,
        password: newTeamData.password,
        email: newTeamData.email,
        telephone: newTeamData.phoneNumber
      });
      showNotification('Team created successfully!', 'success');
      setShowAddTeamModal(false);
      setNewTeamData({ username: '', email: '', phoneNumber: '', password: '' });
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating team:', error);
      showNotification('Failed to create team: ' + (error?.response?.data?.message || error.message || 'Unknown error'), 'error');
    }
  };

  const totalCalls = novaStats?.grandTotalCalls || agents.reduce((sum, a) => sum + (a.calls || 0), 0);
  const totalBooked = novaStats?.grandTotalSales || agents.reduce((sum, a) => sum + (a.SALE || 0), 0);
  const activeAgents = novaStats?.grandTotalAgentCount || agents.length;

  const clientStats = {
    total: clientsData.length,
    pending: clientsData.filter(c => c.statutService === 'pending').length,
    confirmed: clientsData.filter(c => c.statutService === 'confirmed').length,
    completed: clientsData.filter(c => c.statutService === 'completed').length,
    cancelled: clientsData.filter(c => c.statutService === 'cancelled').length,
  };

  const recentClients = clientsData;

  // Filter clients by date range
  const filteredByDateClients = recentClients.filter((client) => {
    if (!clientStartDate && !clientEndDate) return true;
    
    const clientDate = client.date_creation || client.date_visite;
    if (!clientDate) return false;
    
    const cDate = new Date(clientDate).getTime();
    const startTime = clientStartDate ? new Date(clientStartDate).getTime() : 0;
    const endTime = clientEndDate ? new Date(clientEndDate).getTime() + 86400000 : Infinity; // +1 day for end date
    
    return cDate >= startTime && cDate <= endTime;
  });

  // Sorting function for clients
  const sortedRecentClients = [...filteredByDateClients].sort((a, b) => {
    let aValue: any = a[clientSortField as keyof Client];
    let bValue: any = b[clientSortField as keyof Client];

    // Handle null/undefined values
    aValue = aValue ?? '';
    bValue = bValue ?? '';

    // Convert to lowercase for string comparison
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    // Numeric comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return clientSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // String comparison
    if (clientSortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const teamStats = (novaStats?.teamsList || teams).map(t => ({
    name: t.teamName,
    rank: t.rank,
    bookings: t.totalSales || 0,
    calls: t.totalCalls || 0,
    agentCount: t.agentCount || 0,
    conversion: t.totalCalls > 0 ? ((t.totalSales || 0) / t.totalCalls * 100) : 0
  })).sort((a, b) => b.bookings - a.bookings);

  const allAgentsFromAPI = (novaStats && Array.isArray(novaStats.teamsList) ? novaStats.teamsList : []).flatMap(t =>
    (Array.isArray(t.agentsList) ? t.agentsList : []).map(a => ({
    id_agent: a.vicidialId,
    ID: a.vicidialId,
    username: a.agentName,
    name: a.agentName,
    calls: a.totalCalls,
    SALE: a.sale,
    talk: (a.talkTimeHours * 60).toString(),
    wait: (a.waitTimeHours * 60).toString(),
    efficiency: parseFloat(a.talkTimePercentage.replace('%', '')),
    conversion: a.totalCalls > 0 ? ((a.sale / a.totalCalls) * 100) : 0,
    totalMinutes: a.totalPaidTimeHours * 60,
    team: { teamName: t.teamName },
    mostCurrentUserGroup: t.teamName
  }))) || [];

  const agentRankings = allAgentsFromAPI.length > 0 ? allAgentsFromAPI : agents.map((agent, index) => {
    const talkMinutes = agent.talk ? parseFloat(agent.talk) : 0;
    const waitMinutes = agent.wait ? parseFloat(agent.wait) : 0;
    const totalTime = talkMinutes + waitMinutes;
    const efficiency = totalTime > 0 ? ((talkMinutes / totalTime) * 100).toFixed(1) : '0';
    const conversion = agent.calls > 0 ? ((agent.SALE || 0) / agent.calls * 100) : 0;
    
    return {
      ...agent,
      efficiency,
      conversion,
      totalMinutes: totalTime
    };
  });

  const sortedAgents = agentRankings.sort((a, b) => (b.SALE || 0) - (a.SALE || 0));
  const topAgents = sortedAgents.slice(0, 5);

  const allTeams = novaStats?.teamsList || teams;
  const filteredTeams = allTeams.filter(t => 
    t.teamName.toLowerCase().includes(teamSearchTerm.toLowerCase())
  );
  const totalTeamPages = Math.ceil(filteredTeams.length / teamsPerPage);
  const indexOfLastTeam = currentTeamPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const paginatedTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);

  useEffect(() => {
    setCurrentTeamPage(1);
  }, [teamSearchTerm]);

  const totalNi = Array.isArray(novaStats?.teamsList) ? novaStats.teamsList.reduce((sum, t) => sum + t.totalNi, 0) : 0;
  const totalN = Array.isArray(novaStats?.teamsList) ? novaStats.teamsList.reduce((sum, t) => sum + t.totalN, 0) : 0;
  const totalCallbk = Array.isArray(novaStats?.teamsList) ? novaStats.teamsList.reduce((sum, t) => sum + t.totalCallbk, 0) : 0;

  const dispositionData = [
    { name: 'Booked', value: totalBooked, color: '#10b981' },
    { name: 'Callback', value: totalCallbk, color: '#3b82f6' },
    { name: 'No Answer', value: totalN, color: '#f59e0b' },
    { name: 'Not Interested', value: totalNi, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">NOVA Dashboard</h1>
          <p className="text-slate-500 font-bold tracking-wide uppercase text-[10px]">Global Command Center • Intelligence Hub • Sync: Live • {period}</p>
        </div>
        <div className="w-full lg:w-80 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
          <div className="flex justify-between text-xs mb-3">
            <span className="text-slate-500 font-black uppercase tracking-widest">System Health</span>
            <span className="text-emerald-600 font-black">All Systems Operational</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-green-600 transition-all duration-1000 relative" style={{ width: '100%' }}>
              <div className="absolute top-0 right-0 w-8 h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-tight">
            {activeAgents} Active Agents • {novaStats?.teamCount || teams.length} Teams
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Total Calls</p>
          <p className="text-3xl font-black text-blue-900">{totalCalls.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-2">this period</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Total Teams</p>
          <p className="text-3xl font-black text-emerald-900">{novaStats?.teamCount || teams.length}</p>
          <p className="text-xs text-emerald-600 mt-2">active teams</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Global Booked</p>
          <p className="text-3xl font-black text-indigo-900">{totalBooked.toLocaleString()}</p>
          <p className="text-xs text-indigo-600 mt-2">total bookings</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Total Agents</p>
          <p className="text-3xl font-black text-amber-900">{activeAgents}</p>
          <p className="text-xs text-amber-600 mt-2">active agents</p>
        </div>
      </div>

      {/* Disposition and Team Rankings */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[60%] bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
              Disposition Analysis
            </h2>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Overview</div>
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
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {dispositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto mt-6 md:mt-0">
              {dispositionData.map((d, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm">
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

        <div className="w-full lg:w-[40%] bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col">
          <h2 className="text-2xl font-black mb-10 text-slate-900 tracking-tight uppercase">Team Rankings</h2>
          <div className="space-y-6 flex-1">
            {teamStats.slice(0, 3).map((team, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-all group-hover:scale-110 ${i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : i === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-black text-base uppercase transition-colors group-hover:text-blue-600">{team.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{team.agentCount} Agents • {formatPourcentage(team.conversion)} Conv</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 font-black text-2xl tracking-tighter">{team.bookings}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{team.calls} calls</p>
                  <div className="w-24 h-2 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000" 
                      style={{ width: `${(team.bookings / (teamStats[0].bookings || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-12 py-5 bg-slate-900 hover:bg-slate-800 text-white transition-all rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl">
            View All Teams
          </button>
        </div>
      </div>

      {/* Team Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Team Matrix</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none md:w-72">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search teams..." 
                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder-slate-300 shadow-sm"
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-lg">+</span>
              Add Team
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5">Team Name</th>
                <th className="px-8 py-5 text-right">Sales</th>
                <th className="px-8 py-5 text-right">Calls</th>
                <th className="px-8 py-5 text-right">Conv %</th>
                <th className="px-8 py-5 text-right">Agents</th>
                <th className="px-8 py-5 text-right">Rank</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTeams.map((team, index) => {
                const conv = team.totalCalls > 0 ? ((team.totalSales / team.totalCalls) * 100) : 0;
                const globalRank = filteredTeams.indexOf(team) + 1;
                
                return (
                  <tr key={team.teamName} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl shadow-md border border-slate-200 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-all">
                          {team.teamName.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={() => handleLoginAsTeam(team.teamName)}
                          className="font-black text-slate-900 text-base hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {team.teamName}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-blue-600 text-lg text-right">{team.totalSales}</td>
                    <td className="px-8 py-5 font-bold text-slate-500 text-right">{team.totalCalls}</td>
                    <td className="px-8 py-5 font-bold text-emerald-600 text-right">{formatPourcentage(conv)}</td>
                    <td className="px-8 py-5 font-bold text-slate-600 text-right">{team.agentCount}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                        globalRank === 1 ? 'bg-amber-50 text-amber-700 border-2 border-amber-200' :
                        globalRank === 2 ? 'bg-slate-100 text-slate-700 border-2 border-slate-300' :
                        globalRank === 3 ? 'bg-orange-50 text-orange-700 border-2 border-orange-200' :
                        'bg-slate-50 text-slate-600 border-2 border-slate-200'
                      }`}>
                        #{globalRank}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => handleDeleteTeam((('id' in team && team.id !== undefined) ? team.id : Number((team as any).teamId)), team.teamName)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[9px] font-bold uppercase rounded border border-red-200 transition-all whitespace-nowrap"
                        >
                          Delete
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === team.teamName ? null : team.teamName)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <span className="text-xl font-black text-slate-400">⋮</span>
                          </button>
                          {openDropdown === team.teamName && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  setSelectedTeam(team);
                                  setShowPasswordModal(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                              >
                                Update Password
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  const newRate = prompt('Enter new Rate/hr for this team:');
                                  if (newRate) {
                                    const rateValue = parseFloat(newRate);
                                    if (!isNaN(rateValue) && rateValue > 0) {
                                      teamAPI.updateTeamCost((('id' in team && team.id !== undefined) ? team.id : Number((team as any).teamId)), rateValue)
                                        .then(() => showNotification('Rate/hr updated successfully', 'success'))
                                        .catch(() => showNotification('Failed to update Rate/hr. Please try again.', 'error'));
                                    } else {
                                      showNotification('Please enter a valid positive number.', 'warning');
                                    }
                                  }
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                              >
                                Update Rate/hr
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalTeamPages > 1 && (
            <div className="flex items-center justify-between px-8 py-6 border-t border-slate-100">
              <div className="text-sm text-slate-600 font-bold">
                Showing {indexOfFirstTeam + 1}-{Math.min(indexOfLastTeam, filteredTeams.length)} of {filteredTeams.length} teams
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTeamPage(prev => Math.max(1, prev - 1))}
                  disabled={currentTeamPage === 1}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black text-sm transition-all"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalTeamPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentTeamPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-black text-sm transition-all ${
                        currentTeamPage === pageNum
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentTeamPage(prev => Math.min(totalTeamPages, prev + 1))}
                  disabled={currentTeamPage === totalTeamPages}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black text-sm transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Top 5 Performers • Live Leaderboard</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Real-time performance rankings</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
              <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">🥇 Top Agent</p>
              <p className="text-lg font-black text-amber-900 mt-1">{topAgents[0]?.username || 'N/A'}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Avg Sales</p>
              <p className="text-lg font-black text-blue-900 mt-1">{(totalBooked / activeAgents).toFixed(1)}</p>
            </div>
          </div>
        </div>
        <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-4 py-4">Rank & Agent</th>
                <th className="px-4 py-4">Team</th>
                <th className="px-4 py-4 text-right">Sales</th>
                <th className="px-4 py-4 text-right">Calls</th>
                <th className="px-4 py-4 text-right">Conv %</th>
                <th className="px-4 py-4">Efficiency</th>
                <th className="px-4 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topAgents.map((agent, i) => {
                const teamName = agent.team?.teamName || agent.mostCurrentUserGroup || 'N/A';
                return (
                  <tr key={agent.id_agent} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm transition-all group-hover:scale-110 ${
                          i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 
                          i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                          i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl shadow-md border border-slate-100 group-hover:scale-110 transition-all bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                            {agent.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base tracking-tight">{agent.username}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {agent.ID}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wide">
                        {teamName}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{agent.SALE || 0}</span>
                        {i === 0 && <span className="text-[9px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 mt-1">🏆 Leader</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-base font-black text-slate-700">{agent.calls || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-lg font-black ${parseFloat(agent.conversion) > 15 ? 'text-emerald-600' : parseFloat(agent.conversion) > 10 ? 'text-blue-600' : 'text-slate-600'}`}>
                        {formatPourcentage(agent.conversion)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800">{agent.efficiency}%</span>
                        <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${agent.efficiency}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {[1,2,3].map(j => (
                          <div key={j} className={`w-1.5 h-6 rounded-full ${i < 3 ? 'bg-emerald-500' : i < 7 ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ opacity: 1 - (j * 0.2) }}></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>


      
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client ID</label>
                  <p className="text-sm font-black text-slate-900">#{selectedClient.id}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                  <p className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(selectedClient.statut_service || selectedClient.statutService || '')}`}>
                    {getStatusLabel(selectedClient.statut_service || selectedClient.statutService || '')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <p className="text-sm font-black text-slate-900">{selectedClient.nom_complet || selectedClient.nomComplet || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">📧 Email</label>
                  <p className="text-xs font-bold text-slate-700">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">📱 Phone</label>
                  <p className="text-xs font-bold text-slate-700">{selectedClient.telephone}</p>
                </div>
              </div>

              {selectedClient.agent && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agent</label>
                    <p className="text-xs font-bold text-slate-700">{selectedClient.agent.username}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team</label>
                    <p className="text-xs font-bold text-slate-700">{selectedClient.agent.campaign || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service</label>
                <p className="text-xs font-bold text-slate-700">{selectedClient.nom_service || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</label>
                <p className="text-xs font-bold text-slate-700">{selectedClient.adresse || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visit Date</label>
                <p className="text-xs font-bold text-slate-700">{selectedClient.date_visite || 'Not scheduled'}</p>
              </div>

              {selectedClient.commentaire && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comments</label>
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
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedClient);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-black text-white">Edit Client</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedClient(null);
                }}
                className="text-white hover:text-emerald-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-slate-500 mb-6">Client ID: <span className="font-black text-slate-900">#{selectedClient.id}</span></p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.nom_complet || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, nom_complet: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.telephone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                  <input
                    type="text"
                    value={editFormData.adresse || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={editFormData.code_postal || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, code_postal: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visit Date</label>
                    <input
                      type="date"
                      value={editFormData.date_visite || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, date_visite: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service</label>
                  <input 
                    type="text"
                    value={editFormData.nom_service || ''}
                    onChange={e => setEditFormData({ ...editFormData, nom_service: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={editFormData.statut_service || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, statut_service: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  >
                    <option value="en_attente">Pending</option>
                    <option value="confirme">Confirmed</option>
                    <option value="annule">Cancelled</option>
                    <option value="termine">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Comments</label>
                  <textarea
                    value={editFormData.commentaire || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, commentaire: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClient}
                  className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal, Password Update Modal, Add Team Modal etc. (kept as is) */}
      {/* ... (Team Details Modal, Password Modal, Add Team Modal blocks remain unchanged) ... */}
      
      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedTeam.teamName} Details</h2>
                <p className="text-emerald-100 text-sm font-bold mt-1">Team Performance Overview</p>
              </div>
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setSelectedTeam(null);
                }}
                className="text-white hover:text-emerald-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              {/* Team Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Total Sales</p>
                  <p className="text-2xl font-black text-blue-900">{selectedTeam.totalSales}</p>
                </div>
                <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Total Calls</p>
                  <p className="text-2xl font-black text-slate-900">{selectedTeam.totalCalls}</p>
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Conversion</p>
                  <p className="text-2xl font-black text-emerald-900">{formatPourcentage(selectedTeam.totalCalls > 0 ? ((selectedTeam.totalSales / selectedTeam.totalCalls) * 100) : 0)}</p>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">Agents</p>
                  <p className="text-2xl font-black text-amber-900">{selectedTeam.agentCount}</p>
                </div>
              </div>

              {/* Team Agents List */}
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Team Agents</h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                        <th className="px-6 py-4">Agent Name</th>
                        <th className="px-6 py-4 text-right">Sales</th>
                        <th className="px-6 py-4 text-right">Calls</th>
                        <th className="px-6 py-4 text-right">Conv %</th>
                        <th className="px-6 py-4 text-right">Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTeam.agentsList && selectedTeam.agentsList.length > 0 ? (
                        selectedTeam.agentsList.map((agent: any, index: number) => {
                          const agentConv = agent.totalCalls > 0 ? ((agent.sale / agent.totalCalls) * 100) : 0;
                          return (
                            <tr key={agent.vicidialId} className="hover:bg-slate-50 transition-all">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                                    {agent.agentName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-900 text-sm">{agent.agentName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">ID: {agent.vicidialId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-blue-600">{agent.sale}</td>
                              <td className="px-6 py-4 text-right font-bold text-slate-600">{agent.totalCalls}</td>
                              <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatPourcentage(agentConv)}</td>
                              <td className="px-6 py-4 text-right">
                                <span className="inline-block px-2 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700">#{agent.rank}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">
                            No agents found in this team
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setSelectedTeam(null);
                }}
                className="w-full px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all mt-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-black text-white">Update Team Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setSelectedTeam(null);
                }}
                className="text-white hover:text-blue-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-2">Team: <span className="font-black text-slate-900">{selectedTeam.teamName}</span></p>
                <p className="text-xs text-slate-400">Enter a new password for all agents in this team</p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold"
                />
                <p className="text-xs text-slate-400 mt-2">Minimum 4 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setSelectedTeam(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePassword}
                  className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-black text-white">Add New Team</h2>
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setNewTeamData({ username: '', email: '', phoneNumber: '', password: '' });
                }}
                className="text-white hover:text-emerald-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeamData.username}
                    onChange={(e) => setNewTeamData({ ...newTeamData, username: e.target.value })}
                    placeholder="Team username"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newTeamData.email}
                    onChange={(e) => setNewTeamData({ ...newTeamData, email: e.target.value })}
                    placeholder="team@example.com"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newTeamData.phoneNumber}
                    onChange={(e) => setNewTeamData({ ...newTeamData, phoneNumber: e.target.value })}
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newTeamData.password}
                    onChange={(e) => setNewTeamData({ ...newTeamData, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold"
                  />
                  <p className="text-xs text-slate-400 mt-2">Minimum 4 characters</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddTeamModal(false);
                    setNewTeamData({ username: '', email: '', phoneNumber: '', password: '' });
                  }}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTeam}
                  className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition-all"
                >
                  Create Team
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
    </div>
  );
};

export default HQDashboard;