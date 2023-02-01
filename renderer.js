/*document.querySelector("#connect").addEventListener("click", () => { 
    const gameUrl = document.querySelector("#game-url").value;
    window.location.href = gameUrl;
});*/

document.querySelector("#add-game").addEventListener("click", () => {
    const gameUrl = document.querySelector("#game-url").value;
    const gameName = document.querySelector("#game-name").value;
    if(!gameUrl || !gameName) return alert("Please enter a game name and url");
    const gameList = window.localStorage.getItem("gameList") || "[]";
    const gameListJson = JSON.parse(gameList);
    gameListJson.push({name: gameName, url: gameUrl, id: Math.round(Math.random()*1000000)});
    window.localStorage.setItem("gameList", JSON.stringify(gameListJson));
    document.querySelector("#game-url").value = "";
    document.querySelector("#game-name").value = "";
    createGameList();
});

async function createGameList() {
    let config = {games: []};
    try {
        config = await fetch("config.json").then((res) => res.json());
    }catch(e) {
        console.log("Failed to load config.json");
    }
    if (config.background) document.body.style.backgroundImage = `url(${config.background})`;
    if (config.textColor) document.documentElement.style.setProperty("--color-text-primary", config.textColor);
    if (config.backgroundColor) document.documentElement.style.setProperty("--color-background", config.backgroundColor);
    if(config.accentColor) document.documentElement.style.setProperty("--color-accent", config.accentColor);
    const ul = document.querySelector("#game-list");
    ul.innerHTML = "";
    const gameList = window.localStorage.getItem("gameList") || "[]";
    let gameListJson = JSON.parse(gameList);
    gameListJson = [...config.games, ...gameListJson]
    gameListJson.forEach((game) => {
        const li = document.createElement("li");
        li.classList.add("game-item");
        li.innerHTML = `<a href="${game.url}">${game.name}</a>${game.id ? `<button data-game-id="${game.id}" class="delete-game">X</button>` : ""}`;
        ul.appendChild(li);
        li.querySelector(".delete-game")?.addEventListener("click", () => {
            const gameList = window.localStorage.getItem("gameList") || "[]";
            const gameListJson = JSON.parse(gameList);
            const newGameList = gameListJson.filter((g) => g.id !== game.id);
            window.localStorage.setItem("gameList", JSON.stringify(newGameList));
            createGameList();
        });
    });
}

createGameList();