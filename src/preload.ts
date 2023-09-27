/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: no nodejs in preload
// eslint-disable-next-line @typescript-eslint/no-var-requires
import {contextBridge, ipcRenderer} from 'electron';

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector: string, text: string) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});


// type SendChannels = "toMain" | "open-game" | "save-user-data" | "app-version" | "cache-path" | "clear-cache";
// type ReceiveChannels = "fromMain" | "save-user-data" | "app-version" | "cache-path";
// type RequestChannels = "app-version" | "cache-path" | "get-user-data" | "select-path";
// type SendOnChannel = (channel: SendChannels, data?: number | string | SaveUserData) => void;
// type ReceiveOnChannel = ((channel: ReceiveChannels, func: (...args: unknown[]) => void) => void)
// type RequestOnChannel = ((channel: RequestChannels, ...args: unknown[]) => Promise<unknown>)

export type ContextBridgeApi = {
    // send: SendOnChannel;
    // receive: ReceiveOnChannel;
    // request: RequestOnChannel;
    userData: (gameId: string | number) => Promise<GameUserDataDecrypted>;
    appVersion: () => Promise<string>;
    cachePath: () => Promise<string>;
    setCachePath: (cachePath: string) => void;
    serverSelectPath: () => Promise<string>;
    saveUserData: (data: SaveUserData) => void;
    openGame: (id: number | string) => void;
    clearCache: () => void;
}
const exposedApi: ContextBridgeApi = {
    // request(channel: RequestChannels, ...args: unknown[]): Promise<unknown> {
    //     return ipcRenderer.invoke(channel, ...args);
    // },
    // receive(channel: ReceiveChannels, func: (...args: unknown[]) => void) {
    //     // Deliberately strip event as it includes `sender`
    //     ipcRenderer.on(channel, (event, ...args) => func(...args));
    // },
    // send(channel: SendChannels, data?: number | string | SaveUserData) {
    //     ipcRenderer.send(channel, data);
    // },
    userData(gameId: string | number) {
        return ipcRenderer.invoke("get-user-data", gameId) as Promise<GameUserDataDecrypted>;
    },
    appVersion() {
        return ipcRenderer.invoke("app-version") as Promise<string>;
    },
    cachePath() {
        return ipcRenderer.invoke("cache-path") as Promise<string>;
    },
    serverSelectPath() {
        return ipcRenderer.invoke("select-path") as Promise<string>;
    },
    saveUserData(data: SaveUserData) {
        ipcRenderer.send("save-user-data", data);
    },
    openGame(id: number | string) {
        ipcRenderer.send("open-game", id);
    },
    clearCache() {
        ipcRenderer.send("clear-cache");
    },
    setCachePath(cachePath: string) {
        ipcRenderer.send("cache-path", cachePath);
    },


}

contextBridge.exposeInMainWorld("api", exposedApi);