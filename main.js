const { app, BrowserWindow, globalShortcut, ipcMain, safeStorage } = require("electron");
const path = require("path");
const fs = require("fs");

app.commandLine.appendSwitch("force_high_performance_gpu");
app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

/* Remove the comment (//) from the line below to ignore certificate errors (useful for self-signed certificates) */

//app.commandLine.appendSwitch("ignore-certificate-errors");

let win;

let gameId;

const createWindow = () => {
    win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });
    win.menuBarVisible = false;
    win.loadFile("index.html");
    win.maximize();
    win.show();
};

app.whenReady().then(() => {
    createWindow();
    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            win.webContents.toggleDevTools();
          event.preventDefault();
        } else  if (input.key === 'F5') {
            win.webContents.reload()
            event.preventDefault();
        } else  if (input.key === 'F5' && input.control) {
            win.webContents.reloadIgnoringCache()
            event.preventDefault();
        }
    });
    win.webContents.on("did-finish-load", () => {
        const userData = getLoginDetails(gameId);
        if(!userData.user) return;
            win.webContents.executeJavaScript(`

        async function waitForLoad(){
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            while(!document.querySelector('select[name="userid"]')){
                await wait(100);
            }
            login();
        }

        function login(){
            const select = document.querySelector('select[name="userid"]');
            select.querySelectorAll("option").forEach(opt => {
                opt.selected = opt.innerText === "${userData.user}";
            });
            document.querySelector('input[name="password"]').value = "${userData.password}";
            const fakeEvent = {preventDefault: ()=>{}, target: document.getElementById("join-game")}
            ui.join._onSubmit(fakeEvent);
        }

        waitForLoad();

        `);
    });

});

ipcMain.on("open-game", (e, gId) => {
    gameId = gId;
});

ipcMain.on("save-user-data", (e, data) => {
    const {gameId, password, user} = data;
    saveUserData(gameId, { password: Array.from(safeStorage.encryptString(password)), user });
});

function getUserData() {
    try {
        const json = fs.readFileSync(path.join(app.getPath("userData"), "userData.json"));
        return JSON.parse(json);
    } catch (e) {
        return {};
    }
}

function getLoginDetails(gameId) {
    const userData = getUserData()[gameId];
    if (!userData) return {user: "", password: ""};
    const password = new Uint8Array(userData.password);
    return {
        user: userData.user,
        password: safeStorage.decryptString(password),
    };
}

function saveUserData(gameId, data) {
    const currentData = getUserData();
    const newData = { ...currentData, [gameId]: data };
    fs.writeFileSync(path.join(app.getPath("userData"), "userData.json"), JSON.stringify(newData));
}
