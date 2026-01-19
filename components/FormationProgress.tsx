import React from 'react';
import { Formation } from '../types';
// @ts-ignore
import '../styles/FormationLearner.css';

interface FormationProgressProps {
  formation: Formation;
  completedCount: number;
  currentChapterIndex: number;
}

export const FormationProgress: React.FC<FormationProgressProps> = ({
  formation,
  completedCount,
  currentChapterIndex
}) => {
  const totalChapters = formation.chapters.length;
  const completionPercentage = Math.round((completedCount / totalChapters) * 100);
  const estimatedTimeRemaining = formation.duration - (completedCount * Math.ceil(formation.duration / totalChapters));

  return (
    <div className="progress-card">
      <h3>Course Progress</h3>

      {/* Completion Circle */}
      <div className="progress-circle">
        <svg viewBox="0 0 200 200" className="circle-svg">
          <circle
            cx="100"
            cy="100"
            r="90"
            className="circle-bg"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            className="circle-progress"
            style={{
              strokeDasharray: `${(completionPercentage / 100) * 565.48} 565.48`
            }}
          />
        </svg>
        <div className="circle-text">
          <span className="percentage">{completionPercentage}%</span>
          <span className="label">Complete</span>
        </div>
      </div>

      {/* Stats */}
      <div className="progress-stats">
        <div className="stat-box">
          <span className="stat-number">{completedCount}</span>
          <span className="stat-label">Chapters Done</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{totalChapters - completedCount}</span>
          <span className="stat-label">Remaining</span>
        </div>
      </div>

      {/* Current Position */}
      <div className="progress-position">
        <h4>Current Position</h4>
        <div className="position-info">
          <span className="position-number">Chapter {currentChapterIndex + 1}</span>
          <span className="position-title">{formation.chapters[currentChapterIndex]?.title}</span>
        </div>
      </div>

      {/* Time Info */}
      <div className="progress-time">
        <div className="time-item">
          <span className="icon">⏱️</span>
          <div>
            <span className="label">Total Duration</span>
            <span className="value">{formation.duration} min</span>
          </div>
        </div>
        <div className="time-item">
          <span className="icon">⏳</span>
          <div>
            <span className="label">Estimated Remaining</span>
            <span className="value">{Math.max(0, estimatedTimeRemaining)} min</span>
          </div>
        </div>
      </div>

      {/* Achievement */}
      {completionPercentage === 100 && (
        <div className="achievement-badge">
          <span className="achievement-icon">🎉</span>
          <span className="achievement-text">Course Completed!</span>
        </div>
      )}

      {completionPercentage >= 50 && completionPercentage < 100 && (
        <div className="achievement-badge progress">
          <span className="achievement-icon">⭐</span>
          <span className="achievement-text">Great Progress!</span>
        </div>
      )}

      {completionPercentage > 0 && completionPercentage < 50 && (
        <div className="achievement-badge started">
          <span className="achievement-icon">🚀</span>
          <span className="achievement-text">You're on your way!</span>
        </div>
      )}

      {completionPercentage === 0 && (
        <div className="achievement-badge not-started">
          <span className="achievement-icon">📚</span>
          <span className="achievement-text">Let's get started!</span>
        </div>
      )}

      {/* Course Info */}
      <div className="course-info-box">
        <h4>Course Information</h4>
        <div className="info-items">
          <div className="info-row">
            <span className="label">Type</span>
            <span className="value">{formation.type}</span>
          </div>
          <div className="info-row">
            <span className="label">Status</span>
            <span className="value status">{formation.status}</span>
          </div>
          {formation.instructor && (
            <div className="info-row">
              <span className="label">Instructor</span>
              <span className="value">{formation.instructor}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormationProgress;
