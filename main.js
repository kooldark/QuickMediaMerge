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
