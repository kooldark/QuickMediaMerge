const { useState, useEffect, useRef } = React;

function VideoTimeline({ file, onTimelineChange, startTime = 0, endTime = 0 }) {
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTrim, setStartTrim] = useState(startTime);
  const [endTrim, setEndTrim] = useState(endTime);
  const [isDragging, setIsDragging] = useState(null);

  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !file) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
      setEndTrim(video.duration);
      setCurrentTime(0);
      
      // Notify parent component
      if (onTimelineChange) {
        onTimelineChange({
          start: 0,
          end: video.duration,
          duration: video.duration
        });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [file]);

  useEffect(() => {
    // Update parent when trim points change
    if (onTimelineChange && videoDuration > 0) {
      const duration = endTrim - startTrim;
      onTimelineChange({
        start: startTrim,
        end: endTrim,
        duration: duration > 0 ? duration : 0
      });
    }
  }, [startTrim, endTrim, videoDuration, onTimelineChange]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time) => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) return;

    const clampedTime = Math.max(0, Math.min(time, videoDuration));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || videoDuration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * videoDuration;
    
    seekTo(time);
  };

  const handleMouseDown = (e, type) => {
    e.stopPropagation();
    setIsDragging(type);

    const handleMouseMove = (e) => {
      if (!timelineRef.current || videoDuration === 0) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const time = percentage * videoDuration;

      if (type === 'start') {
        setStartTrim(Math.min(time, endTrim - 0.1));
      } else if (type === 'end') {
        setEndTrim(Math.max(time, startTrim + 0.1));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const stepForward = () => {
    seekTo(currentTime + 1);
  };

  const stepBackward = () => {
    seekTo(currentTime - 1);
  };

  const jumpToStart = () => {
    seekTo(startTrim);
  };

  const jumpToEnd = () => {
    seekTo(endTrim);
  };

  if (!file) {
    return (
      <div className="timeline-empty">
        <i className="fas fa-video"></i>
        <p>No video selected</p>
        <small>Select a video file to use the timeline</small>
      </div>
    );
  }

  return (
    <div className="video-timeline">
      <div className="video-container">
        <video
          ref={videoRef}
          className="timeline-video"
          src={file.path ? `file://${file.path}` : URL.createObjectURL(file)}
          preload="metadata"
        />
        <div className="video-overlay">
          <button className="play-pause-btn" onClick={togglePlayPause}>
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
        </div>
      </div>

      <div className="timeline-controls">
        <div className="time-display">
          <span>Current: {formatTime(currentTime)}</span>
          <span>Duration: {formatTime(videoDuration)}</span>
        </div>

        <div 
          className="timeline-track"
          ref={timelineRef}
          onClick={handleTimelineClick}
        >
          <div className="timeline-background"></div>
          
          {/* Selection area */}
          <div 
            className="timeline-selection"
            style={{
              left: `${(startTrim / videoDuration) * 100}%`,
              width: `${((endTrim - startTrim) / videoDuration) * 100}%`
            }}
          />

          {/* Current time cursor */}
          <div 
            className="timeline-cursor"
            style={{ left: `${(currentTime / videoDuration) * 100}%` }}
          />

          {/* Trim handles */}
          <div 
            className={`trim-handle trim-start ${isDragging === 'start' ? 'dragging' : ''}`}
            style={{ left: `${(startTrim / videoDuration) * 100}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
          >
            <div className="trim-handle-line" />
          </div>

          <div 
            className={`trim-handle trim-end ${isDragging === 'end' ? 'dragging' : ''}`}
            style={{ left: `${(endTrim / videoDuration) * 100}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
          >
            <div className="trim-handle-line" />
          </div>
        </div>

        <div className="timeline-buttons">
          <div className="nav-buttons">
            <button onClick={stepBackward} title="Step Back 1s">
              <i className="fas fa-step-backward"></i>
            </button>
            <button onClick={jumpToStart} title="Jump to Start">
              <i className="fas fa-fast-backward"></i>
            </button>
            <button onClick={togglePlayPause} title={isPlaying ? "Pause" : "Play"}>
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button onClick={jumpToEnd} title="Jump to End">
              <i className="fas fa-fast-forward"></i>
            </button>
            <button onClick={stepForward} title="Step Forward 1s">
              <i className="fas fa-step-forward"></i>
            </button>
          </div>

          <div className="trim-info">
            <div className="trim-times">
              <span>Start: {formatTime(startTrim)}</span>
              <span>End: {formatTime(endTrim)}</span>
              <span>Selection: {formatTime(endTrim - startTrim)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.VideoTimeline = VideoTimeline;