function ProcessingModal({ progress }) {
  return (
    <div className="processing-modal">
      <div className="processing-content">
        <div className="processing-header">
          <h3><i className="fas fa-cog fa-spin"></i> Processing Files</h3>
        </div>
        
        <div className="processing-body">
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {progress}% Complete
            </div>
          </div>
          
          <div className="processing-info">
            <p>Merging your files... Please wait.</p>
            <small>This process is optimized for speed without effects or filters.</small>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ProcessingModal = ProcessingModal;
