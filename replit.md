# Quick Video Merger - Electron Application

## Overview

Quick Video Merger is a desktop application built with Electron that allows users to merge video files and convert image sequences into videos using FFmpeg. The application provides a drag-and-drop interface for file management and real-time progress tracking during processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 (loaded via CDN)
- **Transpilation**: Babel Standalone for JSX compilation
- **Styling**: CSS with Windows 11-inspired design system
- **State Management**: React hooks (useState, useEffect)
- **UI Components**: Modular component-based architecture

### Backend Architecture
- **Runtime**: Electron main process with Node.js
- **Process Isolation**: Secure context with preload script
- **IPC Communication**: Bidirectional communication between renderer and main processes
- **Video Processing**: FFmpeg integration with fluent-ffmpeg wrapper

## Key Components

### Main Process (main.js)
- **Window Management**: Creates and manages the main application window
- **Security**: Implements context isolation and disables node integration
- **File Operations**: Handles file system operations and dialog interactions
- **Video Processing**: Manages FFmpeg operations for merging videos and converting images

### Renderer Process
- **App.js**: Main application component managing global state
- **FileDropZone.js**: Handles drag-and-drop file operations
- **FileList.js**: Displays and manages the list of selected files with reordering
- **Preview.js**: Provides file preview functionality for videos and images
- **ProcessingModal.js**: Shows progress during video processing operations

### Preload Script (preload.js)
- **API Bridge**: Exposes secure APIs to the renderer process
- **Event Handling**: Manages IPC communication and event listeners
- **Security Layer**: Provides controlled access to Node.js functionality

## Data Flow

1. **File Selection**: Users drag files or use file picker to select videos/images
2. **File Validation**: Client-side validation ensures only supported formats are accepted
3. **File Management**: Users can reorder files, preview content, and remove items
4. **Output Configuration**: Users select output directory and configure settings
5. **Processing**: Main process handles FFmpeg operations with progress updates
6. **Completion**: Success/error notifications and output file location

## External Dependencies

### Core Dependencies
- **Electron**: ^37.2.3 - Cross-platform desktop app framework
- **fluent-ffmpeg**: ^2.1.3 - Node.js wrapper for FFmpeg
- **ffmpeg-static**: ^5.2.0 - Static FFmpeg binaries
- **ffprobe-static**: ^3.1.0 - Static FFprobe binaries

### Frontend Libraries (CDN)
- **React**: 18 - UI framework
- **ReactDOM**: 18 - DOM rendering
- **Babel Standalone**: JSX transpilation
- **Font Awesome**: 6.0.0 - Icons

## Deployment Strategy

### Development
- **Entry Point**: main.js serves as the Electron main process
- **Development Mode**: `--dev` flag enables developer tools
- **File Structure**: Source files organized in `src/` directory with component separation

### Production Considerations
- **Packaging**: Requires Electron builder or similar for distribution
- **Security**: Context isolation and disabled node integration prevent security vulnerabilities
- **Performance**: FFmpeg operations run in main process to avoid blocking UI
- **Cross-platform**: Electron ensures compatibility across Windows, macOS, and Linux

### File Processing Architecture
- **Video Merging**: Concatenates video files without re-encoding for speed
- **Image Processing**: Converts image sequences to video with configurable duration
- **Progress Tracking**: Real-time progress updates via IPC events
- **Error Handling**: Comprehensive error reporting with user-friendly messages

The application follows Electron security best practices with process isolation while maintaining a responsive user interface through asynchronous processing and progress feedback.