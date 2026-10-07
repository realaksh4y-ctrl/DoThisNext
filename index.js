const {
    app,
    BrowserWindow,
    ipcMain,
    globalShortcut
} = require("electron");

const path = require("path");
const fs = require("fs/promises");
const { pathToFileURL } = require("url");


// ============================================================
// WINDOW CONFIGURATION
// ============================================================

const NORMAL_WIDTH = 520;
const NORMAL_HEIGHT = 800;

const EXPANDED_WIDTH = 720;
const EXPANDED_HEIGHT = 900;

const MIN_WIDTH = 420;
const MIN_HEIGHT = 600;

const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1200;

let mainWindow = null;

let taskSaveQueue = Promise.resolve();


// ============================================================
// CREATE WINDOW
// ============================================================

function createWindow() {

    mainWindow = new BrowserWindow({

        width: NORMAL_WIDTH,
        height: NORMAL_HEIGHT,

        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,

        maxWidth: MAX_WIDTH,
        maxHeight: MAX_HEIGHT,

        frame: false,

        transparent: true,

        resizable: true,

        alwaysOnTop: true,

        backgroundColor: "#08030f",

        webPreferences: {

            preload: path.join(
                __dirname,
                "preload.js"
            ),

            contextIsolation: true,

            nodeIntegration: false,

            autoplayPolicy: "no-user-gesture-required",

            webviewTag: true

        }

    });


    // ========================================================
    // HTML APPLICATION
    // ========================================================

    const ytPreloadPath =
        pathToFileURL(
                path.join(__dirname, "yt-preload.js")
        ).href;

const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>Do This Next</title>


<style>


/* ==========================================================
   RESET
========================================================== */

* {

    box-sizing: border-box;

}


html,
body {

    width: 100%;

    height: 100%;

    margin: 0;

    padding: 0;

}


body {

    overflow: hidden;

    position: relative;

    color: #ffffff;

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        "Helvetica Neue",
        Arial,
        sans-serif;

    background:

        radial-gradient(
            circle at 10% 10%,
            rgba(124, 58, 237, 0.30),
            transparent 34%
        ),

        radial-gradient(
            circle at 90% 85%,
            rgba(236, 72, 153, 0.18),
            transparent 40%
        ),

        linear-gradient(
            145deg,
            #090313,
            #160622,
            #08020e
        );

    transition:
        background 4s ease;

    user-select: none;

    -webkit-font-smoothing: antialiased;

}


/* ==========================================================
   STAR FIELD
========================================================== */

body::before {

    content: "";

    position: fixed;

    inset: 0;

    pointer-events: none;

    background-image:

        radial-gradient(
            circle,
            rgba(255,255,255,0.70) 1px,
            transparent 1.5px
        ),

        radial-gradient(
            circle,
            rgba(196,181,253,0.50) 1px,
            transparent 1.5px
        ),

        radial-gradient(
            circle,
            rgba(255,255,255,0.35) 1px,
            transparent 1.5px
        );

    background-size:
        95px 95px,
        145px 145px,
        210px 210px;

    background-position:
        15px 20px,
        60px 100px,
        30px 50px;

    opacity: 0.22;

    z-index: -5;

}


/* ==========================================================
   AMBIENT LIGHT
========================================================== */

body::after {

    content: "";

    position: fixed;

    width: 75%;

    height: 55%;

    left: 12%;

    top: 24%;

    border-radius: 50%;

    background:
        radial-gradient(
            circle,
            rgba(139,92,246,0.18),
            transparent 65%
        );

    filter: blur(55px);

    pointer-events: none;

    z-index: -4;

    animation:
        ambientGlow 9s ease-in-out infinite alternate;

}


@keyframes ambientGlow {

    0% {

        transform:
            scale(0.88)
            translate(-5%, -3%);

        opacity: 0.45;

    }

    50% {

        transform:
            scale(1.12)
            translate(5%, 4%);

        opacity: 0.75;

    }

    100% {

        transform:
            scale(0.96)
            translate(2%, -4%);

        opacity: 0.55;

    }

}


/* ==========================================================
   TOP DRAG AREA
========================================================== */

.drag-region {

    position: absolute;

    top: 0;

    left: 0;

    right: 0;

    height: 28px;

    display: flex;

    justify-content: center;

    align-items: center;

    -webkit-app-region: drag;

    z-index: 1000;

}


.drag-handle {

    width: 44px;

    height: 4px;

    border-radius: 20px;

    background:
        rgba(255,255,255,0.25);

}


/* ==========================================================
   WINDOW BUTTONS
========================================================== */

.window-controls {

    position: absolute;

    top: 7px;

    right: 9px;

    display: flex;

    gap: 5px;

    z-index: 2000;

}


.window-button {

    width: 30px;

    height: 30px;

    border-radius: 9px;

    border:
        1px solid
        rgba(255,255,255,0.10);

    background:
        rgba(255,255,255,0.07);

    color:
        rgba(255,255,255,0.85);

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 17px;

    line-height: 1;

    cursor: pointer;

    -webkit-app-region: no-drag;

    transition:
        background 0.2s ease,
        transform 0.2s ease;

}


.window-button:hover {

    background:
        rgba(255,255,255,0.15);

    transform:
        scale(1.04);

}


.window-button.close:hover {

    background:
        rgba(255,60,80,0.65);

}


/* ==========================================================
   MAIN CONTAINER
========================================================== */

.app {

    width: 100%;

    height: 100%;

    padding:
        31px 10px 10px 10px;

    display: flex;

    flex-direction: column;

    gap: 10px;

}


/* ==========================================================
   GLASS CARDS
========================================================== */

.card {

    position: relative;

    border-radius: 23px;

    border:
        1px solid
        rgba(255,255,255,0.10);

    background:

        linear-gradient(
            145deg,
            rgba(38,25,53,0.80),
            rgba(17,9,28,0.86)
        );

    backdrop-filter:
        blur(35px);

    -webkit-backdrop-filter:
        blur(35px);

    box-shadow:

        0 15px 40px
        rgba(0,0,0,0.40),

        inset 0 1px 0
        rgba(255,255,255,0.045);

}


/* ==========================================================
   CLOCK CARD
========================================================== */

.clock-card {

    min-height: 120px;

    flex-shrink: 0;

    padding:
        22px 23px;

    display: flex;

    align-items: center;

    justify-content: space-between;

}


.date-section {

    display: flex;

    flex-direction: column;

    gap: 3px;

}


.day {

    color:
        #c4b5fd;

    font-size: 13px;

    font-weight: 800;

    letter-spacing:
        1.4px;

}


.date {

    color:
        rgba(255,255,255,0.83);

    font-size: 14px;

    font-weight: 600;

    letter-spacing:
        0.7px;

}


.clock {

    color: white;

    font-size: 44px;

    font-weight: 800;

    line-height: 1;

    letter-spacing:
        -2px;

}


/* ==========================================================
   TASK SECTION
========================================================== */

.task-card {

    flex: 1;

    min-height: 250px;

    padding: 20px;

    display: flex;

    flex-direction: column;

    overflow: hidden;

}


.section-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 13px;

}


.section-title {

    color:
        #c4b5fd;

    font-size: 13px;

    font-weight: 800;

    letter-spacing:
        1.3px;

}


.task-count {

    color:
        #99939f;

    font-size: 11px;

    font-weight: 700;

}


/* ==========================================================
   PRIORITY BANNER
========================================================== */

.priority {

    min-height: 45px;

    display: flex;

    align-items: center;

    padding:
        10px 13px;

    margin-bottom: 11px;

    border-radius: 14px;

    background:

        linear-gradient(
            90deg,
            rgba(124,58,237,0.24),
            rgba(236,72,153,0.11)
        );

    border:
        1px solid
        rgba(167,139,250,0.16);

    color:
        #f5f3ff;

    font-size: 13px;

    font-weight: 600;

    overflow: hidden;

    white-space: nowrap;

    text-overflow: ellipsis;

}


/* ==========================================================
   INPUT
========================================================== */

.input-row {

    display: flex;

    gap: 9px;

    margin-bottom: 12px;

}


.task-input {

    flex: 1;

    min-width: 0;

    height: 45px;

    padding:
        0 14px;

    border-radius: 14px;

    border:
        1px solid
        rgba(255,255,255,0.07);

    outline: none;

    background:
        rgba(255,255,255,0.065);

    color: white;

    font-family: inherit;

    font-size: 13px;

}


.task-input:focus {

    border-color:
        rgba(167,139,250,0.45);

    background:
        rgba(255,255,255,0.09);

}


.task-input::placeholder {

    color:
        #88818f;

}


.add-button {

    width: 45px;

    height: 45px;

    flex-shrink: 0;

    border: none;

    border-radius: 14px;

    background:

        linear-gradient(
            135deg,
            #9b63ff,
            #7137e8
        );

    color: white;

    font-size: 23px;

    font-weight: 700;

    cursor: pointer;

    box-shadow:
        0 7px 20px
        rgba(124,58,237,0.35);

    transition:
        transform 0.15s ease;

}


.add-button:hover {

    transform:
        translateY(-1px);

}


.add-button:active {

    transform:
        scale(0.95);

}


/* ==========================================================
   TASK LIST
========================================================== */

.task-list {

    flex: 1;

    min-height: 0;

    overflow-y: auto;

    display: flex;

    flex-direction: column;

    gap: 7px;

}


.task-list::-webkit-scrollbar {

    width: 3px;

}


.task-list::-webkit-scrollbar-thumb {

    background:
        rgba(255,255,255,0.18);

    border-radius: 20px;

}


.task {

    min-height: 43px;

    display: flex;

    align-items: center;

    gap: 10px;

    padding:
        9px 11px;

    border-radius: 13px;

    border:
        1px solid
        rgba(255,255,255,0.045);

    background:
        rgba(255,255,255,0.035);

    color:
        #eeeaf2;

    font-size: 13px;

    cursor: pointer;

    transition:
        background 0.2s ease;

}


.task:hover {

    background:
        rgba(255,255,255,0.07);

}


.checkbox {

    width: 19px;

    height: 19px;

    flex-shrink: 0;

    border-radius: 50%;

    border:
        2px solid
        #a78bfa;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 10px;

}


.task.completed .checkbox {

    background:
        #a78bfa;

    color:
        #1b1027;

}


.task.completed .task-text {

    text-decoration:
        line-through;

    color:
        #77717f;

}


.task-text {

    min-width: 0;

    overflow: hidden;

    white-space: nowrap;

    text-overflow: ellipsis;

}


/* ==========================================================
   YOUTUBE MUSIC CARD
========================================================== */

.music-card {

    min-height: 190px;

    flex-shrink: 0;

    padding:
        15px;

    overflow: hidden;

    transition:
        box-shadow 4s ease,
        border-color 4s ease;

}


/* ==========================================================
   MUSIC HEADER
========================================================== */

.music-header {

    height: 26px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 10px;

}


.music-brand {

    display: flex;

    align-items: center;

    gap: 9px;

}


.youtube-icon {

    width: 30px;

    height: 21px;

    border-radius: 6px;

    background:
        #ff0033;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 10px;

    color: white;

}


.music-name {

    font-size: 11px;

    font-weight: 800;

    letter-spacing:
        1px;

    color:
        rgba(255,255,255,0.92);

}


.music-more {

    color:
        #9d97a4;

    font-size: 14px;

    letter-spacing:
        2px;

}


/* ==========================================================
   MUSIC MAIN ROW
========================================================== */

.music-main {

    display: flex;

    align-items: center;

    gap: 12px;

}


.album {

    width: 67px;

    height: 67px;

    flex-shrink: 0;

    border-radius: 13px;

    position: relative;

    overflow: hidden;

    display: flex;

    align-items: center;

    justify-content: center;

    background:

        radial-gradient(
            circle at 30% 20%,
            #f9a8d4,
            transparent 20%
        ),

        linear-gradient(
            140deg,
            #312e81,
            #7c3aed 48%,
            #ec4899
        );

    box-shadow:
        0 8px 20px
        rgba(0,0,0,0.40);

}


.album::before {

    content: "";

    width: 95px;

    height: 95px;

    border-radius: 50%;

    position: absolute;

    right: -45px;

    bottom: -45px;

    background:
        rgba(255,255,255,0.12);

}


.album-note {

    position: relative;

    z-index: 2;

    font-size: 27px;

}


.track-info {

    min-width: 0;

    flex: 1;

    display: flex;

    flex-direction: column;

    gap: 3px;

}


.track-title {

    color: white;

    font-size: 15px;

    font-weight: 750;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}


.track-artist {

    color:
        #b8a7e9;

    font-size: 11px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}


/* ==========================================================
   CONTROLS
========================================================== */

.player-controls {

    display: flex;

    align-items: center;

    gap: 4px;

}


.control {

    width: 31px;

    height: 31px;

    border-radius: 50%;

    border: none;

    background:
        rgba(255,255,255,0.075);

    color: white;

    cursor: pointer;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 11px;

}


.control:hover {

    background:
        rgba(255,255,255,0.15);

}


.play-control {

    width: 42px;

    height: 42px;

    background: white;

    color:
        #19121f;

    font-size: 14px;

}


/* ==========================================================
   PROGRESS
========================================================== */

.progress {

    margin-top: 11px;

}


.progress-bar {

    width: 100%;

    height: 3px;

    border-radius: 20px;

    overflow: hidden;

    background:
        rgba(255,255,255,0.12);

}


.progress-fill {

    height: 100%;

    width: 36%;

    border-radius: 20px;

    background:

        linear-gradient(
            90deg,
            #a78bfa,
            #ec4899
        );

}


.progress-times {

    display: flex;

    justify-content: space-between;

    margin-top: 4px;

    color:
        #77717f;

    font-size: 9px;

}


/* ==========================================================
   MUSIC BOTTOM
========================================================== */

.music-bottom {

    margin-top: 9px;

    display: flex;

    align-items: center;

    justify-content: space-between;

}


.music-status {

    color:
        #77717f;

    font-size: 9px;

}


.open-music {

    border:
        1px solid
        rgba(167,139,250,0.20);

    background:
        rgba(167,139,250,0.10);

    color:
        #c4b5fd;

    border-radius: 10px;

    padding:
        7px 11px;

    font-size: 10px;

    font-weight: 700;

    cursor: pointer;

}


.open-music:hover {

    background:
        rgba(167,139,250,0.19);

}


/* ==========================================================
   EXPANDED MUSIC MODE
========================================================== */

.music-card.expanded {

    position: fixed;

    left: 10px;

    top: 10px;

    right: 10px;

    bottom: 10px;

    width: auto;

    height: auto;

    min-height: 0;

    z-index: 3000;

    padding: 10px;

    background:
        rgba(6,3,10,0.98);

}


.music-card.expanded .normal-player {

    display: none;

}


.expanded-player {

    display: none;

    height: 100%;

    width: 100%;

    flex-direction: column;

}


.music-card.expanded .expanded-player {

    display: flex;

}


.expanded-top {

    height: 36px;

    flex-shrink: 0;

    display: flex;

    align-items: center;

    justify-content: space-between;

}


.expanded-label {

    color:
        #c4b5fd;

    font-size: 12px;

    font-weight: 800;

    letter-spacing:
        1px;

}


.expanded-close {

    border: none;

    border-radius: 9px;

    padding:
        7px 11px;

    background:
        rgba(255,255,255,0.09);

    color: white;

    cursor: pointer;

    font-size: 11px;

    font-weight: 700;

}


.expanded-close:hover {

    background:
        rgba(255,255,255,0.16);

}


.webview-container {

    flex: 1;

    min-height: 0;

    overflow: hidden;

    border-radius: 17px;

    background: #000;

}


#youtubeMusic {

    width: 100%;

    height: 100%;

    border: none;

    background: #000;

}


/* ==========================================================
   SETTINGS DRAWER
========================================================== */

.settings {

    position: fixed;

    inset: 0;

    z-index: 5000;

    padding: 27px;

    background:
        rgba(10,4,16,0.97);

    backdrop-filter:
        blur(40px);

    -webkit-backdrop-filter:
        blur(40px);

    transform:
        translateX(100%);

    transition:
        transform 0.3s ease;

    display: flex;

    flex-direction: column;

}


.settings.open {

    transform:
        translateX(0);

}


.settings-header {

    display: flex;

    justify-content: space-between;

    align-items: center;

}


.settings-title {

    color: white;

    font-size: 18px;

    font-weight: 750;

}


.settings-close {

    border: none;

    background:
        rgba(255,255,255,0.08);

    color: white;

    border-radius: 10px;

    padding:
        8px 13px;

    cursor: pointer;

}


.setting {

    margin-top: 25px;

}


.setting-label {

    color:
        #898391;

    font-size: 10px;

    font-weight: 800;

    letter-spacing:
        1px;

    margin-bottom: 10px;

}


.swatches {

    display: flex;

    gap: 10px;

}


.swatch {

    width: 35px;

    height: 35px;

    border-radius: 50%;

    border:
        2px solid
        rgba(255,255,255,0.20);

    cursor: pointer;

}


.background-button {

    width: 100%;

    padding: 15px;

    border-radius: 14px;

    border:
        1px dashed
        rgba(255,255,255,0.20);

    background:
        rgba(255,255,255,0.04);

    color:
        #c4b5fd;

    text-align: center;

    cursor: pointer;

}


.settings-footer {

    margin-top: auto;

    text-align: center;

    color:
        #66616c;

    font-size: 10px;

}


/* ==========================================================
   RESIZE HANDLE
========================================================== */

.resize-handle {

    position: fixed;

    width: 25px;

    height: 25px;

    right: 1px;

    bottom: 1px;

    z-index: 7000;

    cursor:
        nwse-resize;

    display: flex;

    align-items: flex-end;

    justify-content: flex-end;

    padding: 4px;

}


.resize-handle::before {

    content: "";

    width: 10px;

    height: 10px;

    border-right:
        2px solid
        rgba(255,255,255,0.32);

    border-bottom:
        2px solid
        rgba(255,255,255,0.32);

}


/* ==========================================================
   RESPONSIVE
========================================================== */

@media (max-width: 470px) {

    .clock {

        font-size: 36px;

    }

    .album {

        width: 58px;

        height: 58px;

    }

    .track-title {

        font-size: 13px;

    }

}


</style>

</head>


<body>


<!-- ========================================================
     DRAG HANDLE
======================================================== -->

<div class="drag-region">

    <div class="drag-handle"></div>

</div>


<!-- ========================================================
     WINDOW CONTROLS
======================================================== -->

<div class="window-controls">

    <button
        class="window-button"
        id="minimizeButton"
        title="Minimize"
    >
        —
    </button>

    <button
        class="window-button close"
        id="closeButton"
        title="Close"
    >
        ×
    </button>

</div>


<!-- ========================================================
     SETTINGS
======================================================== -->

<div
    class="settings"
    id="settingsPanel"
>

    <div class="settings-header">

        <div class="settings-title">
            ✦ Widget Settings
        </div>

        <button
            class="settings-close"
            id="settingsClose"
        >
            Done
        </button>

    </div>


    <div class="setting">

        <div class="setting-label">
            AMBIENT THEME
        </div>


        <div class="swatches">

            <div
                class="swatch"
                style="background:#000000"
                data-color="#000000"
            ></div>

            <div
                class="swatch"
                style="background:#17102b"
                data-color="#17102b"
            ></div>

            <div
                class="swatch"
                style="background:#0d172d"
                data-color="#0d172d"
            ></div>

            <div
                class="swatch"
                style="background:#320a4d"
                data-color="#320a4d"
            ></div>

        </div>

    </div>


    <div class="setting">

        <div class="setting-label">
            BACKGROUND IMAGE
        </div>


        <label class="background-button">

            Choose a background image

            <input
                type="file"
                id="backgroundInput"
                accept="image/*"
                style="display:none"
            >

        </label>

    </div>


    <div class="settings-footer">

        DO THIS NEXT • DESKTOP WIDGET

    </div>

</div>


<!-- ========================================================
     APPLICATION
======================================================== -->

<div class="app">


    <!-- ====================================================
         CLOCK
    ===================================================== -->

    <section class="card clock-card">


        <div class="date-section">

            <div
                class="day"
                id="day"
            >
                TUESDAY
            </div>

            <div
                class="date"
                id="date"
            >
                OCT 6
            </div>

        </div>


        <div
            class="clock"
            id="clock"
        >
            23:19
        </div>


    </section>


    <!-- ====================================================
         TASK MANAGEMENT
    ===================================================== -->

    <section class="card task-card">


        <div class="section-header">

            <div class="section-title">
                DO THIS NEXT
            </div>

            <div
                class="task-count"
                id="taskCount"
            >
                0 left
            </div>

        </div>


        <div
            class="priority"
            id="priority"
        >
            No pending tasks. Add one below!
        </div>


        <div class="input-row">

            <input
                class="task-input"
                id="taskInput"
                type="text"
                placeholder="What's your priority task?"
            >

            <button
                class="add-button"
                id="addTaskButton"
            >
                +
            </button>

        </div>


        <div
            class="task-list"
            id="taskList"
        ></div>


    </section>


    <!-- ====================================================
         YOUTUBE MUSIC
    ===================================================== -->

    <section
        class="card music-card"
        id="musicCard"
    >


        <!-- NORMAL MUSIC CARD -->

        <div class="normal-player">


            <div class="music-header">

                <div class="music-brand">

                    <div class="youtube-icon">
                        ▶
                    </div>

                    <div class="music-name">
                        YOUTUBE MUSIC
                    </div>

                </div>


                <div class="music-more">
                    •••
                </div>

            </div>


            <div class="music-main">


                <div class="album">

                    <div class="album-note">
                        ♪
                    </div>

                </div>


                <div class="track-info">

                    <div
                        class="track-title"
                        id="trackTitle"
                    >
                        Your Music
                    </div>

                    <div
                        class="track-artist"
                        id="trackArtist"
                    >
                        YouTube Music
                    </div>

                </div>


                <div class="player-controls">

                    <button
                        class="control"
                        id="previousButton"
                    >
                        ‹‹
                    </button>

                    <button
                        class="control play-control"
                        id="playButton"
                    >
                        ▶
                    </button>

                    <button
                        class="control"
                        id="nextButton"
                    >
                        ››
                    </button>

                </div>


            </div>


            <div class="progress">

                <div class="progress-bar">

                    <div
                        class="progress-fill"
                        id="progressFill"
                    ></div>

                </div>


                <div class="progress-times">

                    <span id="currentTime">
                        0:00
                    </span>

                    <span id="totalTime">
                        --:--
                    </span>

                </div>

            </div>


            <div class="music-bottom">

                <div
                    class="music-status"
                    id="musicStatus"
                >
                    Ready to play
                </div>


                <button
                    class="open-music"
                    id="openMusicButton"
                >
                    Open YouTube Music
                </button>

            </div>


        </div>


        <!-- EXPANDED MUSIC VIEW -->

        <div class="expanded-player">


            <div class="expanded-top">

                <div class="expanded-label">
                    YOUTUBE MUSIC
                </div>


                <button
                    class="expanded-close"
                    id="expandedClose"
                >
                    ✕ Minimize
                </button>

            </div>


            <div class="webview-container">

         <webview
    id="youtubeMusic"
    src="https://music.youtube.com"
        partition="persist:youtube-music"
    preload="${ytPreloadPath}"
    allowpopups
></webview>

            </div>


        </div>


    </section>


</div>


<!-- ========================================================
     RESIZE HANDLE
======================================================== -->

<div
    class="resize-handle"
    id="resizeHandle"
></div>


<script>


// ============================================================
// VARIABLES
// ============================================================

let musicExpanded = false;

let musicWebviewReady = false;

let queuedMusicCommand = null;

let ambientIndex = 0;

// ============================================================
// CLOCK
// ============================================================

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
        }).format(now);

    document.getElementById("day").textContent =
        new Intl.DateTimeFormat(undefined, {
            weekday: "long"
        }).format(now).toUpperCase();

    document.getElementById("date").textContent =
        new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric"
        }).format(now).toUpperCase();

}

updateClock();

setInterval(
    updateClock,
    1000
);


// ============================================================
// WINDOW CONTROLS
// ============================================================

document
    .getElementById("minimizeButton")
    .addEventListener(
        "click",
        function() {

            if (
                window.electronAPI &&
                window.electronAPI.minimizeWindow
            ) {

                window.electronAPI.minimizeWindow();

            }

        }
    );


document
    .getElementById("closeButton")
    .addEventListener(
        "click",
        function() {

            if (
                window.electronAPI &&
                window.electronAPI.closeWindow
            ) {

                window.electronAPI.closeWindow();

            }

        }
    );


// ============================================================
// TASK SYSTEM
// ============================================================

const taskInput =
    document.getElementById(
        "taskInput"
    );


const taskList =
    document.getElementById(
        "taskList"
    );

let tasks = [];

let tasksReady = false;


function saveTasks() {

    if (
        window.electronAPI &&
        window.electronAPI.saveTasks
    ) {

        window.electronAPI.saveTasks(tasks)
            .catch(function(error) {
                console.error("Could not save tasks:", error);
            });

    }

}


function renderTasks() {

    taskList.replaceChildren();

    tasks.forEach(function(item) {

        const task = document.createElement("div");
        task.className = item.completed ? "task completed" : "task";

        const checkbox = document.createElement("div");
        checkbox.className = "checkbox";
        checkbox.textContent = item.completed ? "✓" : "";

        const taskText = document.createElement("div");
        taskText.className = "task-text";
        taskText.textContent = item.text;

        task.appendChild(checkbox);
        task.appendChild(taskText);

        task.addEventListener("click", function() {
            item.completed = !item.completed;
            renderTasks();
            saveTasks();
        });

        taskList.appendChild(task);

    });

    updateTasks();

}


async function loadTasks() {

    try {

        if (
            window.electronAPI &&
            window.electronAPI.loadTasks
        ) {

            const savedTasks = await window.electronAPI.loadTasks();
            tasks = Array.isArray(savedTasks)
                ? savedTasks.filter(function(item) {
                    return item && typeof item.text === "string";
                }).map(function(item) {
                    return {
                        text: item.text,
                        completed: Boolean(item.completed)
                    };
                })
                : [];

        }

    } catch (error) {

        console.error("Could not load tasks:", error);

    }

    tasksReady = true;
    renderTasks();

}


loadTasks();


function addTask() {

    if (!tasksReady) {
        return;
    }

    const text =
        taskInput.value.trim();


    if (!text) {

        return;

    }


    tasks.push({
        text: text,
        completed: false
    });


    taskInput.value =
        "";


    renderTasks();
    saveTasks();

}


document
    .getElementById("addTaskButton")
    .addEventListener(
        "click",
        addTask
    );


taskInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            addTask();

        }

    }
);


function updateTasks() {

    const remaining = tasks.filter(function(item) {
        return !item.completed;
    }).length;


    document.getElementById(
        "taskCount"
    ).textContent =
        remaining + " left";


    const firstPending = tasks.find(function(item) {
        return !item.completed;
    });


    if (firstPending) {

        document.getElementById(
            "priority"
        ).textContent =
            firstPending.text;

    }

    else {

        document.getElementById(
            "priority"
        ).textContent =
            "No pending tasks. Add one below!";

    }

}


// ============================================================
// MUSIC PLAY BUTTON
// ============================================================

document
    .getElementById("playButton")
    .addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            sendMusicCommand({ type: "toggle-play" });

        }
    );


document
    .getElementById("previousButton")
    .addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            sendMusicCommand({ type: "previous" });

        }
    );


document
    .getElementById("nextButton")
    .addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            sendMusicCommand({ type: "next" });

        }
    );

const youtubeMusic =
    document.getElementById(
        "youtubeMusic"
    );


function sendMusicCommand(command) {

    if (!musicWebviewReady) {

        queuedMusicCommand = command;
        expandMusic();
        document.getElementById("musicStatus").textContent =
            "Loading YouTube Music...";
        return;

    }

    youtubeMusic.send("command", command);

}

    youtubeMusic.addEventListener(
    "ipc-message",
    function(event) {

        if (
            event.channel !==
            "youtube-music"
        ) {
            return;
        }

        const data =
            event.args &&
            event.args[0];

        if (!data) {
            return;
        }


        if (
            data.type ===
            "track"
        ) {

            if (data.title) {

                document
                    .getElementById(
                        "trackTitle"
                    )
                    .textContent =
                    data.title;

            }


            if (data.artist) {

                document
                    .getElementById(
                        "trackArtist"
                    )
                    .textContent =
                    data.artist;

            }


            if (data.artwork) {

                const album =
                    document.querySelector(
                        ".album"
                    );

                album.style.background =
                    "url('" +
                    data.artwork +
                    "') center / cover no-repeat";

                album.innerHTML = "";

            }

        }


        if (
            data.type ===
            "playback"
        ) {

            document
                .getElementById(
                    "playButton"
                )
                .textContent =
                data.playing
                    ? "Ⅱ"
                    : "▶";


            document
                .getElementById(
                    "musicStatus"
                )
                .textContent =
                data.playing
                    ? "Playing"
                    : "Paused";


            const duration =
                Number(
                    data.duration || 0
                );


            const current =
                Number(
                    data.currentTime || 0
                );


            document.getElementById("currentTime").textContent =
                formatMusicTime(current);

            document.getElementById("totalTime").textContent =
                duration > 0 ? formatMusicTime(duration) : "--:--";


            if (duration > 0) {

                const percent =
                    (
                        current /
                        duration
                    ) * 100;


                document
                    .getElementById(
                        "progressFill"
                    )
                    .style
                    .width =
                    Math.max(0, Math.min(100, percent)) + "%";

            }

        }

    }
);
// ============================================================
// EXPAND YOUTUBE MUSIC
// ============================================================

function expandMusic() {

    const musicCard =
        document.getElementById(
            "musicCard"
        );

    if (!musicCard) {
        return;
    }

    musicCard.classList.add(
        "expanded"
    );

    musicExpanded = true;

    if (
        window.electronAPI &&
        window.electronAPI.resizeWindow
    ) {

        window.electronAPI.resizeWindow(
            720,
            900
        );

    }

}

function minimizeMusic() {

    const musicCard =
        document.getElementById(
            "musicCard"
        );

    if (!musicCard) {
        return;
    }

    musicCard.classList.remove(
        "expanded"
    );

    musicExpanded = false;

    if (
        window.electronAPI &&
        window.electronAPI.resizeWindow
    ) {

        window.electronAPI.resizeWindow(
            520,
            800
        );

    }

}


function formatMusicTime(seconds) {

    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = String(safeSeconds % 60).padStart(2, "0");

    return minutes + ":" + remainder;

}


document
    .getElementById("openMusicButton")
    .addEventListener("click", expandMusic);


document
    .getElementById("expandedClose")
    .addEventListener("click", minimizeMusic);
// ============================================================
// AMBIENT COLOR SYSTEM
// ============================================================

const themes = [

    {
        primary:
            "rgba(139,92,246,0.30)",

        secondary:
            "rgba(236,72,153,0.18)"
    },

    {
        primary:
            "rgba(59,130,246,0.26)",

        secondary:
            "rgba(129,140,248,0.18)"
    },

    {
        primary:
            "rgba(236,72,153,0.27)",

        secondary:
            "rgba(217,70,239,0.18)"
    },

    {
        primary:
            "rgba(20,184,166,0.23)",

        secondary:
            "rgba(59,130,246,0.18)"
    },

    {
        primary:
            "rgba(168,85,247,0.30)",

        secondary:
            "rgba(244,63,94,0.16)"
    }

];


function changeAmbientTheme() {

    ambientIndex =
        (
            ambientIndex + 1
        )
        %
        themes.length;


    const theme =
        themes[
            ambientIndex
        ];


    document.body.style.background =

        "radial-gradient(" +

        "circle at 10% 10%, " +

        theme.primary +

        ", transparent 34%), " +

        "radial-gradient(" +

        "circle at 90% 85%, " +

        theme.secondary +

        ", transparent 40%), " +

        "linear-gradient(" +

        "145deg, " +

        "#090313, " +

        "#160622, " +

        "#08020e)";


    document.getElementById(
        "musicCard"
    ).style.boxShadow =

        "0 15px 45px " +
        theme.primary;

}


setInterval(
    changeAmbientTheme,
    7000
);


// ============================================================
// SETTINGS
// ============================================================

const settingsPanel =
    document.getElementById(
        "settingsPanel"
    );


// Secret/simple settings trigger:
// double click the music label

document
    .querySelector(".music-name")
    .addEventListener(
        "dblclick",
        function() {

            settingsPanel
                .classList.add(
                    "open"
                );

        }
    );


document
    .getElementById("settingsClose")
    .addEventListener(
        "click",
        function() {

            settingsPanel
                .classList.remove(
                    "open"
                );

        }
    );


document
    .querySelectorAll(".swatch")
    .forEach(
        function(swatch) {

            swatch.addEventListener(
                "click",
                function() {

                    const color =
                        this.dataset.color;


                    document.body.style.background =
                        color;

                }
            );

        }
    );


// ============================================================
// CUSTOM BACKGROUND
// ============================================================

document
    .getElementById("backgroundInput")
    .addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files[0];


            if (!file) {

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function(e) {

                    document.body.style.background =

                        "linear-gradient(" +
                        "rgba(8,3,15,0.35), " +
                        "rgba(8,3,15,0.55)), " +

                        "url('" +
                        e.target.result +
                        "') center / cover fixed";

                };


            reader.readAsDataURL(
                file
            );

        }
    );


// ============================================================
// CUSTOM WINDOW RESIZER
// ============================================================

const resizeHandle =
    document.getElementById(
        "resizeHandle"
    );


let resizing = false;


resizeHandle.addEventListener(
    "mousedown",
    function(event) {

        event.preventDefault();

        resizing = true;

        document.body.style.cursor =
            "nwse-resize";

    }
);


document.addEventListener(
    "mousemove",
    function(event) {

        if (!resizing) {

            return;

        }


        if (
            window.electronAPI &&
            window.electronAPI.resizeWindowByDelta
        ) {

            window.electronAPI
                .resizeWindowByDelta(
                    event.movementX,
                    event.movementY
                );

        }

    }
);


document.addEventListener(
    "mouseup",
    function() {

        resizing = false;

        document.body.style.cursor =
            "default";

    }
);


// ============================================================
// YOUTUBE MUSIC WEBVIEW EVENTS
// ============================================================

youtubeMusic.addEventListener(
    "did-start-loading",
    function() {
        musicWebviewReady = false;
    }
);


youtubeMusic.addEventListener(
    "dom-ready",
    function() {

        musicWebviewReady = true;
        document.getElementById("musicStatus").textContent =
            "Ready to play";

        console.log(
            "YouTube Music is ready"
        );

        if (queuedMusicCommand) {
            const command = queuedMusicCommand;
            queuedMusicCommand = null;
            setTimeout(function() {
                youtubeMusic.send("command", command);
            }, 1200);
        }

    }
);


youtubeMusic.addEventListener(
    "did-fail-load",
    function(event) {

        if (event.isMainFrame) {
            musicWebviewReady = false;
            document.getElementById("musicStatus").textContent =
                "YouTube Music could not load";
        }

        console.log(
            "YouTube Music failed to load:",
            event.errorDescription
        );

    }
);


// ============================================================
// KEYBOARD SHORTCUT
// ============================================================

// ESC closes expanded music view

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            musicExpanded
        ) {

            minimizeMusic();

        }

    }
);


</script>


</body>

</html>

`;


    // ========================================================
    // LOAD APPLICATION
    // ========================================================

    mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
        encodeURIComponent(html)
    );


    // ========================================================
    // WINDOW CLOSED
    // ========================================================

    mainWindow.on(
        "closed",
        function() {

            mainWindow = null;

        }
    );

}


// ============================================================
// TASK STORAGE
// ============================================================

ipcMain.handle(
    "load-tasks",
    async function() {

        const taskFilePath =
            path.join(
                app.getPath("userData"),
                "tasks.json"
            );

        try {

            const contents = await fs.readFile(taskFilePath, "utf8");
            const tasks = JSON.parse(contents);

            return Array.isArray(tasks) ? tasks : [];

        } catch (error) {

            if (error.code === "ENOENT") {
                return [];
            }

            throw error;

        }

    }
);


ipcMain.handle(
    "save-tasks",
    async function(_event, tasks) {

        if (!Array.isArray(tasks)) {
            return false;
        }

        const taskFilePath =
            path.join(
                app.getPath("userData"),
                "tasks.json"
            );

        taskSaveQueue = taskSaveQueue.catch(function() {}).then(async function() {
            await fs.mkdir(path.dirname(taskFilePath), { recursive: true });
            await fs.writeFile(
                taskFilePath,
                JSON.stringify(tasks, null, 2),
                "utf8"
            );
        });

        await taskSaveQueue;

        return true;

    }
);


// EXACT WINDOW RESIZE
// ============================================================

ipcMain.on(
    "resize-widget",
    function(event, dimensions) {

        const win =
            BrowserWindow.fromWebContents(
                event.sender
            );


        if (!win) {

            return;

        }


        let width =
            Number(dimensions.width);


        let height =
            Number(dimensions.height);


        width =
            Math.max(
                MIN_WIDTH,
                Math.min(
                    MAX_WIDTH,
                    width
                )
            );


        height =
            Math.max(
                MIN_HEIGHT,
                Math.min(
                    MAX_HEIGHT,
                    height
                )
            );


        win.setSize(
            width,
            height,
            true
        );

    }
);


// ============================================================
// CUSTOM RESIZE
// ============================================================

ipcMain.on(
    "resize-window-delta",
    function(event, delta) {

        const win =
            BrowserWindow.fromWebContents(
                event.sender
            );


        if (!win) {

            return;

        }


        const bounds =
            win.getBounds();


        let width =
            bounds.width +
            Number(delta.deltaWidth);


        let height =
            bounds.height +
            Number(delta.deltaHeight);


        width =
            Math.max(
                MIN_WIDTH,
                Math.min(
                    MAX_WIDTH,
                    width
                )
            );


        height =
            Math.max(
                MIN_HEIGHT,
                Math.min(
                    MAX_HEIGHT,
                    height
                )
            );


        win.setSize(
            width,
            height,
            true
        );

    }
);


// ============================================================
// MINIMIZE
// ============================================================

ipcMain.on(
    "minimize-window",
    function(event) {

        const win =
            BrowserWindow.fromWebContents(
                event.sender
            );


        if (win) {

            win.minimize();

        }

    }
);


// ============================================================
// CLOSE
// ============================================================

ipcMain.on(
    "close-window",
    function(event) {

        const win =
            BrowserWindow.fromWebContents(
                event.sender
            );


        if (win) {

            win.close();

        }

    }
);

ipcMain.on(
    "resize-window",
    function(
        _event,
        width,
        height
    ) {

        if (!mainWindow) {
            return;
        }

        mainWindow.setSize(
            Number(width),
            Number(height),
            true
        );

    }
);
// ============================================================
// APP READY
// ============================================================

app.whenReady().then(
    function() {

        createWindow();


        // ====================================================
        // GLOBAL SHOW/HIDE SHORTCUT
        // CTRL + SHIFT + D
        // ====================================================

        globalShortcut.register(
            "CommandOrControl+Shift+D",
            function() {

                if (!mainWindow) {

                    return;

                }


                if (
                    mainWindow.isVisible()
                ) {

                    mainWindow.hide();

                }

                else {

                    mainWindow.show();

                    mainWindow.focus();

                }

            }
        );

    }
);


// ============================================================
// MACOS
// ============================================================

app.on(
    "activate",
    function() {

        if (
            BrowserWindow.getAllWindows()
                .length === 0
        ) {

            createWindow();

        }

    }
);


// ============================================================
// QUIT
// ============================================================

app.on(
    "will-quit",
    function() {

        globalShortcut.unregisterAll();

    }
);