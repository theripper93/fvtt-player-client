const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("force_high_performance_gpu", "true");

const createWindow = () => {
    const win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        nodeIntegration: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    win.menuBarVisible = false;
    win.loadFile("index.html");
    win.maximize();
    win.show();
};

app.whenReady().then(() => {
    createWindow();
});
