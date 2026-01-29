import React, { useState, useEffect } from 'react';
import { agentAPI, clientAPI, novaAPI, teamAPI } from '../src/services/apiService';
import { Client } from '../types';

interface AgentDetail {
  vicidialId: number;
  agentName: string;
  totalCalls: number;
  talkTimeHours: number;
  waitTimeHours: number;
  pauseTimeHours: number;
  customerTimeHours: number;
  booked: number;
  sale: number;
  callbk: number;
  n: number;
  ni: number;
  rdv: number;
  [key: string]: any;
}

interface PerformanceMetric {
  date: string;
  jours: number;
  talkTime: string;
  waitTime: string;
  pause: string;
  disposition: string;
  total: string;
}

interface AgentDetailPageProps {
  agentId: number;
  agentName: string;
  onClose: () => void;
}

const AgentDetailPage: React.FC<AgentDetailPageProps> = ({ agentId, agentName, onClose }) => {
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null);
  const [appointments, setAppointments] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Pagination state for Appointment Management
  const [appointmentPage, setAppointmentPage] = useState(1);
  const appointmentsPerPage = 3;

  // Pagination state for Client Call Log
  const [callLogPage, setCallLogPage] = useState(1);
  const callLogsPerPage = 3;

  // Pagination state for Performance Metrics
  const [metricsPage, setMetricsPage] = useState(1);
  const metricsPerPage = 5;

  // Performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let agentStats: any = null;
        const userRole = localStorage.getItem('userRole');

        // Fetch agent stats based on user role
        if (userRole === 'NOVA') {
          // NOVA users: Fetch from nova stats and find the specific agent
          const novaStats = await novaAPI.getMyStats();
          
          // Search in top 3 agents
          if (novaStats.top3Agents) {
            agentStats = novaStats.top3Agents.find(
              (a: any) => a.vicidialId === agentId || a.agentName === agentName
            );
          }
          
          // If not found in top 3, search in all teams' agents
          if (!agentStats && novaStats.teamsList) {
            for (const team of novaStats.teamsList) {
              if (team.agentsList) {
                agentStats = team.agentsList.find(
                  (a: any) => a.vicidialId === agentId || a.agentName === agentName
                );
                if (agentStats) break;
              }
            }
          }
        } else if (userRole === 'TEAM') {
          // TEAM users: Fetch from team stats
          const teamStats = await teamAPI.getMyTeamStats();
          if (teamStats.agentsList) {
            agentStats = teamStats.agentsList.find(
              (a: any) => a.vicidialId === agentId || a.agentName === agentName
            );
          }
        } else if (userRole === 'AGENT') {
          // AGENT users: Fetch their own stats
          agentStats = await agentAPI.getMyStats();
        }

        // Set agent detail from fetched stats
        if (agentStats) {
          setAgentDetail({
            vicidialId: agentStats.vicidialId,
            agentName: agentStats.agentName,
            totalCalls: agentStats.totalCalls || 0,
            talkTimeHours: agentStats.talkTimeHours || 0,
            waitTimeHours: agentStats.waitTimeHours || 0,
            pauseTimeHours: 0,
            customerTimeHours: agentStats.customerTimeHours || 0,
            booked: agentStats.booked || 0,
            sale: agentStats.sale || 0,
            callbk: agentStats.callbk || 0,
            n: agentStats.n || 0,
            ni: agentStats.ni || 0,
            rdv: 0,
          });
        } else {
          throw new Error('Agent not found');
        }

        // Fetch all clients and filter by agent
        const allClients = await clientAPI.getAllClients();
        const agentClients = allClients.filter(
          (client: Client) =>
            client.agent?.username === agentName ||
            (client.agent?.username && client.agent.username === agentName)
        );
        setAppointments(agentClients);

        // Fetch performance metrics
        await fetchPerformanceMetrics();
      } catch (err) {
        console.error('Error fetching agent details:', err);
        setError('Failed to fetch agent details');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentId, agentName]);

  const fetchPerformanceMetrics = async () => {
    try {
      setMetricsLoading(true);
      
      // Use axios or fetch with correct token key
      const token = localStorage.getItem('authToken');
      
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      console.log('Token preview:', token?.substring(0, 20) + '...');
      
      if (!token) {
        console.warn('No authToken found in localStorage');
        setPerformanceMetrics([]);
        return;
      }

      const response = await fetch('https://novaadmin.ca/api/test/history/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API Response Status:', response.status);
      console.log('API Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Performance metrics received:', data);

      // Convert time string (HH:MM:SS) to hours with decimal
      const timeStringToHours = (timeStr: string): string => {
        if (!timeStr) return '0.00';
        const parts = timeStr.split(':');
        if (parts.length !== 3) return '0.00';
        try {
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          const seconds = parseInt(parts[2], 10) || 0;
          const totalHours = hours + minutes / 60 + seconds / 3600;
          return totalHours.toFixed(2);
        } catch {
          return '0.00';
        }
      };

      // Filter metrics for current agent and transform API response
      if (Array.isArray(data)) {
        console.log('Total records from API:', data.length);
        console.log('Looking for agentId:', agentId, 'agentName:', agentName);
        console.log('Sample record:', data[0]);
        
        const agentMetrics = data
          .filter((item: any) => {
            // Try multiple possible field name variations
            const matches = 
              item.vicidialId === agentId || 
              item.agentId === agentId ||
              item.username === agentName || 
              item.agentName === agentName ||
              item.agent_name === agentName ||
              (item.vicidialId && item.vicidialId.toString() === agentId.toString());
            return matches;
          })
          .map((item: any) => ({
            date: item.snapshotDate ? new Date(item.snapshotDate).toLocaleDateString('fr-CA') : new Date().toLocaleDateString('fr-CA'),
            jours: 1,
            talkTime: timeStringToHours(item.talk),
            waitTime: timeStringToHours(item.wait),
            pause: timeStringToHours(item.pause),
            disposition: timeStringToHours(item.dispo),
            total: timeStringToHours(item.time),
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setPerformanceMetrics(agentMetrics);
        console.log('Filtered agent metrics:', agentMetrics.length, 'records');
      }
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setPerformanceMetrics([]);
    } finally {
      setMetricsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'en_attente': 'bg-blue-50 text-blue-800 border-blue-200',
      'en_visite': 'bg-yellow-50 text-yellow-800 border-yellow-200',
      'rdv_pris': 'bg-green-50 text-green-800 border-green-200',
      'non_interesse': 'bg-red-50 text-red-800 border-red-200',
      'rappel': 'bg-purple-50 text-purple-800 border-purple-200',
    };
    return statusMap[status] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  const getStatusBg = (status: string) => {
    const bgColors: { [key: string]: string } = {
      'en_attente': 'bg-blue-50',
      'en_visite': 'bg-yellow-50',
      'rdv_pris': 'bg-green-50',
      'non_interesse': 'bg-red-50',
      'rappel': 'bg-purple-50',
    };
    return bgColors[status] || 'bg-gray-50';
  };

  const conversationRatio = agentDetail && agentDetail.talkTimeHours > 0
    ? `1 vente pour chaque ${(agentDetail.talkTimeHours / (agentDetail.booked || 1) * 60).toFixed(0)} minutes`
    : 'N/A';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!agentDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Agent not found'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const totalMetricDays = performanceMetrics.length;
  const totalMetricHours = performanceMetrics.reduce((sum, m) => sum + parseFloat(m.total), 0);
  const avgTalkTime = performanceMetrics.length > 0 ? performanceMetrics.reduce((sum, m) => sum + parseFloat(m.talkTime), 0) / totalMetricDays : 0;
  const avgWaitTime = performanceMetrics.length > 0 ? performanceMetrics.reduce((sum, m) => sum + parseFloat(m.waitTime), 0) / totalMetricDays : 0;
  const avgPause = performanceMetrics.length > 0 ? performanceMetrics.reduce((sum, m) => sum + parseFloat(m.pause), 0) / totalMetricDays : 0;
  const avgDisposition = performanceMetrics.length > 0 ? performanceMetrics.reduce((sum, m) => sum + parseFloat(m.disposition), 0) / totalMetricDays : 0;

  return (
    <div className="bg-gray-50 min-h-screen overflow-y-auto">
      <div className="w-full px-4 py-8 md:py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onClose}
              className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
            >
              ← Back to Leaderboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{agentDetail.agentName}</h1>
            <p className="text-gray-600 mt-2">Agent ID: {agentDetail.vicidialId}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Left Column: Appointments & Performance (75%) */}
            <div className="lg:col-span-3 space-y-4 md:space-y-6">
              {/* Appointments Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Appointment Management</h2>
                </div>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-800 text-white sticky top-0">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Date</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Client Name</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Phone</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden lg:table-cell">Address</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden xl:table-cell">Service</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appointments.slice((appointmentPage - 1) * appointmentsPerPage, appointmentPage * appointmentsPerPage).map((client: Client, idx: number) => (
                        <tr key={client.id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm text-gray-900">{client.date_visite || 'N/A'}</td>
                          <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{client.nom_complet || 'N/A'}</td>
                          <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{client.telephone || 'N/A'}</td>
                          <td className="px-3 md:px-6 py-3 text-sm text-gray-600 hidden lg:table-cell">{client.adresse || 'N/A'}</td>
                          <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">{client.nom_service || 'General'}</td>
                          <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(client.statut_service || '')}`}>
                              {(client.statut_service || 'pending').replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Total appointments: <span className="font-bold">{appointments.length}</span>
                  </div>
                  {/* Pagination Controls */}
                  {Math.ceil(appointments.length / appointmentsPerPage) > 1 && (
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setAppointmentPage(p => Math.max(1, p - 1))}
                        disabled={appointmentPage === 1}
                        className="px-3 py-1 text-sm font-semibold rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        ← Prev
                      </button>
                      <span className="text-sm font-semibold text-gray-700">
                        Page {appointmentPage} of {Math.ceil(appointments.length / appointmentsPerPage)}
                      </span>
                      <button
                        onClick={() => setAppointmentPage(p => Math.min(Math.ceil(appointments.length / appointmentsPerPage), p + 1))}
                        disabled={appointmentPage === Math.ceil(appointments.length / appointmentsPerPage)}
                        className="px-3 py-1 text-sm font-semibold rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
                </div>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-800 text-white sticky top-0">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Date</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Jours</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Talk Time</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden md:table-cell">Wait Time</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden lg:table-cell">Pause</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden xl:table-cell">Disposition</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {performanceMetrics.slice((metricsPage - 1) * metricsPerPage, metricsPage * metricsPerPage).map((metric, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{metric.date}</td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.jours}</td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{metric.talkTime}h</td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{metric.waitTime}h</td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">{metric.pause}h</td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">{metric.disposition}h</td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{metric.total}h</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={2} className="px-3 md:px-6 py-4 text-sm font-bold text-gray-900">
                          Total / Moyenne
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{avgTalkTime.toFixed(2)}h</td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 hidden md:table-cell">{avgWaitTime.toFixed(2)}h</td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 hidden lg:table-cell">{avgPause.toFixed(2)}h</td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 hidden xl:table-cell">{avgDisposition.toFixed(2)}h</td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{totalMetricDays > 0 ? (totalMetricHours / totalMetricDays).toFixed(2) : '0.00'}h</td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td colSpan={7} className="px-3 md:px-6 py-3 text-sm text-gray-600">
                          Total Jours Travaillé: <span className="font-bold">{totalMetricDays}</span> days
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Total working days: <span className="font-bold">{performanceMetrics.length}</span>
                  </div>
                  {/* Pagination Controls */}
                  {Math.ceil(performanceMetrics.length / metricsPerPage) > 1 && (
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setMetricsPage(p => Math.max(1, p - 1))}
                        disabled={metricsPage === 1}
                        className="px-3 py-1 text-sm font-semibold rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        ← Prev
                      </button>
                      <span className="text-sm font-semibold text-gray-700">
                        Page {metricsPage} of {Math.ceil(performanceMetrics.length / metricsPerPage)}
                      </span>
                      <button
                        onClick={() => setMetricsPage(p => Math.min(Math.ceil(performanceMetrics.length / metricsPerPage), p + 1))}
                        disabled={metricsPage === Math.ceil(performanceMetrics.length / metricsPerPage)}
                        className="px-3 py-1 text-sm font-semibold rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4 md:space-y-6">
            {/* Right Column: Quick Stats (25%) */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 md:mb-6">Quick Stats</h3>
              <div className="space-y-3 md:space-y-4">
                <div className="border-l-4 border-blue-600 pl-4 py-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Calls</p>
                  <p className="text-3xl font-black text-blue-600">{agentDetail?.totalCalls || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">calls made</p>
                </div>
                <div className="border-l-4 border-green-600 pl-4 py-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Appointments (RDV)</p>
                  <p className="text-3xl font-black text-green-600">{agentDetail?.booked || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">appointments booked</p>
                </div>
                
              </div>
            </div>

            {/* Conversion Rate Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-md p-4 md:p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">Conversion Metrics</h3>
              <div className="text-center py-4">
                <p className="text-sm text-indigo-700 font-semibold">1 sale for every</p>
                <p className="text-2xl font-black text-indigo-600 mt-2">
                  {agentDetail && agentDetail.talkTimeHours > 0 && agentDetail.booked > 0
                    ? `${(agentDetail.talkTimeHours / agentDetail.booked * 60).toFixed(0)} minutes`
                    : 'N/A'}
                </p>
                <p className="text-xs text-indigo-600 mt-2">of talk time</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Detailed Log & Recordings */}
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Client Call Log & Details</h2>
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-800 text-white sticky top-0">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Date & Time</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Client Name</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Phone</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden lg:table-cell">Address</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden xl:table-cell">Service</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold uppercase hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.length > 0 ? (
                  appointments.slice((callLogPage - 1) * callLogsPerPage, callLogPage * callLogsPerPage).map((client: Client, index: number) => (
                    <tr key={client.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-semibold">{client.date_visite || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{client.date_creation ? new Date(client.date_creation).toLocaleTimeString() : 'N/A'}</div>
                      </td>
                      <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{client.nom_complet || 'N/A'}</div>
                        <div className="text-xs text-gray-500 hidden md:block">{client.email || 'N/A'}</div>
                      </td>
                      <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                        <a href={`tel:${client.telephone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {client.telephone || 'N/A'}
                        </a>
                      </td>
                      <td className="px-3 md:px-6 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {client.adresse ? (
                          <div>
                            <div>{client.adresse}</div>
                            {client.code_postal && <div className="text-xs text-gray-500">{client.code_postal}</div>}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-3 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
                        {client.nom_service || 'General'}
                      </td>
                      <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            client.statut_service || ''
                          )}`}
                        >
                          {(client.statut_service || 'pending').replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 text-sm text-gray-600 max-w-xs truncate hidden lg:table-cell">
                        {client.commentaire || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 md:px-6 py-8 text-center text-gray-500">
                      <p className="text-sm">No client records found for this agent</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Total clients: <span className="font-bold">{appointments.length}</span>
            </div>
            {/* Pagination Controls */}
            {Math.ceil(appointments.length / callLogsPerPage) > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setCallLogPage(p => Math.max(1, p - 1))}
                  disabled={callLogPage === 1}
                  className="px-3 py-1 text-sm font-semibold rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  ← Prev
                </button>
                <span className="text-sm font-semibold text-gray-700">
                  Page {callLogPage} of {Math.ceil(appointments.length / callLogsPerPage)}
                </span>
                <button
                  onClick={() => setCallLogPage(p => Math.min(Math.ceil(appointments.length / callLogsPerPage), p + 1))}
                  disabled={callLogPage === Math.ceil(appointments.length / callLogsPerPage)}
                  className="px-3 py-1 text-sm font-semibold rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetailPage;
