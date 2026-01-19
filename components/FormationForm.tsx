import React, { useState, useEffect } from 'react';
import { useCreateFormation, useUpdateFormation } from '../src/services/formationHooks';
import { Formation, FormationType, FormationStatus, Chapter } from '../types';
// @ts-ignore
import '../styles/FormationForm.css';

interface FormationFormProps {
  formation?: Formation;
  onSuccess?: (formation: Formation) => void;
  onCancel?: () => void;
}

export const FormationForm: React.FC<FormationFormProps> = ({ formation, onSuccess, onCancel }) => {
  const { createFormation, loading: creating } = useCreateFormation();
  const { updateFormation, loading: updating } = useUpdateFormation();

  const [formData, setFormData] = useState<Formation>({
    title: '',
    description: '',
    type: FormationType.TECHNICAL,
    duration: 60,
    instructor: null,
    chapters: [],
    targetTeams: [],
    targetAgents: [],
    status: FormationStatus.DRAFT,
    public: true,
  });

  const [newChapter, setNewChapter] = useState<Partial<Chapter>>({
    title: '',
    orderIndex: 0,
    contentType: 'TEXT',
    contentUrl: null,
    textContent: '',
  });

  const [teamInput, setTeamInput] = useState('');
  const [agentInput, setAgentInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (formation) {
      setFormData(formation);
    }
  }, [formation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) : value,
    }));
  };

  const handleAddChapter = () => {
    if (!newChapter.title) {
      alert('Chapter title is required');
      return;
    }

    const chapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: newChapter.title,
      orderIndex: formData.chapters.length,
      contentType: (newChapter.contentType as 'VIDEO' | 'TEXT' | 'IMAGE' | 'DOCUMENT') || 'TEXT',
      contentUrl: newChapter.contentUrl || null,
      textContent: newChapter.textContent || null,
      duration: newChapter.duration,
      videoUrl: newChapter.videoUrl,
      resources: newChapter.resources,
    };

    setFormData(prev => ({
      ...prev,
      chapters: [...prev.chapters, chapter],
    }));

    setNewChapter({ 
      title: '', 
      orderIndex: 0, 
      contentType: 'TEXT',
      contentUrl: null,
      textContent: '',
    });
  };

  const handleRemoveChapter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index),
    }));
  };

  const handleAddTeam = () => {
    if (teamInput.trim()) {
      setFormData(prev => ({
        ...prev,
        targetTeams: [...(prev.targetTeams || []), teamInput.trim()],
      }));
      setTeamInput('');
    }
  };

  const handleRemoveTeam = (index: number) => {
    setFormData(prev => ({
      ...prev,
      targetTeams: (prev.targetTeams || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddAgent = () => {
    if (agentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        targetAgents: [...(prev.targetAgents || []), agentInput.trim()],
      }));
      setAgentInput('');
    }
  };

  const handleRemoveAgent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      targetAgents: (prev.targetAgents || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formation?.id) {
        const updated = await updateFormation(formation.id, formData);
        onSuccess?.(updated);
      } else {
        const created = await createFormation(formData);
        onSuccess?.(created);
      }
    } catch (err) {
      console.error('Failed to save formation:', err);
      alert('Failed to save formation');
    }
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Note: In production, you'd upload to a server
    // For now, we'll create a local URL
    const videoUrl = URL.createObjectURL(file);
    setNewChapter(prev => ({ 
      ...prev, 
      videoUrl,
      contentType: 'VIDEO',
      contentUrl: videoUrl,
    }));
    alert(`Video "${file.name}" added (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Note: In production, you'd upload to a server
    const imageUrl = URL.createObjectURL(file);
    setNewChapter(prev => ({
      ...prev,
      contentType: 'IMAGE',
      contentUrl: imageUrl,
    }));
    alert(`Image "${file.name}" added`);
  };

  // Handle resource upload
  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newResources = Array.from(files).map(file => {
      return URL.createObjectURL(file);
    });

    setNewChapter(prev => ({
      ...prev,
      resources: [...(prev.resources || []), ...newResources]
    }));
  };

  const isLoading = creating || updating;

  return (
    <div className="formation-form-container">
      <h2 className="form-title">{formation ? 'Edit Formation' : 'Create Formation'}</h2>

      <form onSubmit={handleSubmit} className="formation-form">
        {/* Basic Information */}
        <fieldset>
          <legend>Basic Information</legend>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter formation title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Enter formation description"
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value={FormationType.TECHNICAL}>Technical</option>
                <option value={FormationType.PRODUCT}>Product</option>
                <option value={FormationType.PROCESS}>Process</option>
                <option value={FormationType.COMPLIANCE}>Compliance</option>
                <option value={FormationType.SOFT_SKILLS}>Soft Skills</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value={FormationStatus.DRAFT}>Draft</option>
                <option value={FormationStatus.PUBLISHED}>Published</option>
                <option value={FormationStatus.ARCHIVED}>Archived</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                id="duration"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instructor">Instructor</label>
              <input
                id="instructor"
                type="text"
                name="instructor"
                value={formData.instructor || ''}
                onChange={handleInputChange}
                placeholder="Enter instructor name (optional)"
              />
            </div>
          </div>
        </fieldset>

        {/* Chapters */}
        <fieldset>
          <legend>Chapters</legend>

          <div className="chapters-list">
            {formData.chapters.map((chapter, index) => (
              <div key={index} className="chapter-item">
                <div className="chapter-info">
                  <span className="chapter-number">Chapter {index + 1}</span>
                  <span className="chapter-title">{chapter.title}</span>
                  <span className="chapter-type">[{chapter.contentType}]</span>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveChapter(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="add-chapter-section">
            <h4>Add Chapter</h4>
            <div className="form-group">
              <label htmlFor="chapter-title">Title *</label>
              <input
                id="chapter-title"
                type="text"
                value={newChapter.title || ''}
                onChange={(e) => setNewChapter(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Chapter title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="chapter-content-type">Content Type *</label>
              <select
                id="chapter-content-type"
                value={newChapter.contentType || 'TEXT'}
                onChange={(e) => setNewChapter(prev => ({ ...prev, contentType: e.target.value as 'VIDEO' | 'TEXT' | 'IMAGE' | 'DOCUMENT' }))}
                required
              >
                <option value="TEXT">Text Content</option>
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
                <option value="DOCUMENT">Document</option>
              </select>
            </div>

            {newChapter.contentType === 'TEXT' && (
              <div className="form-group">
                <label htmlFor="chapter-text-content">Text Content</label>
                <textarea
                  id="chapter-text-content"
                  value={newChapter.textContent || ''}
                  onChange={(e) => setNewChapter(prev => ({ ...prev, textContent: e.target.value }))}
                  placeholder="Enter chapter text content"
                  rows={5}
                />
              </div>
            )}

            {(newChapter.contentType === 'VIDEO' || newChapter.contentType === 'IMAGE' || newChapter.contentType === 'DOCUMENT') && (
              <div className="form-group">
                <label htmlFor="chapter-content-url">Content URL</label>
                <input
                  id="chapter-content-url"
                  type="url"
                  value={newChapter.contentUrl || ''}
                  onChange={(e) => setNewChapter(prev => ({ ...prev, contentUrl: e.target.value }))}
                  placeholder="https://... or upload below"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="chapter-duration">Duration (minutes)</label>
                <input
                  id="chapter-duration"
                  type="number"
                  value={newChapter.duration || ''}
                  onChange={(e) => setNewChapter(prev => ({ ...prev, duration: parseInt(e.target.value, 10) }))}
                  min="1"
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="file-upload-section">
              <h5>Media Uploads</h5>
              
              {newChapter.contentType === 'VIDEO' && (
                <div className="upload-group">
                  <label htmlFor="video-upload" className="upload-label">
                    <span className="upload-icon">📹</span>
                    Upload Chapter Video
                  </label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="file-input"
                  />
                  <small>Supported: MP4, WebM, MOV (Max 500MB)</small>
                </div>
              )}

              {newChapter.contentType === 'IMAGE' && (
                <div className="upload-group">
                  <label htmlFor="image-upload" className="upload-label">
                    <span className="upload-icon">🖼️</span>
                    Upload Image
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <small>Supported: JPG, PNG, WebP (Max 10MB)</small>
                </div>
              )}

              {newChapter.contentType === 'DOCUMENT' && (
                <div className="upload-group">
                  <label htmlFor="resource-upload" className="upload-label">
                    <span className="upload-icon">📄</span>
                    Upload Document
                  </label>
                  <input
                    id="resource-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleResourceUpload}
                    className="file-input"
                  />
                  <small>Supported: PDF, Word, Excel, PowerPoint documents</small>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddChapter}
            >
              Add Chapter
            </button>
          </div>
        </fieldset>

        {/* Target Audience */}
        <fieldset>
          <legend>Target Audience</legend>

          <div className="form-group">
            <label htmlFor="teams">Target Teams</label>
            <div className="tag-input-group">
              <input
                id="teams"
                type="text"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                placeholder="Enter team name"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTeam())}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddTeam}>
                Add
              </button>
            </div>
            <div className="tags">
              {(formData.targetTeams || []).map((team, index) => (
                <div key={index} className="tag">
                  {team}
                  <button type="button" onClick={() => handleRemoveTeam(index)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="agents">Target Agents</label>
            <div className="tag-input-group">
              <input
                id="agents"
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder="Enter agent username"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAgent())}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAgent}>
                Add
              </button>
            </div>
            <div className="tags">
              {(formData.targetAgents || []).map((agent, index) => (
                <div key={index} className="tag">
                  {agent}
                  <button type="button" onClick={() => handleRemoveAgent(index)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Visibility */}
        <fieldset>
          <legend>Visibility</legend>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.public || false}
                onChange={(e) => setFormData(prev => ({ ...prev, public: e.target.checked }))}
              />
              Public (visible to all users)
            </label>
            <small>If unchecked, only target teams and agents can access this formation</small>
          </div>
        </fieldset>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : formation ? 'Update Formation' : 'Create Formation'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormationForm;
