# Do This Next

A small always-on-top desktop widget for keeping the current time, your next task, and YouTube Music in one place.

## Features

- Live local date and time, formatted using your system locale and timezone.
- A task list that saves task text and completion state between launches.
- A priority banner showing the first unfinished task.
- An expandable YouTube Music player with play/pause, previous/next, artwork, and a seekable track tracker.
- Desktop-only and always-on-top Glide modes.
- A 100 x 80 compact task widget that stays above other windows and opens the full task list when clicked.
- Music expansion that leaves the native window at its current resized dimensions.
- A frameless, resizable window with a global show/hide shortcut (`Ctrl+Shift+D`, or `Command+Shift+D` on macOS).
- Theme swatches and a custom background image.

## Requirements

- Node.js and npm.
- An internet connection and a YouTube Music account for signed-in music playback.

## Run locally

```sh
npm install
npm start
```

Click **Open YouTube Music** to expand the music page. Sign in and select a track there; the compact player controls then operate the current track. The YouTube Music service must be reachable, and playback availability is subject to Google's service and account requirements.

Open Settings to choose **Desktop only** (normal window behavior) or **Glide** (stay above other windows). Use **Switch to 100 x 80 mini widget** for the compact overlay; click its task preview to restore the full widget. Expanding or minimizing YouTube Music does not change the window's size.

## Tasks and privacy

Tasks are stored as JSON in Electron's per-user application data directory. YouTube Music runs in a persistent embedded browser session so its sign-in can remain available between launches. The app does not send task data to a remote service.

## Project files

- `index.js` - Electron main process and embedded widget UI.
- `preload.js` - Narrow IPC bridge for window controls and task storage.
- `yt-preload.js` - Reads YouTube Music track state and forwards player commands.
- `package.json` - Project metadata, start command, and Electron dependency.