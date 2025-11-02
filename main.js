const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    kiosk: true, // Modo kiosko (pantalla completa, sin barra de tareas ni menús)
    autoHideMenuBar: true, // Oculta la barra de menú
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carga tu archivo principal (p.ej. index.html)
  win.loadFile('index.html');

  // Opcional: abre las herramientas de desarrollador (puedes quitarlo)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


