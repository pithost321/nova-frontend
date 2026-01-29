import React from 'react';
import { Chapter, ContentType } from '../types';
import { VideoPlayer } from './VideoPlayer';
// @ts-ignore
import '../styles/FormationLearner.css';

interface ChapterViewerProps {
  chapter: Chapter;
  isCompleted?: boolean;
}

export const ChapterViewer: React.FC<ChapterViewerProps> = ({ chapter, isCompleted = false }) => {
  return (
    <div className="chapter-viewer">
      {/* Video Content */}
      {chapter.contentType === ContentType.VIDEO && chapter.contentUrl && (
        <div className="content-block video-content">
          <VideoPlayer 
            src={chapter.contentUrl}
            title={chapter.title}
            autoplay={false}
          />
        </div>
      )}

      {/* Text Content */}
      {chapter.contentType === ContentType.TEXT && chapter.textContent && (
        <div className="content-block text-content">
          <div className="content-text">
            {chapter.textContent.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Image Content */}
      {chapter.contentType === ContentType.IMAGE && chapter.contentUrl && (
        <div className="content-block image-content">
          <figure>
            <img 
              src={chapter.contentUrl} 
              alt={chapter.title}
              className="chapter-image"
            />
            <figcaption>{chapter.title}</figcaption>
          </figure>
        </div>
      )}

      {/* Document Content */}
      {chapter.contentType === ContentType.DOCUMENT && chapter.contentUrl && (
        <div className="content-block document-content">
          <div className="document-preview">
            <div className="document-icon">📄</div>
            <div className="document-info">
              <h3>Course Document</h3>
              <p>Click below to download or view the document</p>
            </div>
            <a 
              href={chapter.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              📥 Download Document
            </a>
          </div>
        </div>
      )}

      {/* Duration */}
      {chapter.duration && (
        <div className="content-metadata">
          <span className="meta-item">
            <span className="icon">⏱️</span>
            <span>{chapter.duration} minutes estimated</span>
          </span>
        </div>
      )}

      {/* Resources */}
      {chapter.resources && chapter.resources.length > 0 && (
        <div className="content-block resources-content">
          <h3>📚 Additional Resources</h3>
          <div className="resources-list">
            {chapter.resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-item"
              >
                <span className="resource-icon">🔗</span>
                <span className="resource-text">{resource.split('/').pop() || 'Resource'}</span>
                <span className="open-icon">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterViewer;
