const { useState, useEffect } = React;

function LosslessCut({ selectedFile, outputPath, onProcessComplete, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timelineData, setTimelineData] = useState({ start: 0, end: 0, duration: 0 });
  const [segments, setSegments] = useState([]);
  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    // Listen for processing progress
    window.electronAPI.onProcessingProgress((progress) => {
      setProgress(Math.round(progress));
    });

    return () => {
      window.electronAPI.removeAllListeners('processing-progress');
    };
  }, []);

  const handleTimelineChange = (data) => {
    setTimelineData(data);
  };

  const addSegment = () => {
    if (timelineData.duration > 0) {
      const newSegment = {
        id: Date.now(),
        start: timelineData.start,
        end: timelineData.end,
        duration: timelineData.duration,
        name: `Segment ${segments.length + 1}`
      };
      setSegments([...segments, newSegment]);
    }
  };

  const removeSegment = (id) => {
    setSegments(segments.filter(seg => seg.id !== id));
  };

  const exportCurrentSegment = async () => {
    if (!selectedFile || !outputPath || timelineData.duration <= 0) {
      window.electronAPI.showError('Error', 'Please select a time range to export.');
      return;
    }

    await exportSegment(timelineData.start, timelineData.duration, 'current_segment');
  };

  const exportAllSegments = async () => {
    if (segments.length === 0) {
      window.electronAPI.showError('Error', 'No segments to export. Add some segments first.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const results = [];
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        setProgress((i / segments.length) * 100);
        
        const result = await window.electronAPI.trimVideo(
          selectedFile.path, 
          outputPath, 
          segment.start, 
          segment.duration
        );
        
        if (result.success) {
          results.push(result.outputFile);
        }
      }

      if (results.length > 0) {
        await window.electronAPI.showSuccess(
          'Export Complete', 
          `Exported ${results.length} segments successfully!`
        );
        if (onProcessComplete) onProcessComplete({ success: true, files: results });
      }
    } catch (error) {
      await window.electronAPI.showError('Error', `Failed to export segments: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const exportSegment = async (start, duration, name) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await window.electronAPI.trimVideo(
        selectedFile.path, 
        outputPath, 
        start, 
        duration
      );

      if (result.success) {
        await window.electronAPI.showSuccess(
          'Export Complete', 
          `Segment exported successfully!\nOutput: ${result.outputFile}`
        );
        if (onProcessComplete) onProcessComplete(result);
      }
    } catch (error) {
      await window.electronAPI.showError('Error', `Failed to export segment: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="losslesscut-modal">
      <div className="losslesscut-content">
        <div className="losslesscut-header">
          <h3><i className="fas fa-cut"></i> LosslessCut - {selectedFile?.name}</h3>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="losslesscut-body">
          <div className="timeline-section">
            <VideoTimeline 
              file={selectedFile}
              onTimelineChange={handleTimelineChange}
              startTime={0}
              endTime={0}
            />
          </div>

          <div className="controls-section">
            <div className="segment-controls">
              <div className="current-selection">
                <h4>Current Selection</h4>
                <div className="selection-info">
                  <span>Start: {formatTime(timelineData.start)}</span>
                  <span>End: {formatTime(timelineData.end)}</span>
                  <span>Duration: {formatTime(timelineData.duration)}</span>
                </div>
                <div className="selection-actions">
                  <button 
                    className="add-segment-btn"
                    onClick={addSegment}
                    disabled={timelineData.duration <= 0 || isProcessing}
                  >
                    <i className="fas fa-plus"></i> Add to Segments
                  </button>
                  <button 
                    className="export-current-btn"
                    onClick={exportCurrentSegment}
                    disabled={timelineData.duration <= 0 || isProcessing}
                  >
                    <i className="fas fa-download"></i> Export Current
                  </button>
                </div>
              </div>

              <div className="segments-list">
                <div className="segments-header">
                  <h4>Segments ({segments.length})</h4>
                  <button 
                    className="export-all-btn"
                    onClick={exportAllSegments}
                    disabled={segments.length === 0 || isProcessing}
                  >
                    <i className="fas fa-download"></i> Export All
                  </button>
                </div>
                
                <div className="segments-container">
                  {segments.length === 0 ? (
                    <div className="no-segments">
                      <i className="fas fa-list"></i>
                      <p>No segments added yet</p>
                      <small>Select time range and click "Add to Segments"</small>
                    </div>
                  ) : (
                    <div className="segments">
                      {segments.map((segment, index) => (
                        <div 
                          key={segment.id} 
                          className={`segment-item ${currentSegment === index ? 'active' : ''}`}
                          onClick={() => setCurrentSegment(index)}
                        >
                          <div className="segment-info">
                            <div className="segment-name">{segment.name}</div>
                            <div className="segment-time">
                              {formatTime(segment.start)} - {formatTime(segment.end)}
                            </div>
                            <div className="segment-duration">
                              Duration: {formatTime(segment.duration)}
                            </div>
                          </div>
                          <div className="segment-actions">
                            <button 
                              className="export-segment-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSegment(segment.start, segment.duration, segment.name);
                              }}
                              disabled={isProcessing}
                              title="Export this segment"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            <button 
                              className="remove-segment-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSegment(segment.id);
                              }}
                              disabled={isProcessing}
                              title="Remove segment"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="processing-overlay">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}% Complete</div>
              <div className="processing-message">
                <p>Cutting video segments...</p>
                <small>Using lossless cutting for maximum speed</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.LosslessCut = LosslessCut;