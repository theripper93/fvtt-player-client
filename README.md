# fvtt-player-client

wiki https://wiki.theripper93.com/free/vtt-desktop-client

## Getting data from `localStorage` to put into `config.json`

```js
JSON.stringify({
    ...JSON.parse(window.localStorage.getItem("appConfig") || "{}"),
    games: JSON.parse(window.localStorage.getItem("gameList") || "[]")
})
```