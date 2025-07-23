const { useState, useEffect } = React;

function App() {
  const [files, setFiles] = useState([]);
  const [outputPath, setOutputPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageDuration, setImageDuration] = useState(2);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  useEffect(() => {
    // Listen for progress updates
    window.electronAPI.onMergeProgress((progress) => {
      setProgress(Math.round(progress));
    });

    return () => {
      window.electronAPI.removeAllListeners('merge-progress');
    };
  }, []);

  const handleFilesAdded = (newFiles) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleFileRemove = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleFileReorder = (dragIndex, dropIndex) => {
    const newFiles = [...files];
    const draggedFile = newFiles[dragIndex];
    newFiles.splice(dragIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);
    setFiles(newFiles);
  };

  const selectOutputFolder = async () => {
    const result = await window.electronAPI.selectOutputFolder();
    if (!result.canceled && result.filePaths.length > 0) {
      setOutputPath(result.filePaths[0]);
    }
  };

  const isVideoFile = (filename) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const validateFiles = () => {
    if (files.length === 0) {
      window.electronAPI.showError('Error', 'Please add files to merge.');
      return false;
    }

    if (!outputPath) {
      window.electronAPI.showError('Error', 'Please select an output folder.');
      return false;
    }

    const hasVideos = files.some(file => isVideoFile(file.name));
    const hasImages = files.some(file => isImageFile(file.name));

    if (hasVideos && hasImages) {
      window.electronAPI.showError('Error', 'Cannot mix videos and images. Please use only one type of media.');
      return false;
    }

    return true;
  };

  const startMerging = async () => {
    if (!validateFiles()) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const filePaths = files.map(file => file.path);
      const hasVideos = files.some(file => isVideoFile(file.name));

      let result;
      if (hasVideos) {
        result = await window.electronAPI.mergeVideos(filePaths, outputPath);
      } else {
        result = await window.electronAPI.mergeImages(filePaths, outputPath, imageDuration);
      }

      if (result.success) {
        await window.electronAPI.showSuccess(
          'Success', 
          `Files merged successfully!\nOutput: ${result.outputFile}`
        );
        setFiles([]);
      }
    } catch (error) {
      await window.electronAPI.showError('Error', `Failed to merge files: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setPreviewFile(null);
    setEditingFile(null);
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
  };

  const handleProcessComplete = (result) => {
    // Could add processed file to the list or update UI as needed
    console.log('Process completed:', result);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1><i className="fas fa-video"></i> Quick Video Merger</h1>
        <p>Fast video and image merging for Windows 11</p>
      </header>

      <main className="app-main">
        <div className="content-grid">
          <div className="left-panel">
            <FileDropZone onFilesAdded={handleFilesAdded} />
            
            <div className="controls">
              <div className="output-section">
                <label>Output Folder:</label>
                <div className="output-path-container">
                  <input 
                    type="text" 
                    value={outputPath} 
                    readOnly 
                    placeholder="Select output folder..."
                    className="output-path-input"
                  />
                  <button onClick={selectOutputFolder} className="browse-btn">
                    <i className="fas fa-folder"></i> Browse
                  </button>
                </div>
              </div>

              {files.some(file => isImageFile(file.name)) && (
                <div className="image-settings">
                  <label>Image Duration (seconds):</label>
                  <input 
                    type="number" 
                    min="0.5" 
                    max="10" 
                    step="0.5" 
                    value={imageDuration}
                    onChange={(e) => setImageDuration(parseFloat(e.target.value))}
                    className="duration-input"
                  />
                </div>
              )}

              <div className="action-buttons">
                <button 
                  onClick={startMerging} 
                  disabled={files.length === 0 || !outputPath || isProcessing}
                  className="merge-btn"
                >
                  <i className="fas fa-play"></i> 
                  {isProcessing ? 'Processing...' : 'Start Merging'}
                </button>
                <button 
                  onClick={clearFiles} 
                  disabled={files.length === 0 || isProcessing}
                  className="clear-btn"
                >
                  <i className="fas fa-trash"></i> Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <FileList 
              files={files}
              onFileRemove={handleFileRemove}
              onFileReorder={handleFileReorder}
              onPreview={setPreviewFile}
              onEdit={handleEditFile}
            />
            
            {previewFile && (
              <Preview file={previewFile} onClose={() => setPreviewFile(null)} />
            )}
          </div>
        </div>
      </main>

      {isProcessing && (
        <ProcessingModal progress={progress} />
      )}

      {editingFile && (
        <VideoEditor
          selectedFile={editingFile}
          outputPath={outputPath}
          onProcessComplete={handleProcessComplete}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}

window.App = App;
