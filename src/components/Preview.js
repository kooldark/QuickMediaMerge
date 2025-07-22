function Preview({ file, onClose }) {
  const isVideo = file.name.match(/\.(mp4|avi|mov|mkv|wmv)$/i);
  const isImage = file.name.match(/\.(jpg|jpeg|png|gif|bmp)$/i);

  return (
    <div className="preview-modal">
      <div className="preview-content">
        <div className="preview-header">
          <h3><i className="fas fa-eye"></i> Preview: {file.name}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="preview-body">
          {isVideo && (
            <video 
              controls 
              className="preview-video"
              src={`file://${file.path}`}
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          {isImage && (
            <img 
              src={`file://${file.path}`} 
              alt={file.name}
              className="preview-image"
            />
          )}
          
          {!isVideo && !isImage && (
            <div className="preview-unsupported">
              <i className="fas fa-file"></i>
              <p>Preview not available for this file type</p>
            </div>
          )}
        </div>
        
        <div className="preview-footer">
          <div className="file-info">
            <span><strong>Name:</strong> {file.name}</span>
            <span><strong>Path:</strong> {file.path}</span>
            {file.size > 0 && (
              <span><strong>Size:</strong> {formatFileSize(file.size)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.Preview = Preview;
