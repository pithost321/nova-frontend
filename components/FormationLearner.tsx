import React, { useState, useEffect } from 'react';
import { Formation, Chapter, SessionStatus } from '../types';
import { useFormation, useEnrollFormation, useCompleteChapter } from '../src/services/formationHooks';
import { VideoPlayer } from './VideoPlayer';
import { ChapterViewer } from './ChapterViewer';
import { FormationProgress } from './FormationProgress';
// @ts-ignore
import '../styles/FormationLearner.css';

interface FormationLearnerProps {
  formationId: string;
  sessionId?: string;
  onClose?: () => void;
}

export const FormationLearner: React.FC<FormationLearnerProps> = ({ 
  formationId, 
  sessionId,
  onClose 
}) => {
  const { formation, loading: formationLoading, error: formationError } = useFormation(formationId);
  const { enrollFormation, loading: enrolling } = useEnrollFormation();
  const { completeChapter, loading: completing } = useCompleteChapter();

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(!!sessionId);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [currentNote, setCurrentNote] = useState('');

  const currentChapter = formation?.chapters[currentChapterIndex];
  const completionPercentage = formation ? Math.round((completedChapters.size / formation.chapters.length) * 100) : 0;

  const handleEnroll = async () => {
    try {
      await enrollFormation(formationId);
      setIsEnrolled(true);
    } catch (err) {
      alert('Failed to enroll in formation');
      console.error(err);
    }
  };

  const handleCompleteChapter = async () => {
    if (!currentChapter?.id || !sessionId) return;

    try {
      await completeChapter(sessionId, currentChapter.id);
      setCompletedChapters(prev => new Set([...prev, currentChapter.id!]));
    } catch (err) {
      console.error('Failed to complete chapter:', err);
    }
  };

  const handleNextChapter = () => {
    if (formation && currentChapterIndex < formation.chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const handlePreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  const handleSaveNote = () => {
    if (currentChapter?.id) {
      setNotes(prev => ({
        ...prev,
        [currentChapter.id!]: currentNote
      }));
    }
  };

  if (formationLoading) {
    return (
      <div className="learner-container loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading formation...</p>
        </div>
      </div>
    );
  }

  if (formationError || !formation) {
    return (
      <div className="learner-container error">
        <div className="error-card">
          <h2>⚠️ Error Loading Formation</h2>
          <p>{formationError?.message || 'Formation not found'}</p>
          {onClose && <button className="btn btn-primary" onClick={onClose}>Go Back</button>}
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="learner-container enrollment">
        <div className="enrollment-card">
          <div className="enrollment-header">
            <h1>{formation.title}</h1>
            {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
          </div>

          <div className="enrollment-content">
            <div className="enrollment-info">
              <p className="description">{formation.description}</p>

              <div className="info-grid">
                <div className="info-item">
                  <span className="icon">⏱️</span>
                  <div>
                    <span className="label">Duration</span>
                    <span className="value">{formation.duration} minutes</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="icon">📚</span>
                  <div>
                    <span className="label">Chapters</span>
                    <span className="value">{formation.chapters.length}</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="icon">🎓</span>
                  <div>
                    <span className="label">Type</span>
                    <span className="value">{formation.type}</span>
                  </div>
                </div>

                {formation.instructor && (
                  <div className="info-item">
                    <span className="icon">👨‍🏫</span>
                    <div>
                      <span className="label">Instructor</span>
                      <span className="value">{formation.instructor}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="chapters-preview">
                <h3>Course Content</h3>
                <ul className="chapters-list">
                  {formation.chapters.map((chapter, idx) => (
                    <li key={chapter.id || idx}>
                      <span className="chapter-num">{idx + 1}</span>
                      <span className="chapter-title">{chapter.title}</span>
                      <span className="chapter-type">{chapter.contentType}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="enrollment-action">
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
              {onClose && (
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Learning interface
  return (
    <div className="learner-container">
      {/* Header */}
      <div className="learner-header">
        <div className="header-left">
          {onClose && <button className="back-btn" onClick={onClose}>← Back</button>}
          <div>
            <h1 className="course-title">{formation.title}</h1>
            <p className="course-subtitle">{formation.description}</p>
          </div>
        </div>

        <div className="header-right">
          <button 
            className="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '➖' : '➕'}
          </button>
        </div>
      </div>

      <div className="learner-content">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="learner-sidebar">
            <div className="sidebar-header">
              <h3>Course Outline</h3>
              <span className="completion-badge">{completionPercentage}%</span>
            </div>

            <div className="progress-mini">
              <div className="progress-bar-mini">
                <div 
                  className="progress-fill-mini" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <nav className="chapters-nav">
              {formation.chapters.map((chapter, idx) => (
                <button
                  key={chapter.id || idx}
                  className={`chapter-nav-item ${idx === currentChapterIndex ? 'active' : ''} ${completedChapters.has(chapter.id!) ? 'completed' : ''}`}
                  onClick={() => setCurrentChapterIndex(idx)}
                >
                  <span className="nav-number">{idx + 1}</span>
                  <div className="nav-content">
                    <span className="nav-title">{chapter.title}</span>
                    <span className="nav-type">{chapter.contentType}</span>
                  </div>
                  {completedChapters.has(chapter.id!) && <span className="check-icon">✓</span>}
                </button>
              ))}
            </nav>

            <div className="sidebar-stats">
              <div className="stat">
                <span className="stat-value">{completedChapters.size}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formation.chapters.length - completedChapters.size}</span>
                <span className="stat-label">Remaining</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="learner-main">
          {currentChapter && (
            <>
              {/* Chapter Header */}
              <div className="chapter-header">
                <div>
                  <span className="chapter-number">Chapter {currentChapterIndex + 1}</span>
                  <h2 className="chapter-title">{currentChapter.title}</h2>
                </div>
                {completedChapters.has(currentChapter.id!) && (
                  <span className="completed-stamp">✓ Completed</span>
                )}
              </div>

              {/* Chapter Content */}
              <ChapterViewer 
                chapter={currentChapter}
                isCompleted={completedChapters.has(currentChapter.id!)}
              />

              {/* Notes Section */}
              <div className="notes-section">
                <h3>📝 My Notes</h3>
                <textarea
                  className="notes-input"
                  placeholder="Take notes here... (auto-saved)"
                  value={notes[currentChapter.id!] || currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onBlur={handleSaveNote}
                  rows={4}
                />
              </div>

              {/* Navigation */}
              <div className="chapter-navigation">
                <button
                  className="btn btn-secondary"
                  onClick={handlePreviousChapter}
                  disabled={currentChapterIndex === 0}
                >
                  ← Previous Chapter
                </button>

                {!completedChapters.has(currentChapter.id!) && (
                  <button
                    className="btn btn-success"
                    onClick={handleCompleteChapter}
                    disabled={completing}
                  >
                    {completing ? 'Marking...' : '✓ Mark as Complete'}
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={handleNextChapter}
                  disabled={currentChapterIndex === formation.chapters.length - 1}
                >
                  Next Chapter →
                </button>
              </div>
            </>
          )}
        </main>

        {/* Right Sidebar - Progress Card */}
        <aside className="learner-progress-sidebar">
          <FormationProgress 
            formation={formation}
            completedCount={completedChapters.size}
            currentChapterIndex={currentChapterIndex}
          />
        </aside>
      </div>
    </div>
  );
};

export default FormationLearner;
