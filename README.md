# Cam's Cool Sharing Game

A one-screen classroom sharing game. Drag or tap toys to friends until everyone has one.

**Made from a plan by Cameron, grade 8.**

## How to play

1. Open `index.html` in Chrome (or another modern browser).
2. Give every friend a toy:
   - **Drag** a toy onto a friend, or
   - **Tap** a toy, then **tap** a friend (helpful on Chromebook trackpads).
3. Each gift plays a cheer, shows confetti, and fills the kindness bar.
4. The timer starts when the first toy is given and stops when everyone has one.
5. Press **Play again** for a new round, or **Reset toys** to restore the starter set.

### Toy box (saved on this computer only)

- **Add a toy** — create another toy for the share row
- **Change a toy's name** — rename a toy
- **Take a toy away** — remove a toy

These use `localStorage` on the same computer. There is no server, no accounts, and no camera or microphone.

### Zoom

Use the zoom buttons (70%–130%) if the class Chromebook window feels tight. The game is built to fit a **1366 × 650** window without scrolling.

## Open locally

No build step and no dependencies. From this folder:

```bash
# optional local server
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

Or double-click `index.html`.

## Publish on GitHub Pages

1. Create a GitHub repository and push this folder to the `main` branch.
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/ (root)**, then save.
5. After a minute, open the Pages URL (often `https://YOUR_USERNAME.github.io/REPO_NAME/`).

Relative paths only: `index.html` loads `style.css` and `game.js` from the same folder, so Pages works without extra config.

## Browser support

Written for classroom Chromebooks on **Chrome 103**, with CSS/JS that also works on **Chrome 96**. Icons are simple CSS and inline SVG (no downloaded images).
