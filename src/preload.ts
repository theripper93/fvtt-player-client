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


type SendChannels = "toMain" | "open-game" | "save-user-data" | "return-select" | "app-version" | "cache-path" | "clear-cache";
type ReceiveChannels = "fromMain" | "save-user-data" | "app-version" | "cache-path";
type RequestChannels = "app-version" | "cache-path" | "get-user-data";
type SendOnChannel = (channel: SendChannels, data?: number | string | SaveUserData) => void;
type ReceiveOnChannel = ((channel: ReceiveChannels, func: (...args: any[]) => void) => void)
type RequestOnChannel = ((channel: RequestChannels, ...args: any[]) => Promise<any>)

export type ContextBridgeApi = {
    send: SendOnChannel;
    receive: ReceiveOnChannel;
    request: RequestOnChannel;
}
const exposedApi: ContextBridgeApi = {
    request: (channel: RequestChannels, ...args: any[]): Promise<any>  => {
        if (channel === "get-user-data") {
            if (args.length !== 1 || typeof args[0] !== "string")
                throw new Error("Invalid arguments for get-user-data");
            return ipcRenderer.invoke(channel, args[0] as string) as Promise<GameUserDataDecrypted>;

        }
        if (channel === "app-version") {
            if (args.length != 0)
                throw new Error("No arguments allowed for app-version");
            return ipcRenderer.invoke(channel) as Promise<string>;

        }
        if (channel === "cache-path") {
            if (args.length != 0)
                throw new Error("No arguments allowed for cache-path");
            return ipcRenderer.invoke(channel) as Promise<string>;
        }
       return ipcRenderer.invoke(channel, ...args);
    },
    receive: (channel: ReceiveChannels, func: (...args: any[]) => void) => {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    send: (channel: SendChannels, data?: number | string | SaveUserData) => {
        if (channel === "save-user-data" && !(data as SaveUserData).user)
            throw new Error("Invalid Argument data");
        if (channel === "open-game" && !(typeof data === "number" || typeof data === "string"))
            throw new Error("Invalid Argument data");
        ipcRenderer.send(channel, data);
    }


}

contextBridge.exposeInMainWorld("api", exposedApi);