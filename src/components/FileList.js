const { useState } = React;

function FileList({ files, onFileRemove, onFileReorder, onPreview, onEdit }) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onFileReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const isVideo = filename.match(/\.(mp4|avi|mov|mkv|wmv)$/i);
    const isImage = filename.match(/\.(jpg|jpeg|png|gif|bmp)$/i);
    
    if (isVideo) return 'fas fa-video';
    if (isImage) return 'fas fa-image';
    return 'fas fa-file';
  };

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <i className="fas fa-list"></i>
        <p>No files added yet</p>
        <small>Add files using the drop zone</small>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3><i className="fas fa-list"></i> Files to Merge ({files.length})</h3>
        <small>Drag to reorder</small>
      </div>
      
      <div className="file-items">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className={`file-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="file-info">
              <div className="file-icon">
                <i className={getFileIcon(file.name)}></i>
              </div>
              <div className="file-details">
                <div className="file-name" title={file.name}>
                  {file.name}
                </div>
                <div className="file-meta">
                  <span className="file-index">#{index + 1}</span>
                  {file.size > 0 && (
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="file-actions">
              <button 
                className="preview-btn"
                onClick={() => onPreview(file)}
                title="Preview"
              >
                <i className="fas fa-eye"></i>
              </button>
              {getFileIcon(file.name).includes('video') && onEdit && (
                <button 
                  className="edit-btn"
                  onClick={() => onEdit(file)}
                  title="Edit Video"
                >
                  <i className="fas fa-edit"></i>
                </button>
              )}
              <button 
                className="remove-btn"
                onClick={() => onFileRemove(index)}
                title="Remove"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.FileList = FileList;
