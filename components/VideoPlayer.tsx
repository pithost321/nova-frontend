import React, { useState, useRef } from 'react';
// @ts-ignore
import '../styles/FormationLearner.css';

interface VideoPlayerProps {
  src: string;
  title: string;
  autoplay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, autoplay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-wrapper">
      <div className="video-player">
        <video
          ref={videoRef}
          src={src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          autoPlay={autoplay}
          crossOrigin="anonymous"
        />

        <div className="video-controls">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="progress-slider"
          />

          {/* Control Buttons */}
          <div className="controls-bar">
            <div className="controls-left">
              <button 
                className="control-btn play-btn"
                onClick={handlePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span className="separator">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="controls-right">
              <div className="volume-control">
                <span className="volume-icon">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  title="Volume"
                />
              </div>

              <button 
                className="control-btn fullscreen-btn"
                onClick={handleFullscreen}
                title="Fullscreen"
              >
                ⛶
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="video-info">
        <h3>{title}</h3>
        <div className="video-stats">
          <span className="stat-item">
            <span className="icon">⏱️</span>
            <span>{formatTime(duration)}</span>
          </span>
          <span className="stat-item">
            <span className="icon">▶️</span>
            <span>{isPlaying ? 'Playing' : 'Not playing'}</span>
          </span>
          <span className="stat-item">
            <span className="icon">🔊</span>
            <span>{Math.round(volume * 100)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
