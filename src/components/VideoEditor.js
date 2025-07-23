const { useState } = React;

function VideoEditor({ selectedFile, outputPath, onProcessComplete, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('speed');
  
  // Speed settings
  const [speed, setSpeed] = useState(1);
  
  // Trim settings
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [duration, setDuration] = useState(10);
  
  // Audio settings
  const [audioFormat, setAudioFormat] = useState('mp3');
  
  // Compression settings
  const [quality, setQuality] = useState('medium');
  
  // Rotation settings
  const [rotation, setRotation] = useState(90);

  React.useEffect(() => {
    // Listen for processing progress
    window.electronAPI.onProcessingProgress((progress) => {
      setProgress(Math.round(progress));
    });

    return () => {
      window.electronAPI.removeAllListeners('processing-progress');
    };
  }, []);

  const handleProcess = async (operation) => {
    if (!selectedFile || !outputPath) {
      window.electronAPI.showError('Error', 'Please select a file and output folder first.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      let result;
      
      switch (operation) {
        case 'speed':
          result = await window.electronAPI.changeVideoSpeed(selectedFile.path, outputPath, speed);
          break;
        case 'trim':
          result = await window.electronAPI.trimVideo(selectedFile.path, outputPath, startTime, duration);
          break;
        case 'audio':
          result = await window.electronAPI.extractAudio(selectedFile.path, outputPath, audioFormat);
          break;
        case 'compress':
          result = await window.electronAPI.compressVideo(selectedFile.path, outputPath, quality);
          break;
        case 'rotate':
          result = await window.electronAPI.rotateVideo(selectedFile.path, outputPath, rotation);
          break;
        default:
          throw new Error('Unknown operation');
      }

      if (result.success) {
        await window.electronAPI.showSuccess(
          'Success', 
          `Video processed successfully!\nOutput: ${result.outputFile}`
        );
        if (onProcessComplete) onProcessComplete(result);
      }
    } catch (error) {
      await window.electronAPI.showError('Error', `Failed to process video: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const tabs = [
    { id: 'speed', name: 'Speed', icon: 'fas fa-tachometer-alt' },
    { id: 'trim', name: 'Trim', icon: 'fas fa-cut' },
    { id: 'audio', name: 'Audio', icon: 'fas fa-volume-up' },
    { id: 'compress', name: 'Compress', icon: 'fas fa-compress' },
    { id: 'rotate', name: 'Rotate', icon: 'fas fa-redo' }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-editor-modal">
      <div className="video-editor-content">
        <div className="video-editor-header">
          <h3><i className="fas fa-edit"></i> Video Editor - {selectedFile?.name}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="video-editor-body">
          <div className="editor-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                disabled={isProcessing}
              >
                <i className={tab.icon}></i>
                {tab.name}
              </button>
            ))}
          </div>

          <div className="editor-content">
            {activeTab === 'speed' && (
              <div className="editor-section">
                <h4>Change Video Speed</h4>
                <div className="control-group">
                  <label>Speed Multiplier: {speed}x</label>
                  <input
                    type="range"
                    min="0.25"
                    max="4"
                    step="0.25"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="speed-slider"
                  />
                  <div className="speed-presets">
                    {[0.5, 1, 1.5, 2, 3].map(preset => (
                      <button
                        key={preset}
                        className={`preset-btn ${speed === preset ? 'active' : ''}`}
                        onClick={() => setSpeed(preset)}
                      >
                        {preset}x
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="process-btn"
                  onClick={() => handleProcess('speed')}
                  disabled={isProcessing}
                >
                  <i className="fas fa-play"></i>
                  {isProcessing ? 'Processing...' : 'Change Speed'}
                </button>
              </div>
            )}

            {activeTab === 'trim' && (
              <div className="editor-section">
                <h4>Trim Video</h4>
                <div className="control-group">
                  <div className="time-controls">
                    <div className="time-input-group">
                      <label>Start Time (seconds):</label>
                      <input
                        type="number"
                        min="0"
                        value={startTime}
                        onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                        className="time-input"
                      />
                      <span className="time-display">{formatTime(startTime)}</span>
                    </div>
                    <div className="time-input-group">
                      <label>Duration (seconds):</label>
                      <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                        className="time-input"
                      />
                      <span className="time-display">{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="process-btn"
                  onClick={() => handleProcess('trim')}
                  disabled={isProcessing}
                >
                  <i className="fas fa-cut"></i>
                  {isProcessing ? 'Processing...' : 'Trim Video'}
                </button>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="editor-section">
                <h4>Extract Audio</h4>
                <div className="control-group">
                  <label>Audio Format:</label>
                  <select
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className="format-select"
                  >
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                    <option value="wav">WAV</option>
                  </select>
                </div>
                <button
                  className="process-btn"
                  onClick={() => handleProcess('audio')}
                  disabled={isProcessing}
                >
                  <i className="fas fa-volume-up"></i>
                  {isProcessing ? 'Processing...' : 'Extract Audio'}
                </button>
              </div>
            )}

            {activeTab === 'compress' && (
              <div className="editor-section">
                <h4>Compress Video</h4>
                <div className="control-group">
                  <label>Quality:</label>
                  <div className="quality-options">
                    {[
                      { value: 'low', label: 'Low (Smaller file)' },
                      { value: 'medium', label: 'Medium (Balanced)' },
                      { value: 'high', label: 'High (Better quality)' }
                    ].map(option => (
                      <label key={option.value} className="radio-option">
                        <input
                          type="radio"
                          name="quality"
                          value={option.value}
                          checked={quality === option.value}
                          onChange={(e) => setQuality(e.target.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  className="process-btn"
                  onClick={() => handleProcess('compress')}
                  disabled={isProcessing}
                >
                  <i className="fas fa-compress"></i>
                  {isProcessing ? 'Processing...' : 'Compress Video'}
                </button>
              </div>
            )}

            {activeTab === 'rotate' && (
              <div className="editor-section">
                <h4>Rotate Video</h4>
                <div className="control-group">
                  <label>Rotation:</label>
                  <div className="rotation-options">
                    {[
                      { value: 90, label: '90° Right', icon: 'fas fa-redo' },
                      { value: 180, label: '180° Flip', icon: 'fas fa-sync' },
                      { value: 270, label: '270° Left', icon: 'fas fa-undo' }
                    ].map(option => (
                      <button
                        key={option.value}
                        className={`rotation-btn ${rotation === option.value ? 'active' : ''}`}
                        onClick={() => setRotation(option.value)}
                      >
                        <i className={option.icon}></i>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="process-btn"
                  onClick={() => handleProcess('rotate')}
                  disabled={isProcessing}
                >
                  <i className="fas fa-redo"></i>
                  {isProcessing ? 'Processing...' : 'Rotate Video'}
                </button>
              </div>
            )}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.VideoEditor = VideoEditor;