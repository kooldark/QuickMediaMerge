// FFmpeg utility functions for the renderer process
// Note: Actual FFmpeg operations happen in the main process

class FFmpegUtils {
  static getSupportedFormats() {
    return {
      video: ['mp4', 'avi', 'mov', 'mkv', 'wmv'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'bmp']
    };
  }

  static isVideoFile(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    return this.getSupportedFormats().video.includes(ext);
  }

  static isImageFile(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    return this.getSupportedFormats().image.includes(ext);
  }

  static validateFileType(filename) {
    return this.isVideoFile(filename) || this.isImageFile(filename);
  }

  static getFileType(filename) {
    if (this.isVideoFile(filename)) return 'video';
    if (this.isImageFile(filename)) return 'image';
    return 'unknown';
  }

  static generateOutputFilename(files, type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = type === 'video' ? 'mp4' : 'mp4'; // Images are converted to video
    return `merged_${type}_${timestamp}.${extension}`;
  }

  static estimateProcessingTime(files) {
    // Simple estimation based on file count
    // In reality, this would depend on file sizes and system performance
    const baseTime = 5; // seconds
    const perFileTime = 2; // seconds per file
    return baseTime + (files.length * perFileTime);
  }

  static formatDuration(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
}

window.FFmpegUtils = FFmpegUtils;
