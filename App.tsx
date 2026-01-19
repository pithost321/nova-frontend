/**
 * Nova Call Center Analytics - Main Application Component
 * 
 * A comprehensive call center analytics dashboard supporting multiple user roles:
 * - Agent: View personal performance metrics
 * - Team: Manage team, view team analytics, update agent rates
 * - NOVA (HQ): View organizational metrics across all teams
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { UserRole, Agent, Team, TimePeriod, Client } from './types';
import { dashboardAPI, authAPI, agentAPI, teamAPI, clientAPI } from './src/services/apiService';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import AgentDashboard from './components/AgentDashboard';
import TeamDashboard from './components/TeamDashboard';
import HQDashboard from './components/HQDashboard';
import AgentLeaderboard from './components/AgentLeaderboard';
import FormationList from './components/FormationList';
import { FormationDetail } from './components/FormationDetail';
import FormationManagement from './components/FormationManagement';
import FormationLearner from './components/FormationLearner';

/**
 * Data Status Component - Shows connection health and last update time
 */
const DataStatus: React.FC<{
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
  isHealthy: boolean;
}> = ({ lastUpdated, loading, error, isHealthy }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'} ${loading ? 'animate-pulse' : ''}`} />
      <div className="text-xs">
        {loading ? (
          <span className="text-slate-500">Updating...</span>
        ) : error ? (
          <span className="text-orange-600">{error}</span>
        ) : (
          <span className="text-slate-600">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Ready'}
          </span>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // ============================================================================
  // Authentication State
  // ============================================================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.AGENT);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // ============================================================================
  // Application State
  // ============================================================================
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.TODAY);
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard' | 'formations' | 'formation-detail' | 'formation-learner' | 'management'>('dashboard');
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(window.innerWidth >= 1024);

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);
  
  // Data state
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Agent selection
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const currentAgent = useMemo(
    () => agents.find(a => a.id === selectedAgentId) || agents[0] || null,
    [selectedAgentId, agents]
  );

  // Team selection
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const currentTeam = useMemo(
    () => teams.find(t => t.teamName === selectedTeamId) || teams[0] || null,
    [selectedTeamId, teams]
  );

  // ============================================================================
  // Session Restoration on Mount
  // ============================================================================
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedEmail = localStorage.getItem('userEmail');
        const storedRole = localStorage.getItem('userRole');
        const storedToken = localStorage.getItem('authToken');

        if (storedEmail && storedRole && storedToken) {
          // Restore session from storage
          setCurrentUserEmail(storedEmail);
          setCurrentRole(storedRole as UserRole);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        // Clear invalid session
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ============================================================================
  // Authentication Handlers
  // ============================================================================
  const handleLogin = async (username: string, password: string) => {
    setIsAuthLoading(true);
    try {
      const response = await authAPI.login(username, password);
      
      if (response.token) {
        setCurrentUserEmail(username);
        setCurrentRole(response.role as UserRole);
        setIsAuthenticated(true);
        // Clear navigation stack on login
        localStorage.removeItem('navigationStack');
      } else {
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials and try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      localStorage.removeItem('originalToken');
      localStorage.removeItem('originalRole');
      localStorage.removeItem('navigationStack');
      setCurrentUserEmail('');
      setCurrentRole(UserRole.AGENT);
      setIsAuthenticated(false);
    }
  };

  // ============================================================================
  // Return to Original Account Handler
  // ============================================================================
  const isImpersonated = localStorage.getItem('navigationStack') !== null;

  const handleReturnToOriginalAccount = () => {
    const navigationStackJson = localStorage.getItem('navigationStack');
    
    if (navigationStackJson) {
      try {
        let navigationStack = JSON.parse(navigationStackJson);
        
        if (navigationStack.length > 0) {
          // Get the last item in stack (the previous level to restore to)
          const previousLevel = navigationStack[navigationStack.length - 1];
          
          // Restore the previous level's credentials
          localStorage.setItem('authToken', previousLevel.token);
          localStorage.setItem('userRole', previousLevel.role);
          localStorage.setItem('username', previousLevel.username);
          
          // Remove the previous level from stack (pop it)
          navigationStack.pop();
          
          // Update the stack
          if (navigationStack.length > 0) {
            localStorage.setItem('navigationStack', JSON.stringify(navigationStack));
          } else {
            // Stack is now empty, clear the navigationStack entirely
            localStorage.removeItem('navigationStack');
          }
        } else {
          // Stack is empty, clear it
          localStorage.removeItem('navigationStack');
        }
        
        window.location.reload();
      } catch (error) {
        console.error('Error parsing navigation stack:', error);
        localStorage.removeItem('navigationStack');
        window.location.reload();
      }
    }
  };

  // ============================================================================
  // Data Fetching from Backend
  // ============================================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || isAuthLoading) return;

      try {
        setLoading(true);
        setError(null);
        setIsHealthy(true);

        try {
          // Fetch data based on user role
          if (currentRole === UserRole.AGENT) {
            // For AGENT role: use my-stats, top-5, and clients
            const [myStatsData, top5Data, clientsData] = await Promise.all([
              agentAPI.getMyStats(currentUserEmail),
              agentAPI.getTop5Agents(),
              clientAPI.getAllClients(),
            ]);
            
            console.log('My stats data:', myStatsData);
            console.log('Top 5 data:', top5Data);
            
            // Set agents data from my-stats and top-5
            // Handle both array and single object responses
            const myStats = Array.isArray(myStatsData) 
              ? myStatsData 
              : (myStatsData ? [myStatsData] : []);
            const top5 = Array.isArray(top5Data) 
              ? top5Data 
              : (top5Data ? [top5Data] : []);
            
            // Combine my-stats and top-5, removing duplicates
            // My stats take priority if there's a duplicate
            const top5Filtered = top5.filter((t5: any) => 
              !myStats.some((ms: any) => 
                (t5.vicidialId && ms.vicidialId === t5.vicidialId) ||
                (t5.agentName && ms.agentName === t5.agentName)
              )
            );
            
            const combinedAgents = [...myStats, ...top5Filtered];
            
            if (combinedAgents.length > 0) {
              const transformedAgents: Agent[] = combinedAgents.map((a: any, index: number) => {
                // Map backend AgentStatsDTO to Agent type
                const talkMinutes = Math.floor((a.talkTimeHours || 0) * 60);
                const waitMinutes = Math.floor((a.waitTimeHours || 0) * 60);
                return {
                  id_agent: a.vicidialId ?? a.id_agent ?? index,
                  ID: a.vicidialId ?? a.ID ?? index,
                  username: a.agentName ?? a.username ?? `Agent ${index}`,
                  calls: a.totalCalls ?? a.calls ?? 0,
                  costPerHour: a.costPerHour ?? 0,
                  campaign: a.campaign ?? '',
                  mostCurrentUserGroup: a.mostCurrentUserGroup ?? '',
                  most_recent_user_group: a.most_recent_user_group ?? '',
                  SALE: a.sale ?? 0,
                  callbk: a.callbk ?? 0,
                  N: a.n ?? a.N ?? 0,
                  NI: a.ni ?? a.NI ?? 0,
                  talk: talkMinutes.toString(),
                  wait: waitMinutes.toString(),
                  role: UserRole.AGENT,
                  team: undefined, // can be set if needed
                  // Frontend properties
                  id: (a.vicidialId ?? a.id_agent ?? index).toString(),
                  name: a.agentName ?? a.username ?? `Agent ${index}`,
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.agentName ?? a.username ?? 'Agent')}&background=random`,
                  email: a.agentName ?? a.username ?? 'agent@crm.com',
                  phone: 'N/A',
                  address: 'N/A',
                  hourlyRate: a.costPerHour ?? 0,
                  streakDays: Math.floor((a.sale ?? 0) / 3),
                  stats: {
                    [TimePeriod.TODAY]: {
                      calls: a.totalCalls ?? 0,
                      booked: a.sale ?? 0,
                      talkTimeMinutes: talkMinutes,
                      waitTimeMinutes: waitMinutes,
                      paidPauseHours: a.paidPauseHours ?? 0,
                      dispositions: {
                        booked: a.sale ?? 0,
                        callback: a.callbk ?? 0,
                        noAnswer: a.n ?? 0,
                        notInterested: a.ni ?? 0,
                      }
                    },
                    [TimePeriod.WEEK]: {
                      calls: (a.totalCalls ?? 0) * 5,
                      booked: (a.sale ?? 0) * 5,
                      talkTimeMinutes: talkMinutes * 5,
                      waitTimeMinutes: waitMinutes * 5,
                      paidPauseHours: (a.paidPauseHours ?? 0) * 5,
                      dispositions: {
                        booked: (a.sale ?? 0) * 5,
                        callback: (a.callbk ?? 0) * 5,
                        noAnswer: (a.n ?? 0) * 5,
                        notInterested: (a.ni ?? 0) * 5,
                      }
                    },
                    [TimePeriod.MONTH]: {
                      calls: (a.totalCalls ?? 0) * 20,
                      booked: (a.sale ?? 0) * 20,
                      talkTimeMinutes: talkMinutes * 20,
                      waitTimeMinutes: waitMinutes * 20,
                      paidPauseHours: (a.paidPauseHours ?? 0) * 20,
                      dispositions: {
                        booked: (a.sale ?? 0) * 20,
                        callback: (a.callbk ?? 0) * 20,
                        noAnswer: (a.n ?? 0) * 20,
                        notInterested: (a.ni ?? 0) * 20,
                      }
                    },
                  },
                };
              });
              
              setAgents(transformedAgents);
              
              // Select the current agent
              const myAgent = transformedAgents.find(a => a.email === currentUserEmail || a.name === currentUserEmail);
              if (myAgent) {
                setSelectedAgentId(myAgent.id);
              }
            }
            
            // Set clients data
            if (clientsData) {
              setClients(clientsData);
            }
          } else {
            // For TEAM role: fetch teams and agents, skip full view (403 error)
            // For NOVA role: fetch full view
            let clientsData;
            try {
              clientsData = await clientAPI.getAllClients();
            } catch (clientErr) {
              console.log('Client API not available');
              clientsData = null;
            }

            const teamsData = await teamAPI.getAllTeams();
            
            let agentsData = [];
            
            // Transform teams data to frontend format
            if (teamsData && Array.isArray(teamsData)) {
              // Map TeamStatsDTO[] to Team[]
              const transformedTeams: Team[] = teamsData.map((t: any, idx: number) => ({
                id: t.teamId ? Number(t.teamId) : idx,
                teamName: t.teamName || `Team ${idx}`,
                agentCount: t.activeAgents || 0,
                totalCalls: t.totalCalls || 0,
                totalSales: t.totalBooked || 0,
                totalNi: t.totalNi || 0,
                totalN: t.totalN || 0,
                totalCallbk: t.totalCallbk || 0,
                rank: t.rank || idx + 1,
                totalPaidTimeHours: t.totalPaidTimeHours || 0,
                totalCustomerTimeHours: t.totalCustomerTimeHours || 0,
                totalWaitTimeHours: t.totalWaitTimeHours || 0,
                totalEstimatedEarnings: t.totalEstimatedEarnings || 0,
                globalTalkTimePercentage: t.globalTalkTimePercentage || '',
                globalWaitTimePercentage: t.globalWaitTimePercentage || '',
                agentsList: t.agentsList || [],
                costPerHour: t.costPerHour || 0,
              }));
              setTeams(transformedTeams);
              // If user is a TEAM, select their own team record
              if (currentRole === UserRole.TEAM && currentUserEmail) {
                const myTeam = transformedTeams.find((t: any) => t.teamName === currentUserEmail);
                if (myTeam) {
                  setSelectedTeamId(myTeam.teamName);
                }
              } else if (transformedTeams.length > 0 && !selectedTeamId) {
                setSelectedTeamId(transformedTeams[0].teamName);
              }
            }

            // Transform clients data (from clientAPI or fallback to fullView)
            const clientsSource = clientsData;
            if (clientsSource && Array.isArray(clientsSource)) {
              const transformedClients: Client[] = clientsSource.map((c: any, idx: number) => ({
                id: typeof c.id === 'number' ? c.id : idx,
                nom_complet: c.nom_complet || c.nomComplet || '',
                email: c.email || '',
                telephone: c.telephone || '',
                adresse: c.adresse || '',
                code_postal: c.code_postal || '',
                commentaire: c.commentaire || '',
                date_visite: c.date_visite || c.dateVisite || '',
                date_creation: c.date_creation || c.dateCreation || '',
                nom_service: c.nom_service || '',
                statut_service: (c.statut_service || c.statutService || 'pending').toLowerCase(),
                recordingUrl: c.recordingUrl || '',
                agent: c.agent || undefined,
                // Optionals for legacy/compatibility
                nomComplet: c.nomComplet,
                statutService: c.statutService,
                name: c.name,
                phone: c.phone,
                status: c.status,
                scheduledDate: c.scheduledDate,
                address: c.address,
                notes: c.notes,
                dateVisite: c.dateVisite,
              }));
              setClients(transformedClients);
            }

            // Transform agents data to frontend format
            // No agentsData to map for TEAM/NOVA role; skip setAgents here.
          }
          
          setLastUpdated(new Date());
        } catch (backendErr) {
          console.warn('Backend fetch failed, using mock data:', backendErr);
          setError('Using demo data');
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Using demo data');
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-refresh every 2 minutes (120 seconds)
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAuthLoading]);

  // ============================================================================
  // Event Handlers
  // ============================================================================
  const handleUpdateAgent = (agentId: string, updates: Partial<Agent>) => {
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId ? { ...agent, ...updates } : agent
      )
    );
  };

  const handleAddAgent = (newAgent: Omit<Agent, 'id'>) => {
    const id = `agent_${Date.now()}`;
    setAgents(prevAgents => [...prevAgents, { ...newAgent, id } as Agent]);
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================
  const renderDashboard = () => {
    // Show formation management for NOVA users
    if (currentView === 'management') {
      return currentRole === UserRole.NOVA ? (
        <FormationManagement userRole={currentRole} />
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <h2>Access Denied</h2>
          <p>Only NOVA administrators can access formation management.</p>
        </div>
      );
    }

    // Show formations when formations view is selected
    if (currentView === 'formations') {
      return (
        <FormationList 
          onFormationClick={(formation) => {
            setSelectedFormationId(formation.id || null);
            setCurrentView('formation-detail');
          }}
        />
      );
    }

    // Show formation learner when formation-learner view is selected
    if (currentView === 'formation-learner' && selectedFormationId) {
      return (
        <FormationLearner
          formationId={selectedFormationId}
          onClose={() => setCurrentView('formations')}
        />
      );
    }

    // Show formation details when formation-detail view is selected
    if (currentView === 'formation-detail' && selectedFormationId) {
      return (
        <FormationDetail
          formationId={selectedFormationId}
          onFormationEnrolled={() => {
            setCurrentView('formation-learner');
          }}
          onClose={() => setCurrentView('formations')}
        />
      );
    }

    // Show leaderboard when leaderboard view is selected
    if (currentView === 'leaderboard') {
      return <AgentLeaderboard />;
    }

    switch (currentRole) {
      case UserRole.AGENT:
        return (
          <AgentDashboard
            agent={currentAgent}
            period={timePeriod}
            agents={agents}
            clients={clients}
            onUpdateAgent={handleUpdateAgent}
          />
        );
      case UserRole.TEAM:
        return (
          <TeamDashboard
            team={currentTeam}
            agents={agents}
            period={timePeriod}
            teams={teams}
            onSelectAgent={(agentId) => {
              // Find the agent by ID
              const agent = agents.find(a => a.id?.toString() === agentId?.toString());
              if (agent) {
                // Switch to agent view as TEAM (impersonation mode)
                setSelectedAgentId(agentId);
                setCurrentRole(UserRole.AGENT);
                // Update current user email to agent's name for context
                setCurrentUserEmail(agent.name);
              }
            }}
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
          />
        );
      case UserRole.NOVA:
        return (
          <HQDashboard
            teams={teams}
            agents={agents}
            period={timePeriod}
          />
        );
      default:
        return null;
    }
  };

  // ============================================================================
  // Authentication Gate
  // ============================================================================
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} isLoading={isAuthLoading} />;
  }

  // ============================================================================
  // Loading Display
  // ============================================================================
  if (loading && agents.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-semibold">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentRole={currentRole}
          userEmail={currentUserEmail}
          onRoleChange={(role) => setCurrentRole(role)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Toggle sidebar"
              >
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo/Title */}
              <div>
                <h1 className="text-2xl font-black text-slate-900">NOVA CRM</h1>
                <p className="text-xs text-slate-500">Analytics Dashboard</p>
              </div>

              {/* Time Period Selector (only show for dashboard, not for formations or leaderboard) */}
              {currentView === 'dashboard' && (
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg shadow-inner border-l border-slate-200 pl-6">
                  {[TimePeriod.TODAY, TimePeriod.WEEK, TimePeriod.MONTH].map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md uppercase tracking-widest transition-all ${
                        timePeriod === period
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:bg-slate-200'
                      }`}
                      aria-pressed={timePeriod === period}
                    >
                      {period === TimePeriod.TODAY ? 'Today' : period === TimePeriod.WEEK ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
              )}

              {/* Data Status Indicator */}
              <div className="hidden md:block pl-4 border-l border-slate-200">
                <DataStatus
                  lastUpdated={lastUpdated}
                  loading={loading}
                  error={error}
                  isHealthy={isHealthy}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  Active Role
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {currentRole.replace('_', ' ')}
                </p>
                <p className="text-xs text-slate-500 mt-1">{currentUserEmail}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black shadow-sm ring-2 ring-blue-50 ring-offset-2">
                {currentRole[0]}
              </div>
              {isImpersonated && (
                <button
                  onClick={handleReturnToOriginalAccount}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all"
                  title="Return to My Account"
                >
                  Return
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              {renderDashboard()}
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
