import './style.css';

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

async function createGameItem(game: GameConfig) {
    const li = document.importNode(gameItemTemplate, true);
    li.querySelector("a").innerText = game.name;
    li.querySelector(".game-button").addEventListener("click", () => {
        window.api.send("open-game", game.id ?? game.name);
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
        window.api.send("save-user-data", {gameId, user, password, adminPassword});
    });
}
async function createGameList() {
    let config: AppConfig;
    try {
        config = await fetch("config.json").then((res) => res.json());
    } catch (e) {
        console.log("Failed to load config.json");
    }
    if (config.background) document.body.style.backgroundImage = `url(${config.background})`;
    if (config.textColor) document.documentElement.style.setProperty("--color-text-primary", config.textColor);
    if (config.backgroundColor) document.documentElement.style.setProperty("--color-background", config.backgroundColor);
    if (config.accentColor) document.documentElement.style.setProperty("--color-accent", config.accentColor);
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

createGameList();
