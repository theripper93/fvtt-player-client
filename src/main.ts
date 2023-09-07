import {app, BrowserWindow, ipcMain, safeStorage} from 'electron';
import path from 'path';
import fs from 'fs';

if (require('electron-squirrel-startup')) app.quit();

app.commandLine.appendSwitch("force_high_performance_gpu");
app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

/* Remove the comment (//) from the line below to ignore certificate errors (useful for self-signed certificates) */

//app.commandLine.appendSwitch("ignore-certificate-errors");

let win: BrowserWindow;

let gameId: string;

const createWindow = () => {
    win = new BrowserWindow({
        show: false, width: 800, height: 600, webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    win.webContents.setWindowOpenHandler(() => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                autoHideMenuBar: true
            }
        }
    });
    win.menuBarVisible = false;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    win.maximize();
    win.show();

};


app.whenReady().then(() => {
    createWindow();
    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            win.webContents.toggleDevTools();
            event.preventDefault();
        } else if (input.key === 'F5' && input.control) {
            win.webContents.reloadIgnoringCache()
            event.preventDefault();
        } else if (input.key === 'F5') {
            win.webContents.reload()
            event.preventDefault();
        }
    });
    win.webContents.on("did-finish-load", () => {
        const userData = getLoginDetails(gameId);
        if (!userData.user) return;
        console.log("login", userData);
        win.webContents.executeJavaScript(`
            async function waitForLoad() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                while (!document.querySelector('select[name="userid"]') && !document.querySelector('input[name="adminPassword"]')) {
                    await wait(100);
                }
                login();
            }
            
            function login() {
                document.querySelector('input[name="adminPassword"]').value = "${userData.adminPassword}";
                const select = document.querySelector('select[name="userid"]');
                select.querySelectorAll("option").forEach(opt => {
                    opt.selected = opt.innerText === "${userData.user}";
                });
                document.querySelector('input[name="password"]').value = "${userData.password}";
                
                const fakeEvent = {
                    preventDefault: () => {
                    }, target: document.getElementById("join-game")
                }
                ui.join._onSubmit(fakeEvent);
            }
            
            waitForLoad();

        `);

        win.webContents.on("did-start-navigation", (e) => {
            if (e.isSameDocument) return;
            if (e.url.startsWith("about")) return;
            console.log("event", e);
            win.webContents.executeJavaScript(`
                // Fix Popouts
                Object.defineProperty(navigator, "userAgent", {value: navigator.userAgent.replace("Electron", "")})
                // Add back button
                Hooks.on('renderSettings', function (settings, html) {
                    if(html.find('#server-button').length > 0) return;
                    const serverSelectButton = $(\`<button id="server-button" data-action="home"><i class="fas fa-server"></i>Return to Server Select</button>\`);
                    serverSelectButton.on('click', () => {
                    window.api.send("return-select");
                    });
                    html.find('#settings-access').append(serverSelectButton);
                });
            `);

        })
    });

});

ipcMain.on("open-game", (_e, gId) => {
    gameId = gId;
});
ipcMain.on("return-select", () => {
    win.loadFile("index.html");
});

ipcMain.on("save-user-data", (_e, data) => {
    const {gameId, password, user, adminPassword} = data;
    console.log("numbers", Array.from(safeStorage.encryptString(password)));
    saveUserData(gameId, {password: Array.from(safeStorage.encryptString(password)), user, adminPassword: Array.from(safeStorage.encryptString(adminPassword))});
});

function getUserData(): UserData {
    try {
        const json = fs.readFileSync(path.join(app.getPath("userData"), "userData.json")).toString();
        return JSON.parse(json);
    } catch (e) {
        return {};
    }
}


function getLoginDetails(gameId: string): GameUserDataDecrypted {
    const userData = getUserData()[gameId];
    console.log("userData", userData, getUserData());
    if (!userData) return {user: "", password: "", adminPassword: ""};
    const password = new Uint8Array(userData.password);
    const adminPassword = new Uint8Array(userData.adminPassword);
    return {
        user: userData.user, password: safeStorage.decryptString(Buffer.from(password)), adminPassword: safeStorage.decryptString(Buffer.from(adminPassword)),
    };
}

function saveUserData(gameId: string, data: GameUserData) {
    const currentData = getUserData();
    const newData: UserData = {...currentData, [gameId]: data};
    console.log(newData);
    fs.writeFileSync(path.join(app.getPath("userData"), "userData.json"), JSON.stringify(newData));
}
