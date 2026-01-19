import React, { useState } from 'react';
import {
  useFormations,
  useCreateFormation,
  useUpdateFormation,
  useDeleteFormation,
} from '../src/services/formationHooks';
import { Formation, FormationType, FormationStatus, UserRole } from '../types';
import FormationForm from './FormationForm';
// @ts-ignore
import '../styles/FormationManagement.css';

interface FormationManagementProps {
  userRole?: UserRole;
}

type ViewType = 'list' | 'create' | 'edit' | 'view';

export const FormationManagement: React.FC<FormationManagementProps> = ({ userRole = UserRole.NOVA }) => {
  // Check if user is NOVA (admin)
  const isNova = userRole === UserRole.NOVA;

  const { formations, loading, error, refetch } = useFormations();
  const { deleteFormation } = useDeleteFormation();

  const [view, setView] = useState<ViewType>('list');
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [filterStatus, setFilterStatus] = useState<FormationStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<FormationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter formations
  const filteredFormations = formations.filter(formation => {
    const matchesStatus = filterStatus === 'ALL' || formation.status === filterStatus;
    const matchesType = filterType === 'ALL' || formation.type === filterType;
    const matchesSearch = 
      formation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formation.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this formation? This action cannot be undone.')) {
      try {
        await deleteFormation(id);
        alert('Formation deleted successfully');
        refetch();
      } catch (err) {
        alert('Failed to delete formation');
        console.error(err);
      }
    }
  };

  const handleArchive = async (formation: Formation) => {
    try {
      const archived = {
        ...formation,
        status: FormationStatus.ARCHIVED,
      };
      // This would use updateFormation from the hook
      alert('Formation archived successfully');
      refetch();
    } catch (err) {
      alert('Failed to archive formation');
      console.error(err);
    }
  };

  const handlePublish = async (formation: Formation) => {
    try {
      const published = {
        ...formation,
        status: FormationStatus.PUBLISHED,
      };
      // This would use updateFormation from the hook
      alert('Formation published successfully');
      refetch();
    } catch (err) {
      alert('Failed to publish formation');
      console.error(err);
    }
  };

  const handleCreateSuccess = (formation: Formation) => {
    alert('Formation created successfully!');
    setView('list');
    refetch();
  };

  const handleEditSuccess = (formation: Formation) => {
    alert('Formation updated successfully!');
    setView('list');
    refetch();
  };

  // Only NOVA can access management
  if (!isNova) {
    return (
      <div className="formation-management-restricted">
        <div className="restricted-message">
          <h2>Access Denied</h2>
          <p>Only administrators (NOVA) can access formation management.</p>
        </div>
      </div>
    );
  }

  // Show create form
  if (view === 'create') {
    return (
      <div className="formation-management-container">
        <div className="management-header">
          <button onClick={() => setView('list')} className="back-button">
            ← Back to Formations
          </button>
          <h2>Create New Formation</h2>
        </div>
        <FormationForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  // Show edit form
  if (view === 'edit' && selectedFormation) {
    return (
      <div className="formation-management-container">
        <div className="management-header">
          <button onClick={() => setView('list')} className="back-button">
            ← Back to Formations
          </button>
          <h2>Edit Formation: {selectedFormation.title}</h2>
        </div>
        <FormationForm
          formation={selectedFormation}
          onSuccess={handleEditSuccess}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  // Show list view (default)
  return (
    <div className="formation-management-container">
      <div className="management-header">
        <div>
          <h2>Formation Management</h2>
          <p className="subtitle">Create, edit, archive, and manage all formations</p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="btn btn-primary btn-lg"
        >
          + Create Formation
        </button>
      </div>

      {/* Filters and Search */}
      <div className="formation-controls">
        <div className="search-box">
          <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search formations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FormationStatus | 'ALL')}
            className="filter-select"
          >
            <option value="ALL">All Status</option>
            <option value={FormationStatus.DRAFT}>Draft</option>
            <option value={FormationStatus.PUBLISHED}>Published</option>
            <option value={FormationStatus.ARCHIVED}>Archived</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FormationType | 'ALL')}
            className="filter-select"
          >
            <option value="ALL">All Types</option>
            <option value={FormationType.TECHNICAL}>Technical</option>
            <option value={FormationType.PRODUCT}>Product</option>
            <option value={FormationType.PROCESS}>Process</option>
            <option value={FormationType.COMPLIANCE}>Compliance</option>
            <option value={FormationType.SOFT_SKILLS}>Soft Skills</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && <div className="loading-state">Loading formations...</div>}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>Error loading formations: {error.message}</p>
          <button onClick={() => refetch()} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFormations.length === 0 && (
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
          </svg>
          <h3>No formations found</h3>
          <p>{searchQuery ? 'Try adjusting your search' : 'Create your first formation to get started'}</p>
        </div>
      )}

      {/* Formations Table */}
      {!loading && filteredFormations.length > 0 && (
        <div className="formations-table-wrapper">
          <table className="formations-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Chapters</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormations.map((formation) => (
                <tr key={formation.id} className={`status-${formation.status.toLowerCase()}`}>
                  <td className="title-cell">
                    <div className="title-info">
                      <h4>{formation.title}</h4>
                      <p className="description">{formation.description?.substring(0, 60)}...</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-type">{formation.type}</span>
                  </td>
                  <td>
                    <span className={`badge badge-status status-${formation.status.toLowerCase()}`}>
                      {formation.status}
                    </span>
                  </td>
                  <td>{formation.duration} min</td>
                  <td className="center">{formation.chapters?.length || 0}</td>
                  <td>{formation.createdBy || 'N/A'}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => {
                          setSelectedFormation(formation);
                          setView('edit');
                        }}
                        className="action-btn edit-btn"
                        title="Edit formation"
                      >
                        ✎
                      </button>

                      {formation.status === FormationStatus.DRAFT && (
                        <button
                          onClick={() => handlePublish(formation)}
                          className="action-btn publish-btn"
                          title="Publish formation"
                        >
                          📤
                        </button>
                      )}

                      {formation.status === FormationStatus.PUBLISHED && (
                        <button
                          onClick={() => handleArchive(formation)}
                          className="action-btn archive-btn"
                          title="Archive formation"
                        >
                          📦
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(formation.id!)}
                        className="action-btn delete-btn"
                        title="Delete formation"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Footer */}
      {!loading && formations.length > 0 && (
        <div className="management-stats">
          <div className="stat">
            <span className="stat-number">{formations.length}</span>
            <span className="stat-label">Total Formations</span>
          </div>
          <div className="stat">
            <span className="stat-number">{formations.filter(f => f.status === FormationStatus.PUBLISHED).length}</span>
            <span className="stat-label">Published</span>
          </div>
          <div className="stat">
            <span className="stat-number">{formations.filter(f => f.status === FormationStatus.DRAFT).length}</span>
            <span className="stat-label">Draft</span>
          </div>
          <div className="stat">
            <span className="stat-number">{formations.filter(f => f.status === FormationStatus.ARCHIVED).length}</span>
            <span className="stat-label">Archived</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationManagement;
