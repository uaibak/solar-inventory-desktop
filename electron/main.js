const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable GPU acceleration and set other flags to avoid cache issues
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--disable-software-rasterizer');

let mainWindow;

function createWindow() {
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
  mainWindow.loadURL('http://localhost:3000');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
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
});
