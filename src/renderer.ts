import './style.css';
document.querySelector("#add-game").addEventListener("click", () => {
    const gameUrl = (document.querySelector("#game-url")  as HTMLInputElement).value;
    const gameName = (document.querySelector("#game-name")  as HTMLInputElement).value;
    if (!gameUrl || !gameName) return alert("Please enter a game name and url");
    const gameList = window.localStorage.getItem("gameList") || "[]";
    const gameListJson: GameConfig[] = JSON.parse(gameList);
    gameListJson.push({name: gameName, url: gameUrl, id: Math.round(Math.random() * 1000000)});
    window.localStorage.setItem("gameList", JSON.stringify(gameListJson));
    (document.querySelector("#game-url")  as HTMLInputElement).value = "";
    (document.querySelector("#game-name")  as HTMLInputElement).value = "";
    createGameList();
});

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
    const ul = document.querySelector("#game-list");
    ul.childNodes.forEach((value) => value.remove());
    ul.innerHTML = "";
    const gameList = window.localStorage.getItem("gameList") || "[]";
    let gameListJson: GameConfig[] = JSON.parse(gameList);
    console.log(gameList,gameListJson, config);
    gameListJson = [...config.games, ...gameListJson];
    gameListJson.forEach((game) => {
        const li = document.createElement("li");
        li.classList.add("game-item");
        li.innerHTML = `<div class="game-title-bar"><button class="game-button"><a>${game.name}</a></button> <button data-game-id="${game.id}" class="configure-game"><i class="fa-solid fa-gear"/></button></div>`;
        li.querySelector(".game-button").addEventListener("click", (e) => {
            window.api.send("open-game", game.id ?? game.name);
            window.location.href = game.url;
        });
        ul.appendChild(li);
        li.querySelector(".configure-game").addEventListener("click", (e) => {
            if (!(e.target instanceof Element))
                return;
            e.target.closest(".game-item").querySelector(".user-configuration").classList.toggle("hidden");
        });
        const userConfiguration = document.createElement("div");
        userConfiguration.classList.add("user-configuration");
        userConfiguration.innerHTML = `
            <div class="user-name-field">
                <input type="text" placeholder="User Name" id="user-name" value="${""}">
            </div>
            <div class="user-password-field">
                <input type="password" placeholder="Password" id="user-password" value="${""}">
            </div>
            <div class="admin-password-field">
                <input type="password" placeholder="Admin Password" id="admin-password" value="${""}">
            </div>

            <div class="button-group">
            <button id="save-user-data">Save</button>
            <button id="delete-game">Delete</button>
            </div>
        `;
        li.appendChild(userConfiguration);
        const offsetHeight = userConfiguration.offsetHeight;
        userConfiguration.style.height = `${offsetHeight}px`;
        userConfiguration.classList.add("hidden");
        userConfiguration.querySelector("#delete-game")?.addEventListener("click", () => {
            const gameList = window.localStorage.getItem("gameList") || "[]";
            const gameListJson: GameConfig[] = JSON.parse(gameList);
            const newGameList = gameListJson.filter((g) => g.id !== game.id);
            window.localStorage.setItem("gameList", JSON.stringify(newGameList));
            createGameList();
        });
        const gameId = game.id ?? game.name;
        const saveButton = userConfiguration.querySelector("#save-user-data");
        saveButton.addEventListener("click", (e) => {
            if (!(e.target instanceof Element))
                return;
            e.target.closest(".user-configuration").classList.add("hidden");
            const user = (e.target.closest(".user-configuration").querySelector("#user-name") as HTMLInputElement).value;
            const password = (e.target.closest(".user-configuration").querySelector("#user-password") as HTMLInputElement).value;
            const adminPassword = (e.target.closest(".user-configuration").querySelector("#admin-password") as HTMLInputElement).value;
            window.api.send("save-user-data", {gameId, user, password, adminPassword});
        });
    });
}

createGameList();
