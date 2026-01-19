import React, { useState } from 'react';
import { useFormations, useEnrollFormation } from '../src/services/formationHooks';
import { Formation, FormationType, FormationStatus } from '../types';
// @ts-ignore
import '../styles/FormationList.css';

interface FormationListProps {
  onFormationClick?: (formation: Formation) => void;
  showActions?: boolean;
}

export const FormationList: React.FC<FormationListProps> = ({ onFormationClick, showActions = true }) => {
  const { formations, loading, error, refetch } = useFormations();
  const { enrollFormation, loading: enrolling } = useEnrollFormation();
  const [selectedFormationType, setSelectedFormationType] = useState<FormationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter formations based on type and search query
  const filteredFormations = formations.filter(formation => {
    const matchesType = selectedFormationType === 'ALL' || formation.type === selectedFormationType;
    const matchesSearch = 
      formation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formation.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleEnroll = async (formationId: string) => {
    try {
      await enrollFormation(formationId);
      alert('Successfully enrolled in formation!');
      refetch();
    } catch (err) {
      console.error('Failed to enroll:', err);
      alert('Failed to enroll in formation');
    }
  };

  const getStatusBadgeClass = (status: FormationStatus): string => {
    switch (status) {
      case FormationStatus.PUBLISHED:
        return 'status-published';
      case FormationStatus.DRAFT:
        return 'status-draft';
      case FormationStatus.ARCHIVED:
        return 'status-archived';
      default:
        return '';
    }
  };

  const getTypeColor = (type: FormationType): string => {
    switch (type) {
      case FormationType.TECHNICAL:
        return '#3498db';
      case FormationType.PRODUCT:
        return '#e74c3c';
      case FormationType.PROCESS:
        return '#f39c12';
      case FormationType.COMPLIANCE:
        return '#9b59b6';
      case FormationType.SOFT_SKILLS:
        return '#1abc9c';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return <div className="formation-list-loading">Loading formations...</div>;
  }

  if (error) {
    return <div className="formation-list-error">Error loading formations: {error.message}</div>;
  }

  return (
    <div className="formation-list-container">
      <div className="formation-list-header">
        <h2>Formations</h2>
      </div>

      {/* Filters */}
      <div className="formation-filters">
        <div className="filter-group">
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            placeholder="Search formations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={selectedFormationType}
            onChange={(e) => setSelectedFormationType(e.target.value as FormationType | 'ALL')}
            className="type-filter"
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

      {/* Formations List */}
      {filteredFormations.length === 0 ? (
        <div className="no-formations">
          {formations.length === 0 ? 'No formations available' : 'No formations match your search'}
        </div>
      ) : (
        <div className="formations-grid">
          {filteredFormations.map((formation) => (
            <div key={formation.id} className="formation-card">
              <div className="formation-card-header">
                <h3 className="formation-title">{formation.title}</h3>
                <span className={`status-badge ${getStatusBadgeClass(formation.status)}`}>
                  {formation.status}
                </span>
              </div>

              <div className="formation-type-badge" style={{ backgroundColor: getTypeColor(formation.type) }}>
                {formation.type}
              </div>

              <p className="formation-description">{formation.description}</p>

              <div className="formation-meta">
                <div className="meta-item">
                  <span className="label">Duration:</span>
                  <span className="value">{formation.duration} mins</span>
                </div>
                <div className="meta-item">
                  <span className="label">Instructor:</span>
                  <span className="value">{formation.instructor}</span>
                </div>
                {formation.chapters && formation.chapters.length > 0 && (
                  <div className="meta-item">
                    <span className="label">Chapters:</span>
                    <span className="value">{formation.chapters.length}</span>
                  </div>
                )}
              </div>

              {showActions && (
                <div className="formation-actions">
                  {onFormationClick && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => onFormationClick(formation)}
                    >
                      View Details
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEnroll(formation.id!)}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormationList;
