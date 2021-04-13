const { app, BrowserWindow, ipcMain, Menu, Tray , globalShortcut} = require('electron');
const ejse = require('ejs-electron');
var iconpath = `${__dirname}/icon.ico`; // pa
const {shell} = require('electron') // deconstructing assignment


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}
ejse.data('theme', 'auto');
ejse.data('logs', global.logs);
ejse.data('config', global.config);
ejse.data('projects', [{name: "Project 1", img: "someimage", path: "/path/"}, {name: "Project 2", img: "someimage", path: "/path/"}, {name: "Project 3", img: "someimage", path: "/path/"}])

let isQuiting;
let appIcon;
let showState = true;
global.logs = [];
const createWindow = () => {
   
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    width: 800,
    height: 550,
    title: "Universal API Manager",
    darkTheme: true,
    icon: iconpath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  global.mainWindow.setMenuBarVisibility(false);
  // and load the index.html of the app.
  global.mainWindow.loadURL('file://' + __dirname + '/views/index.ejs');

  appIcon = new Tray(iconpath)

  let contextMenu = Menu.buildFromTemplate([
      {
          label: 'Show/Hide', click: function () {
            if (showState){
              global.mainWindow.hide()
            } else {
              global.mainWindow.show()
            }
            showState = !showState;
          }
      },
      {
          label: 'Shutdown', click: function () {
              isQuiting = true;
              global.mainWindow.destroy()
              app.quit()
          }
      },
      {
        label: 'Restart', click: function () {
          app.relaunch()
          app.exit()
        }
     }
  ])

  appIcon.setContextMenu(contextMenu)
  // Open the DevTools.
  global.mainWindow.webContents.openDevTools();

  
  global.mainWindow.on('close', function (event) {
    if (!isQuiting) {
      console.log(global.logs)
      event.preventDefault();
      global.mainWindow.hide();
      event.returnValue = false;
    }
  });

  global.mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
};

app.on('before-quit', function () {
  isQuiting = true;
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url === 'https://localhost/Status') {
    // Verification logic.
    console.log("preventing cert error")
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

ipcMain.on('message', (event, arg) => {
  console.log(arg) // prints "ping"
  tmp = arg;
})
ipcMain.on('OpenTemplatesFolder', (event, arg) => {
  shell.openPath(`${__dirname}\\..\\..\\..\\templates\\`) // Show the given file in a file manager. If possible, select the file.
})
ipcMain.on('RestartApp', (event, arg) => {
  app.relaunch()
  app.exit()
})
ipcMain.on('OpenLogsFolder', (event, arg) => {
  shell.openPath(`${__dirname}\\..\\..\\..\\logs\\`) // Show the given file in a file manager. If possible, select the file.
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
let https = require('./WebServer/app');
