/**
 * Client Database Page Component
 * 
 * Role-based client management:
 * - AGENT: Add clients and view their own clients
 * - TEAM: View all clients created by team members
 * - NOVA: View all clients, edit them, and import records
 */

import React, { useState, useEffect } from 'react';
import { Client, UserRole } from '../types';
import { clientAPI } from '../src/services/apiService';
import AddClientCard, { ClientFormData } from './AddClientCard';

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

interface ClientDatabaseProps {
  /** List of clients to display */
  clients: Client[];
  /** User's current role */
  userRole: UserRole;
  /** Current user's email/username */
  currentUserEmail: string;
  /** Current user's team name (required for TEAM role filtering) */
  currentUserTeam?: string;
  /** Callback when a new client is added */
  onAddClient: (clientData: ClientFormData) => void;
}

const ClientDatabase: React.FC<ClientDatabaseProps> = ({ clients, userRole, currentUserEmail, currentUserTeam, onAddClient }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState<'all' | 'commerciale' | 'residentiel'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'en_attente' | 'confirme' | 'annule' | 'non_interesse' | 'reporte'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isImportingRecordings, setIsImportingRecordings] = useState(false);
  
  // Edit modal state (for NOVA role)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<{ url: string; clientName: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Filter clients based on role
  const filteredClients = clients
    .filter(client => {
      // Filter by role
      if (userRole === UserRole.AGENT) {
        // Agents see only their own clients
        return (client.agent?.username || client.agent?.username) === currentUserEmail;
      } else if (userRole === UserRole.TEAM) {
        // Teams see clients created by team members in their team
        return (client.agent?.teamName || client.agent?.mostCurrentUserGroup) === currentUserTeam;
      } else {
        // NOVA sees all clients
        return true;
      }
    })
    .filter(client => {
      const matchesSearch = 
        (client.nom_complet?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (client.telephone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesService = 
        filterService === 'all' || 
        client.nom_service === filterService;
      
      const clientStatus = client.statut_service || (client as any).statutService;
      const matchesStatus = 
        filterStatus === 'all' || 
        clientStatus === filterStatus;
      
      const dateValue = client.date_creation || (client as any).dateCreation;
      const clientDate = dateValue ? new Date(dateValue).toISOString().split('T')[0] : null;
      const matchesDateRange = 
        (!fromDate || (clientDate && clientDate >= fromDate)) &&
        (!toDate || (clientDate && clientDate <= toDate));
      
      return matchesSearch && matchesService && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date_creation || 0).getTime();
        const dateB = new Date(b.date_creation || 0).getTime();
        return dateB - dateA; // Most recent first
      } else {
        return (a.nom_complet || '').localeCompare(b.nom_complet || '');
      }
    });

  const handleAddClient = (clientData: ClientFormData) => {
    onAddClient(clientData);
    setShowAddForm(false);
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
      statut_service: client.statut_service || (client as any).statutService,
      commentaire: client.commentaire,
    });
    setShowEditModal(true);
  };

  const handleSaveClient = async () => {
    if (!selectedClient) return;
    try {
      await clientAPI.updateClient(selectedClient.id, editFormData as any);
      showNotification('Client updated successfully', 'success');
      setShowEditModal(false);
      setSelectedClient(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating client:', error);
      showNotification('Failed to update client. Please try again.', 'error');
    }
  };

  const handleQuickStatusUpdate = async (client: Client, newStatus: string) => {
    try {
      await clientAPI.updateClient(client.id, { 
        ...client,
        statut_service: newStatus as any 
      });
      showNotification(`Status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating client status:', error);
      showNotification('Failed to update status. Please try again.', 'error');
    }
  };

  const handleDeleteClient = async (clientId: number | string | undefined, clientName: string) => {
    if (!clientId) return;
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      try {
        await clientAPI.deleteClient(clientId as number);
        showNotification('Client deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('Failed to delete client. Please try again.', 'error');
      }
    }
  };

  const getServiceBadgeColor = (service: string | undefined) => {
    switch (service) {
      case 'commerciale':
        return 'bg-blue-100 text-blue-800';
      case 'residentiel':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'actif':
        return 'bg-green-50 border-green-200';
      case 'inactif':
        return 'bg-gray-50 border-gray-200';
      case 'en_attente':
        return 'bg-amber-50 border-amber-200';
      case 'confirme':
        return 'bg-blue-50 border-blue-200';
      case 'prospect':
        return 'bg-blue-50 border-blue-200';
      case 'annule':
        return 'bg-red-50 border-red-200';
      case 'non_interesse':
        return 'bg-slate-50 border-slate-200';
      case 'reporte':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Client Database</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and view all client information</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {userRole === UserRole.AGENT && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>Add New Client</span>
            </button>
          )}
          {userRole === UserRole.NOVA && (
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
          )}
        </div>
      </div>

      {/* Add Client Form - AGENT only */}
      {userRole === UserRole.AGENT && showAddForm && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
          <div className="p-10">
            <AddClientCard 
              onAddClient={handleAddClient}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Service */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              Service Type
            </label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value as 'all' | 'commerciale' | 'residentiel')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="commerciale">Commerciale</option>
              <option value="residentiel">Residentiel</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'en_attente' | 'confirme' | 'annule' | 'non_interesse' | 'reporte')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="en_attente">En Attente</option>
              <option value="confirme">Confirmé</option>
              <option value="annule">Annulé</option>
              <option value="non_interesse">Non Intéressé</option>
              <option value="reporte">Reporté</option>
            </select>
          </div>

          {/* From Date */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* To Date */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Most Recent</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredClients.length}</span> of <span className="font-semibold text-slate-900">{clients.length}</span> clients
          </p>
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id || client.email}
              className={`rounded-xl border-2 p-6 transition-all hover:shadow-md ${getStatusColor(client.statut_service || (client as any).statutService)}`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                {/* Client Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{client.nom_complet}</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
                        {client.statut_service || (client as any).statutService ? (client.statut_service || (client as any).statutService).charAt(0).toUpperCase() + (client.statut_service || (client as any).statutService).slice(1) : 'No Status'}
                      </p>
                    </div>
                    {client.nom_service && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getServiceBadgeColor(client.nom_service)}`}>
                        {client.nom_service}
                      </span>
                    )}
                  </div>

                  {/* Quick Status Edit - NOVA only */}
                  {userRole === UserRole.NOVA && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleQuickStatusUpdate(client, 'en_attente')}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${
                          (client.statut_service || (client as any).statutService) === 'en_attente'
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        En Attente
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(client, 'confirme')}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${
                          (client.statut_service || (client as any).statutService) === 'confirme'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        Confirmé
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(client, 'annule')}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${
                          (client.statut_service || (client as any).statutService) === 'annule'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        Annulé
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(client, 'non_interesse')}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${
                          (client.statut_service || (client as any).statutService) === 'non_interesse'
                            ? 'bg-slate-500 text-white'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Non Intéressé
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(client, 'reporte')}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${
                          (client.statut_service || (client as any).statutService) === 'reporte'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        Reporté
                      </button>
                    </div>
                  )}

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {client.telephone && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-semibold">📞</span>
                        <span className="text-sm text-slate-700">{client.telephone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-semibold">📧</span>
                        <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:text-blue-800 truncate">
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.adresse && (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <span className="text-blue-600 font-semibold mt-0.5">📍</span>
                        <span className="text-sm text-slate-700">{client.adresse}
                          {client.code_postal && ` - ${client.code_postal}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {client.commentaire && (
                    <div className="pt-3 border-t border-slate-300/50">
                      <p className="text-xs text-slate-600 font-semibold mb-1 uppercase tracking-widest">Notes:</p>
                      <p className="text-sm text-slate-700">{client.commentaire}</p>
                    </div>
                  )}

                  {/* Recording Link */}
                  {client.recordingUrl && (
                    <div className="pt-3 border-t border-slate-300/50">
                      <button
                        onClick={() => {
                          setSelectedRecording({ url: client.recordingUrl!, clientName: client.nom_complet });
                          setShowAudioPlayer(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                      >
                        <span>🎧</span>
                        <span>Listen to Recording</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Dates and Actions */}
                <div className="flex flex-col items-end gap-2 text-xs text-slate-500 min-w-max">
                  {(client.agent.username || client.agent?.username) && (
                    <div className="text-right">
                      <p className="font-semibold uppercase tracking-widest">Agent</p>
                      <p className="text-slate-700">{client.agent.username || client.agent?.username}</p>
                    </div>
                  )}
                  {(client.date_creation || (client as any).dateCreation) && (
                    <div className="text-right">
                      <p className="font-semibold uppercase tracking-widest">Added</p>
                      <p className="text-slate-700">{new Date(client.date_creation || (client as any).dateCreation).toLocaleDateString()}</p>
                    </div>
                  )}
                  {client.date_visite && (
                    <div className="text-right">
                      <p className="font-semibold uppercase tracking-widest">Last Visit</p>
                      <p className="text-slate-700">{new Date(client.date_visite).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {/* Actions - NOVA only */}
                  {userRole === UserRole.NOVA && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-300/50 w-full">
                      <button
                        onClick={() => openEditModal(client)}
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded border border-blue-200 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id, client.nom_complet)}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded border border-red-200 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Clients Found</h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || filterService !== 'all'
              ? 'Try adjusting your search or filters'
              : userRole === UserRole.AGENT
              ? 'Start by adding your first client'
              : 'No clients available'}
          </p>
          {userRole === UserRole.AGENT && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Client
            </button>
          )}
        </div>
      )}

      {/* Edit Modal - NOVA only */}
      {userRole === UserRole.NOVA && showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Edit Client</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
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
                <input
                  type="text"
                  value={editFormData.nom_complet || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nom_complet: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="tel"
                  value={editFormData.telephone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                <input
                  type="text"
                  value={editFormData.adresse || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Postal Code</label>
                <input
                  type="text"
                  value={editFormData.code_postal || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, code_postal: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service Type</label>
                <select
                  value={editFormData.nom_service || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nom_service: e.target.value as any })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Service</option>
                  <option value="commerciale">Commerciale</option>
                  <option value="residentiel">Residentiel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <select
                  value={editFormData.statut_service || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, statut_service: e.target.value as any })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="en_attente">En Attente</option>
                  <option value="confirme">Confirmé</option>
                  <option value="annule">Annulé</option>
                  <option value="non_interesse">Non Intéressé</option>
                  <option value="reporte">Reporté</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visit Date</label>
                <input
                  type="date"
                  value={editFormData.date_visite || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, date_visite: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Comments</label>
                <textarea
                  value={editFormData.commentaire || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, commentaire: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-slate-100 flex gap-3">
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
                className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Player Modal */}
      {showAudioPlayer && selectedRecording && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-8 pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">🎧 Listen to Recording</h3>
              <button
                onClick={() => {
                  setShowAudioPlayer(false);
                  setSelectedRecording(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Client Name</p>
                <p className="text-lg font-bold text-slate-900">{selectedRecording.clientName}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🎵</span>
                  </div>
                </div>
                
                <audio
                  controls
                  className="w-full rounded-lg bg-white"
                  style={{ outline: 'none' }}
                >
                  <source src={selectedRecording.url} type="audio/mpeg" />
                  <p className="text-sm text-slate-600">Your browser does not support the audio element.</p>
                </audio>

                <p className="text-xs text-slate-600 text-center mt-6">
                  Use the controls above to play, pause, and adjust volume
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href={selectedRecording.url}
                  download
                  className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>⬇️</span>
                  <span>Download</span>
                </a>
                <button
                  onClick={() => {
                    setShowAudioPlayer(false);
                    setSelectedRecording(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all"
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
    </div>
  );
};

export default ClientDatabase;
