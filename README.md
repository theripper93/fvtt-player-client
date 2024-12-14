# fvtt-player-client - moved to https://github.com/OmegaRogue/fvtt-player-client

wiki https://wiki.theripper93.com/free/vtt-desktop-client

## Differences between this and theripper93's player client

| Feature                                      | [theripper93](https://github.com/theripper93/fvtt-player-client) | omegarogue |
|----------------------------------------------|:----------------------------------------------------------------:|:----------:|
| Back to server select button in setup screen |                                ✔️                                |     ✔️     |
| Back to server select button in login screen |                             ✔️    ️                              |     ✔️     |
| Back to server select button in game         |                                ❌                                 |     ✔️     |

## Customization

You can pre-configure and customize the client by editing the `config.json` file.
From where the executable is located,
you can find the `config.json` file by navigating to the `resources/app` folder.
You can edit the file with any text editor.

Example config:

```json
{
  "games": [
    {
      "name": "This is the name of my game",
      "url": "https://www.nintendo.com/games/detail/the-legend-of-zelda-breath-of-the-wild-switch"
    }
  ],
  "background": "https://images2.alphacoders.com/123/123862.jpg",
  "backgroundColor": "#000000",
  "textColor": "white",
  "accentColor": "green"
}
```

## Getting data from `localStorage` to put into `config.json`

```js
JSON.stringify({
    ...JSON.parse(window.localStorage.getItem("appConfig") || "{}"),
    games: JSON.parse(window.localStorage.getItem("gameList") || "[]")
})
```
