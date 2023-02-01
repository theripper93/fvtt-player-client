/*document.querySelector("#connect").addEventListener("click", () => { 
    const gameUrl = document.querySelector("#game-url").value;
    window.location.href = gameUrl;
});*/

document.querySelector("#add-game").addEventListener("click", () => {
    const gameUrl = document.querySelector("#game-url").value;
    const gameName = document.querySelector("#game-name").value;
    const gameList = window.localStorage.getItem("gameList") || "[]";
    const gameListJson = JSON.parse(gameList);
    gameListJson.push({name: gameName, url: gameUrl, id: Math.round(Math.random()*1000000)});
    window.localStorage.setItem("gameList", JSON.stringify(gameListJson));
    createGameList();
});

function createGameList() {
    const ul = document.querySelector("#game-list");
    ul.innerHTML = "";
    const gameList = window.localStorage.getItem("gameList") || "[]";
    const gameListJson = JSON.parse(gameList);
    gameListJson.forEach((game) => {
        const li = document.createElement("li");
        li.classList.add("game-item");
        li.innerHTML = `<a href="${game.url}">${game.name}</a><button data-game-id="${game.id}" class="delete-game">X</button>`;
        ul.appendChild(li);
        li.querySelector(".delete-game").addEventListener("click", () => {
            const gameList = window.localStorage.getItem("gameList") || "[]";
            const gameListJson = JSON.parse(gameList);
            const newGameList = gameListJson.filter((g) => g.id !== game.id);
            window.localStorage.setItem("gameList", JSON.stringify(newGameList));
            createGameList();
        });
    });
}

createGameList();