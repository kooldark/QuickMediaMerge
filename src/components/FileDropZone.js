const { useState } = React;

function FileDropZone({ onFilesAdded }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const isVideo = file.name.match(/\.(mp4|avi|mov|mkv|wmv)$/i);
      const isImage = file.name.match(/\.(jpg|jpeg|png|gif|bmp)$/i);
      return isVideo || isImage;
    });

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }

    if (validFiles.length < droppedFiles.length) {
      window.electronAPI.showError(
        'Invalid Files', 
        'Some files were skipped. Only video and image files are supported.'
      );
    }
  };

  const handleFileSelect = async () => {
    const result = await window.electronAPI.selectFiles();
    if (!result.canceled && result.filePaths.length > 0) {
      const files = result.filePaths.map(filePath => ({
        name: filePath.split('\\').pop() || filePath.split('/').pop(),
        path: filePath,
        size: 0 // Will be populated later if needed
      }));
      onFilesAdded(files);
    }
  };

  return (
    <div 
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleFileSelect}
    >
      <div className="drop-zone-content">
        <i className="fas fa-cloud-upload-alt drop-icon"></i>
        <h3>Drop files here or click to browse</h3>
        <p>Supports: MP4, AVI, MOV, JPG, PNG, GIF</p>
        <button className="browse-files-btn">
          <i className="fas fa-folder-open"></i> Browse Files
        </button>
      </div>
    </div>
  );
}

window.FileDropZone = FileDropZone;
