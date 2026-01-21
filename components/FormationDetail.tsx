import React, { useState, useEffect } from 'react';
import { useFormations } from '../src/services/formationHooks';
import { Formation } from '../types';
// @ts-ignore
import '../styles/FormationDetail.css';

interface FormationDetailProps {
  formationId: string;
  onFormationEnrolled?: () => void;
  onClose?: () => void;
}

export const FormationDetail: React.FC<FormationDetailProps> = ({
  formationId,
  onFormationEnrolled,
  onClose
}) => {
  const { formations, loading, error } = useFormations();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const selectedFormation = formations.find(f => f.id === formationId);
    setFormation(selectedFormation || null);
  }, [formations, formationId]);

  const handleEnroll = async () => {
    try {
      setIsEnrolling(true);
      // TODO: Call enrollment API
      console.log('Enrolling in formation:', formationId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onFormationEnrolled?.();
    } catch (err) {
      console.error('Enrollment failed:', err);
      alert('Failed to enroll in formation');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="formation-detail">
        <div className="formation-detail-header">
          <button className="back-button" onClick={onClose}>← Back</button>
        </div>
        <div className="loading">Loading formation details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="formation-detail">
        <div className="formation-detail-header">
          <button className="back-button" onClick={onClose}>← Back</button>
        </div>
        <div className="error">{error instanceof Error ? error.message : String(error)}</div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="formation-detail">
        <div className="formation-detail-header">
          <button className="back-button" onClick={onClose}>← Back</button>
        </div>
        <div className="not-found">Formation not found</div>
      </div>
    );
  }

  return (
    <div className="formation-detail">
      <div className="formation-detail-header">
        <button className="back-button" onClick={onClose}>← Back</button>
        <h1>{formation.title}</h1>
      </div>

      <div className="formation-detail-content">
        <div className="formation-info">
          <div className="formation-meta">
            <span className={`status-badge status-${formation.status.toLowerCase()}`}>
              {formation.status}
            </span>
            <span className="type-badge">{formation.type}</span>
            {formation.duration && (
              <span className="duration">{formation.duration} hours</span>
            )}
          </div>

          <p className="description">{formation.description}</p>

          {formation.chapters && formation.chapters.length > 0 && (
            <div className="chapters">
              <h3>Course Chapters</h3>
              <div className="chapters-list">
                {formation.chapters.map((chapter, idx) => (
                  <div key={chapter.id || idx} className="chapter-item">
                    <div className="chapter-number">{idx + 1}</div>
                    <div className="chapter-info">
                      <h4>{chapter.title}</h4>
                      {chapter.description && <p>{chapter.description}</p>}
                      <div className="chapter-meta">
                        <span className="content-type">{chapter.contentType}</span>
                        {chapter.duration && <span className="duration">{chapter.duration} min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="actions">
            <button
              className="enroll-button"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
            {onClose && (
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
