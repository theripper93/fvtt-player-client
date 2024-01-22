// noinspection JSIgnoredPromiseFromCall

import './style.css';

let appVersion: string;


function compareSemver(a: string, b: string): number {
    const splitA = a.split(".");
    const splitB = b.split(".");

    let currentA, currentB: number;
    for (let i = 0; i < splitA.length; i++) {
        currentA = Number(splitA[i]);
        currentB = Number(splitB[i]);
        if (currentA > currentB) {
            return 1;
        } else if (currentA < currentB) {
            return -1;
        }
    }
    return 0
}

document.querySelector("#add-game").addEventListener("click", () => {
    const gameUrlField = document.querySelector("#game-url") as HTMLInputElement;
    const gameNameField = document.querySelector("#game-name") as HTMLInputElement;
    const gameUrl = gameUrlField.value;
    const gameName = gameNameField.value;
    if (!gameUrl || !gameName) return alert("Please enter a game name and url");
    const gameList = window.localStorage.getItem("gameList") || "[]";
    const gameListJson: GameConfig[] = JSON.parse(gameList);
    const newGameItem = {name: gameName, url: gameUrl, id: Math.round(Math.random() * 1000000)} as GameConfig;
    gameListJson.push(newGameItem);
    window.localStorage.setItem("gameList", JSON.stringify(gameListJson));
    gameUrlField.value = "";
    gameNameField.value = "";
    createGameItem(newGameItem);
});


const gameItemList = document.querySelector("#game-list");
const gameItemTemplate = document.querySelector("template").content.querySelector("li");


document.querySelector("#save-app-config").addEventListener("click", (e) => {
    if (!(e.target instanceof Element))
        return;
    e.target.closest(".app-configuration").classList.add("hidden2");
    const closeUserConfig = e.target.closest(".app-configuration") as HTMLDivElement;
    const background = (closeUserConfig.querySelector("#background-image") as HTMLInputElement).value;
    const accentColor = (closeUserConfig.querySelector("#accent-color") as HTMLInputElement).value;
    const backgroundColor = (closeUserConfig.querySelector("#background-color") as HTMLInputElement).value;
    const textColor = (closeUserConfig.querySelector("#text-color") as HTMLInputElement).value;
    const cachePath = (closeUserConfig.querySelector("#cache-path") as HTMLInputElement).value;
    const autoCacheClear = (closeUserConfig.querySelector("#cache-path") as HTMLInputElement).checked;
    const config = {accentColor, backgroundColor, background, textColor, cachePath, autoCacheClear} as AppConfig;
    console.log(config);
    window.localStorage.setItem("appConfig", JSON.stringify(config));
    applyAppConfig(config);
});

document.querySelector("#clear-cache").addEventListener("click", () => {
    window.api.clearCache();
});

async function createGameItem(game: GameConfig) {
    const li = document.importNode(gameItemTemplate, true);
    const loginData = await window.api.userData(game.id ?? game.name) as GameUserDataDecrypted;

    li.id = game.cssId;

    (li.querySelector("#user-name") as HTMLInputElement).value = loginData.user;
    (li.querySelector("#user-password") as HTMLInputElement).value = loginData.password;
    (li.querySelector("#admin-password") as HTMLInputElement).value = loginData.adminPassword;
    li.querySelector("a").innerText = game.name;
    li.querySelector(".game-button").addEventListener("click", () => {
        window.api.openGame(game.id ?? game.name);
        window.location.href = game.url;
    });
    gameItemList.appendChild(li);
    const userConfiguration = li.querySelector("div.user-configuration") as HTMLDivElement;
    userConfiguration.style.height = `${userConfiguration.scrollHeight}px`;
    userConfiguration.querySelector("#delete-game")?.addEventListener("click", () => {
        const gameList = window.localStorage.getItem("gameList") || "[]";
        const gameListJson: GameConfig[] = JSON.parse(gameList);
        const newGameList = gameListJson.filter((g) => g.id !== game.id);
        window.localStorage.setItem("gameList", JSON.stringify(newGameList));
        createGameList();
    });
    const gameId = game.id ?? game.name;
    const saveButton = userConfiguration.querySelector("#save-user-data") as HTMLButtonElement;
    saveButton.addEventListener("click", (e) => {
        if (!(e.target instanceof Element))
            return;
        e.target.closest(".user-configuration").classList.add("hidden");
        const closeUserConfig = e.target.closest(".user-configuration") as HTMLDivElement;
        const user = (closeUserConfig.querySelector("#user-name") as HTMLInputElement).value;
        const password = (closeUserConfig.querySelector("#user-password") as HTMLInputElement).value;
        const adminPassword = (closeUserConfig.querySelector("#admin-password") as HTMLInputElement).value;
        console.log({gameId, user, password, adminPassword})
        window.api.saveUserData({gameId, user, password, adminPassword} as SaveUserData);
    });
}

function applyAppConfig(config: AppConfig) {
    (document.querySelector("#accent-color") as HTMLInputElement).value = "#f77f00";
    (document.querySelector("#background-color") as HTMLInputElement).value = "#003049";
    (document.querySelector("#text-color") as HTMLInputElement).value = "#eae2b7";
    if (config.background) {
        document.body.style.backgroundImage = `url(${config.background})`;
        (document.querySelector("#background-image") as HTMLInputElement).value = config.background;
    }
    if (config.backgrounds && config.backgrounds.length > 0) {
        const i = Math.floor(Math.random() * config.backgrounds.length);
        document.body.style.backgroundImage = `url(${config.backgrounds[i]})`;
    }
    if (config.textColor) {
        document.documentElement.style.setProperty("--color-text-primary", config.textColor);
        (document.querySelector("#text-color") as HTMLInputElement).value = config.textColor.substring(0, 7);
    }
    if (config.backgroundColor) {
        document.documentElement.style.setProperty("--color-background", config.backgroundColor);
        (document.querySelector("#background-color") as HTMLInputElement).value = config.backgroundColor.substring(0, 7);
    }
    if (config.accentColor) {
        document.documentElement.style.setProperty("--color-accent", config.accentColor);
        (document.querySelector("#accent-color") as HTMLInputElement).value = config.accentColor.substring(0, 7);
    }
    if (config.cachePath) {
        (document.querySelector("#cache-path") as HTMLInputElement).value = config.cachePath;
        window.api.setCachePath(config.cachePath);
    }
}


function addStyle(styleString: string) {
    const style = document.createElement('style');
    style.textContent = styleString;
    document.head.append(style);
}

async function createGameList() {
    let config: AppConfig;
    try {
        config = await window.api.appConfig();
    } catch (e) {
        console.log("Failed to load config.json");
    }
    config = {...config, ...(JSON.parse(window.localStorage.getItem("appConfig") || "{}") as AppConfig)};

    addStyle(config.customCSS ?? "");

    appVersion = await window.api.appVersion();
    document.querySelector("#current-version").textContent = appVersion;

    const latestVersion: string = (await (await fetch("https://api.github.com/repos/theripper93/fvtt-player-client/releases/latest", {mode: "cors"})).json())["tag_name"];
    document.querySelector("#latest-version").textContent = latestVersion;
    if (compareSemver(appVersion, latestVersion) < 0) {
        document.querySelector(".update-available").classList.remove("hidden2");
    }

    applyAppConfig(config);


    gameItemList.childNodes.forEach((value) => {
            if (value.nodeName === "template")
                return;
            value.remove();
        }
    );
    const gameList = window.localStorage.getItem("gameList") || "[]";
    let gameListJson: GameConfig[] = JSON.parse(gameList);
    gameListJson = [...config.games, ...gameListJson];
    gameListJson.forEach(createGameItem);
}

while (!window) {
    //
}
createGameList();
