const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable GPU acceleration and set other flags to avoid cache issues
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--disable-software-rasterizer');

let mainWindow;
let backendServer;

function startBackend() {
  if (backendServer) {
    return;
  }
  try {
    const backendPath = path.join(__dirname, '..', 'backend', 'server');
    const backend = require(backendPath);
    backendServer = backend?.server || backend;
    console.log('Backend server started');
  } catch (err) {
    console.error('Failed to start backend server:', err);
  }
}

function createWindow() {
  const isDev = !app.isPackaged;
  // Create the browser window with basic configuration
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    title: 'Solar Inventory Pro',
    show: false, // Don't show until ready
    backgroundColor: '#ffffff'
  });

  // Load the React app
  const appPath = app.getAppPath();
  const indexPath = app.isPackaged
    ? path.join(appPath, 'frontend', 'build', 'index.html')
    : path.join(__dirname, '..', 'frontend', 'build', 'index.html');
  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  const hasBuild = fs.existsSync(indexPath);

  if (app.isPackaged || process.env.ELECTRON_START_BACKEND === 'true') {
    startBackend();
  }

  if (app.isPackaged) {
    mainWindow.loadFile(indexPath);
  } else if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(devUrl);
  } else if (hasBuild) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL(devUrl);
  }

  const showLoadError = (details) => {
    const contextNote = app.isPackaged
      ? `The packaged build could not find ${indexPath}. Rebuild the app so frontend/build is included.`
      : `In development, ensure the React dev server is running on ${devUrl}.`;
    const html = `
      <html>
        <head><meta charset="utf-8" /><title>App Load Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
          <h2>App failed to load</h2>
          <p>${details || 'Unable to load the app content.'}</p>
          <p>${contextNote}</p>
        </body>
      </html>`;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  };

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('did-fail-load', { errorCode, errorDescription, validatedURL });
    if (!app.isPackaged && hasBuild) {
      mainWindow.loadFile(indexPath);
      return;
    }
    showLoadError(`${errorDescription} (code ${errorCode})`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('render-process-gone', details);
    showLoadError('Renderer crashed. Please restart the app.');
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev || process.env.ELECTRON_DEBUG === 'true') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('print-to-pdf', async (event, content) => {
  try {
    const html = content?.html || '';
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      defaultPath: content?.defaultFileName || 'invoice.pdf'
    });

    if (!result.canceled) {
      const pdfPath = result.filePath;
      const pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      await pdfWindow.loadURL(dataUrl);
      await new Promise((resolve) => {
        if (pdfWindow.webContents.isLoading()) {
          pdfWindow.webContents.once('did-finish-load', resolve);
        } else {
          resolve();
        }
      });
      await pdfWindow.webContents.executeJavaScript('document.fonts && document.fonts.ready');

      const pdfBuffer = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        marginsType: 0
      });

      const safePath = pdfPath.endsWith('.pdf') ? pdfPath : `${pdfPath}.pdf`;
      fs.writeFileSync(safePath, pdfBuffer);
      pdfWindow.close();

      return { success: true, path: safePath };
    }
    return { success: false };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app events
app.on('before-quit', () => {
  // Clean up any processes if needed
  if (backendServer && typeof backendServer.close === 'function') {
    backendServer.close();
  }
});
