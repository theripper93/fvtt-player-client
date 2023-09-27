// noinspection ES6MissingAwait,JSIgnoredPromiseFromCall

import {app, BrowserWindow, ipcMain, safeStorage,} from 'electron';
import path from 'path';
import fs from 'fs';

if (require('electron-squirrel-startup')) app.quit();

app.commandLine.appendSwitch("force_high_performance_gpu");
app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

/* Remove the comment (//) from the line below to ignore certificate errors (useful for self-signed certificates) */

//app.commandLine.appendSwitch("ignore-certificate-errors");

function getUserData(): UserData {
    try {
        const json = fs.readFileSync(path.join(app.getPath("userData"), "userData.json")).toString();
        return JSON.parse(json);
    } catch (e) {
        return {};
    }
}

{
    const userData = getUserData();
    if (userData.cachePath) {
        app.setPath("sessionData", userData.cachePath);
    }
}

const windows = new Set<BrowserWindow>();

/** Check if single instance, if not, simply quit new instance */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
    app.quit()
} else {
    app.on('second-instance', () => {
        createWindow();
    });
}


const windowsData = {} as WindowsData;

// let win: BrowserWindow;

function createWindow(): BrowserWindow {
    let window = new BrowserWindow({
        show: false, width: 800, height: 600, webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webgl: true
        },
    });

    // Fix Popouts
    window.webContents.setUserAgent(window.webContents.getUserAgent().replace("Electron", ""));
    window.webContents.on('did-start-loading', () => {
        window.setTitle(window.webContents.getTitle() + ' * Loading ....');
        window.setProgressBar(2, {mode: 'indeterminate'}) // second parameter optional
    });

    window.webContents.on('did-finish-load', () => {
        window.setTitle(window.webContents.getTitle());
        window.setProgressBar(-1);
    });
    window.webContents.on('did-stop-loading', () => {
        window.setTitle(window.webContents.getTitle());
        window.setProgressBar(-1);
    });
    window.webContents.setWindowOpenHandler(() => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                parent: window,
                autoHideMenuBar: true,
            }
        }
    });

    window.menuBarVisible = false;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    window.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            window.webContents.toggleDevTools();
            event.preventDefault();
        } else if (input.key === 'F5' && input.control) {
            window.webContents.reloadIgnoringCache()
            event.preventDefault();
        } else if (input.key === 'F5') {
            window.webContents.reload()
            event.preventDefault();
        }
    });
    window.webContents.on("did-finish-load", () => {
        const url = window.webContents.getURL();
        if (!url.endsWith("/join") && !url.endsWith("/auth") && !url.endsWith("/setup"))
            return;
        if (url.endsWith("/setup")) {
            window.webContents.executeJavaScript(`
                if ($('#server-button').length === 0) {
                    const serverSelectButton = $('<button type="button" data-action="returnServerSelect" id="server-button" data-tooltip="Return to Server Select"><i class="fas fa-server"></i></button>');
                    serverSelectButton.on('click', async () => {
                        window.location.href = await window.api.serverSelectPath();
                    });
                    setTimeout(() => {
                        $('nav#setup-menu').append(serverSelectButton)
                    }, 200);
                }
            `);
        }
        if (url.endsWith("/auth")) {
            window.webContents.executeJavaScript(`
                if ($('#server-button').length === 0) {
                    const serverSelectButton = $('<button type="button" class="bright" id="server-button"> <i class="fa-solid fa-server"></i>Return to Server Select</button>');
                    serverSelectButton.on('click', async () => {
                        window.location.href = await window.api.serverSelectPath();
                    });
                    setTimeout(() => {
                        $('.form-footer').append(serverSelectButton)
                    }, 200);
                }
            `);
        }
        if (url.endsWith("/join")) {
            window.webContents.executeJavaScript(`
                if ($('#server-button').length === 0) {
                    const serverSelectButton = $('<button type="button" class="bright" id="server-button"> <i class="fa-solid fa-server"></i>Return to Server Select</button>');
                    serverSelectButton.on('click', async () => {
                        window.location.href = await window.api.serverSelectPath();
                    });
                    setTimeout(() => {
                        $('.form-footer').append(serverSelectButton)
                    }, 200);
                }
            `);
        }
        if (!url.endsWith("/join") && !url.endsWith("/auth"))
            return;
        const userData = getLoginDetails(windowsData[window.webContents.id].gameId);
        if (!userData.user) return;
        window.webContents.executeJavaScript(`
            async function waitForLoad() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                while (!document.querySelector('select[name="userid"]') && !document.querySelector('input[name="adminPassword"]')) {
                    await wait(100);
                }
                console.log("logging in");
                login();
            }

            function login() {
                const adminPassword = document.querySelector('input[name="adminPassword"]');
                if (adminPassword)
                    adminPassword.value = "${userData.adminPassword}";
                const select = document.querySelector('select[name="userid"]');
                if (select)
                    select.querySelectorAll("option").forEach(opt => {
                        opt.selected = opt.innerText === "${userData.user}";
                    });
                const password = document.querySelector('input[name="password"]');
                if (password)
                    password.value = "${userData.password}";
                const fakeEvent = {
                    preventDefault: () => {
                    }, target: document.getElementById("join-game")
                }
                if (${windowsData[window.webContents.id].autoLogin}) {
                    ui.join._onSubmit(fakeEvent);
                } else {
                    document.querySelector(".form-footer button[name=join]").addEventListener("click", () => {
                        ui.join._onSubmit(fakeEvent);
                    });
                }
            }

            waitForLoad();

        `);
        windowsData[window.webContents.id].autoLogin = false;

    });

    window.once('ready-to-show', () => {
        window.maximize();
        window.show();
    });
    window.on('closed', () => {
        windows.delete(window);
        window = null;
    });
    windows.add(window);
    windowsData[window.webContents.id] = {autoLogin: true} as WindowData;
    return window;
}

app.whenReady().then(() => createWindow());
ipcMain.on("open-game", (e, gId) => windowsData[e.sender.id].gameId = gId);
ipcMain.on("clear-cache", async (event) => event.sender.session.clearCache());

ipcMain.on("save-user-data", (_e, data: SaveUserData) => {
    const {gameId, password, user, adminPassword} = data;
    saveUserData(gameId, {
        password: password.length !== 0 ? Array.from(safeStorage.encryptString(password)) : [],
        user,
        adminPassword: password.length !== 0 ? Array.from(safeStorage.encryptString(adminPassword)) : []
    });
});
ipcMain.handle("get-user-data", (_, gameId: GameId) => getLoginDetails(gameId))

ipcMain.handle("app-version", () => app.getVersion())

ipcMain.handle("select-path", (e) => {
    windowsData[e.sender.id].autoLogin = true;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        return MAIN_WINDOW_VITE_DEV_SERVER_URL;
    } else {
        return path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    }
});
ipcMain.handle("cache-path", () => app.getPath("sessionData"))
ipcMain.on("cache-path", (_, cachePath: string) => {
    const currentData = getUserData();
    currentData.cachePath = cachePath;
    fs.writeFileSync(path.join(app.getPath("userData"), "userData.json"), JSON.stringify(currentData));
});


app.on('activate', (_, hasVisibleWindows) => {
    if (!hasVisibleWindows) {
        createWindow();
    }
});

function getLoginDetails(gameId: GameId): GameUserDataDecrypted {
    const userData = getUserData()[gameId];
    if (!userData) return {user: "", password: "", adminPassword: ""};
    const password = new Uint8Array(userData.password);
    const adminPassword = new Uint8Array(userData.adminPassword);

    return {
        user: userData.user,
        password: password.length !== 0 ? (safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(password)) : "") : "",
        adminPassword: password.length !== 0 ? (safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(adminPassword)) : "") : "",
    };
}

function saveUserData(gameId: GameId, data: GameUserData) {
    const currentData = getUserData();
    if (currentData[gameId]) {
        if (data.user === "") data.user = currentData[gameId].user;
        if (data.password.length === 0) data.password = currentData[gameId].password;
        if (data.adminPassword.length === 0) data.adminPassword = currentData[gameId].adminPassword;
    }
    const newData: UserData = {...currentData, [gameId]: data};
    fs.writeFileSync(path.join(app.getPath("userData"), "userData.json"), JSON.stringify(newData));
}

