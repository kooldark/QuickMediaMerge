const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Quick Video Merger',
    show: false,
    frame: true,
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv'] },
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          duration: metadata.format.duration,
          format: metadata.format.format_name,
          size: metadata.format.size,
          width: metadata.streams[0]?.width,
          height: metadata.streams[0]?.height
        });
      }
    });
  });
});

ipcMain.handle('merge-videos', async (event, files, outputPath) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `merged_video_${Date.now()}.mp4`);
    
    // Create a text file with input files for FFmpeg concat
    const listFile = path.join(__dirname, 'temp_list.txt');
    const fileList = files.map(file => `file '${file.replace(/'/g, "\\'")}'`).join('\n');
    
    fs.writeFileSync(listFile, fileList);
    
    const command = ffmpeg()
      .input(listFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('merge-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      fs.unlinkSync(listFile); // Clean up temp file
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      if (fs.existsSync(listFile)) {
        fs.unlinkSync(listFile);
      }
      reject(err);
    });
    
    command.run();
  });
});

ipcMain.handle('merge-images', async (event, files, outputPath, duration = 2) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `merged_images_${Date.now()}.mp4`);
    
    const command = ffmpeg();
    
    // Add each image as input with duration
    files.forEach((file, index) => {
      command.input(file)
        .inputOptions(['-loop', '1', '-t', duration.toString()]);
    });
    
    // Create filter complex for concatenation
    const filterInputs = files.map((_, index) => `[${index}:v]`).join('');
    const filterComplex = `${filterInputs}concat=n=${files.length}:v=1:a=0[out]`;
    
    command
      .complexFilter(filterComplex)
      .outputOptions(['-map', '[out]', '-pix_fmt', 'yuv420p'])
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('merge-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.run();
  });
});

// Speed adjustment for videos
ipcMain.handle('change-video-speed', async (event, filePath, outputPath, speed) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `speed_${speed}x_${Date.now()}.mp4`);
    
    // Calculate audio and video filters
    const videoFilter = `setpts=${1/speed}*PTS`;
    const audioFilter = `atempo=${speed}`;
    
    const command = ffmpeg(filePath)
      .videoFilters(videoFilter)
      .audioFilters(audioFilter)
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('processing-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.run();
  });
});

// Trim video (cut start and end)
ipcMain.handle('trim-video', async (event, filePath, outputPath, startTime, duration) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `trimmed_${Date.now()}.mp4`);
    
    const command = ffmpeg(filePath)
      .seekInput(startTime)
      .duration(duration)
      .outputOptions(['-c', 'copy']) // Copy streams for faster processing
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('processing-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.run();
  });
});

// Extract audio from video
ipcMain.handle('extract-audio', async (event, filePath, outputPath, format = 'mp3') => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `audio_${Date.now()}.${format}`);
    
    const command = ffmpeg(filePath)
      .noVideo()
      .audioCodec(format === 'mp3' ? 'libmp3lame' : 'aac')
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('processing-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.run();
  });
});

// Compress video
ipcMain.handle('compress-video', async (event, filePath, outputPath, quality = 'medium') => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `compressed_${Date.now()}.mp4`);
    
    // Quality settings
    const qualitySettings = {
      low: { crf: 28, preset: 'fast' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' }
    };
    
    const settings = qualitySettings[quality] || qualitySettings.medium;
    
    const command = ffmpeg(filePath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        `-crf ${settings.crf}`,
        `-preset ${settings.preset}`,
        '-movflags +faststart'
      ])
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('processing-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.run();
  });
});

// Rotate video
ipcMain.handle('rotate-video', async (event, filePath, outputPath, rotation) => {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, `rotated_${rotation}_${Date.now()}.mp4`);
    
    // Rotation filters
    const rotationFilters = {
      90: 'transpose=1',
      180: 'transpose=2,transpose=2',
      270: 'transpose=2'
    };
    
    const filter = rotationFilters[rotation];
    if (!filter) {
      reject(new Error('Invalid rotation angle. Use 90, 180, or 270.'));
      return;
    }
    
    const command = ffmpeg(filePath)
      .videoFilters(filter)
      .audioCodec('copy')
      .output(outputFile);
    
    command.on('progress', (progress) => {
      mainWindow.webContents.send('processing-progress', progress.percent || 0);
    });
    
    command.on('end', () => {
      resolve({ success: true, outputFile });
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.run();
  });
});

ipcMain.handle('show-error', async (event, title, message) => {
  dialog.showErrorBox(title, message);
});

ipcMain.handle('show-success', async (event, title, message) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: title,
    message: message,
    buttons: ['OK']
  });
});
