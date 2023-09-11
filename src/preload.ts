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


type SendChannels = "toMain" | "open-game" | "save-user-data" | "return-select" | "app-version";
type ReceiveChannels = "fromMain" | "save-user-data" | "app-version";
export type ContextBridgeApi = {
    send: (channel: SendChannels, data?: number | string | SaveUserData) => void;
    receive: (channel: ReceiveChannels, func: (...args: any[]) => void) => void;
}
const exposedApi: ContextBridgeApi = {
    send: (channel: SendChannels, data?: number | string | SaveUserData) => {
        if (channel === "save-user-data" && !(data as SaveUserData).user)
            throw new Error("Invalid Argument data");
        if (channel === "open-game" && !(typeof data === "number" || typeof data === "string"))
            throw new Error("Invalid Argument data");
        ipcRenderer.send(channel, data);
    },
    receive: (channel: ReceiveChannels, func: (...args: any[]) => void) => {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
}

contextBridge.exposeInMainWorld("api", exposedApi);