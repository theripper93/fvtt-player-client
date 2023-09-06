const {app, BrowserWindow, globalShortcut, ipcMain, safeStorage} = require("electron");
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
        show: false, width: 800, height: 600, webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });
    win.webContents.setWindowOpenHandler((details) => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                autoHideMenuBar: true
            }
        }
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
        } else if (input.key === 'F5') {
            win.webContents.reload()
            event.preventDefault();
        } else if (input.key === 'F5' && input.control) {
            win.webContents.reloadIgnoringCache()
            event.preventDefault();
        }
    });
    win.webContents.on("did-finish-load", () => {
        const userData = getLoginDetails(gameId);
        if (!userData.user) return;
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

ipcMain.on("open-game", (e, gId) => {
    gameId = gId;
});
ipcMain.on("return-select", (e) => {
    win.loadFile("index.html");
});

ipcMain.on("save-user-data", (e, data) => {
    const {gameId, password, user, adminPassword} = data;
    saveUserData(gameId, {password: Array.from(safeStorage.encryptString(password)), user, adminPassword: Array.from(safeStorage.encryptString(adminPassword))});
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
    if (!userData) return {user: "", password: "", adminPassword: ""};
    const password = new Uint8Array(userData.password);7
    const adminPassword = new Uint8Array(userData.adminPassword);
    return {
        user: userData.user, password: safeStorage.decryptString(password), adminPassword: safeStorage.decryptString(adminPassword),
    };
}

function saveUserData(gameId, data) {
    console.log(data);
    const currentData = getUserData();
    const newData = {...currentData, [gameId]: data};
    console.log(newData);
    fs.writeFileSync(path.join(app.getPath("userData"), "userData.json"), JSON.stringify(newData));
}
