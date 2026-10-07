/*
============================================================
YOUTUBE MUSIC PRELOAD
============================================================

This file runs inside the YouTube Music <webview>.

It:
- reads the current track
- reads artist information
- reads album artwork
- monitors playback
- sends updates to the parent widget
- receives play/pause/next/previous/seek commands
============================================================
*/

const {
    ipcRenderer
} = require("electron");


/* ==========================================================
   HELPERS
========================================================== */

function sendToWidget(type, data = {}) {

    try {

        ipcRenderer.sendToHost(
            "youtube-music",
            {
                type,
                ...data
            }
        );

    } catch (error) {

        console.log(
            "YouTube preload send error:",
            error
        );

    }

}


function findElement(selectors) {

    for (const selector of selectors) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            return element;

        }

    }

    return null;

}


function findPlayerElement(selectors) {

    const roots = [document];

    while (roots.length > 0) {

        const root = roots.shift();

        for (const selector of selectors) {
            const element = root.querySelector(selector);

            if (element) {
                return element;
            }
        }

        root.querySelectorAll("*").forEach(function(element) {
            if (element.shadowRoot) {
                roots.push(element.shadowRoot);
            }
        });

    }

    return null;

}


let cachedAudio = null;


function getAudio() {

    if (cachedAudio && cachedAudio.isConnected) {
        return cachedAudio;
    }

    cachedAudio =
        document.querySelector("audio") ||
        findPlayerElement(["audio"]);

    return cachedAudio;

}


function formatArtistText(text) {

    if (!text) {

        return "";

    }

    text =
        text
            .replace(/\s+/g, " ")
            .trim();


    if (text.includes("•")) {

        text =
            text
                .split("•")[0]
                .trim();

    }


    return text;

}


/* ==========================================================
   TRACK INFORMATION
========================================================== */

function getSongTitle() {

    const element =
        findElement([

            "ytmusic-player-bar .title",

            ".ytmusic-player-bar .title",

            "ytmusic-player-bar .content-info-wrapper .title",

            "#song-title"

        ]);


    return element
        ? element.textContent.trim()
        : "";

}


function getArtist() {

    const element =
        findElement([

            "ytmusic-player-bar .byline",

            ".ytmusic-player-bar .byline",

            "ytmusic-player-bar .content-info-wrapper .byline",

            "#byline"

        ]);


    return element
        ? formatArtistText(
            element.textContent
        )
        : "";

}


function getArtwork() {

    const element =
        findElement([

            "ytmusic-player-bar img",

            ".ytmusic-player-bar img",

            "ytmusic-player-bar .image img",

            "#song-image img"

        ]);


    if (!element) {

        return "";

    }


    return (
        element.currentSrc ||
        element.src ||
        element.getAttribute("src") ||
        ""
    );

}


/* ==========================================================
   SEND TRACK INFORMATION
========================================================== */

let lastTrackKey = "";


function sendTrackInfo() {

    const title =
        getSongTitle();

    const artist =
        getArtist();

    const artwork =
        getArtwork();


    if (
        !title &&
        !artist &&
        !artwork
    ) {

        return;

    }


    const trackKey =
        title +
        "|" +
        artist +
        "|" +
        artwork;


    if (
        trackKey ===
        lastTrackKey
    ) {

        return;

    }


    lastTrackKey =
        trackKey;


    sendToWidget(
        "track",
        {

            title:
                title ||
                "Your Music",

            artist:
                artist ||
                "YouTube Music",

            artwork:
                artwork

        }
    );

}


/* ==========================================================
   PLAYBACK INFORMATION
========================================================== */

function sendPlaybackState() {

    const audio =
        getAudio();


    if (!audio) {

        return;

    }


    sendToWidget(
        "playback",
        {

            playing:
                !audio.paused,

            currentTime:
                Number(
                    audio.currentTime || 0
                ),

            duration:
                Number(
                    audio.duration || 0
                )

        }
    );

}


/* ==========================================================
   AUDIO OBSERVER
========================================================== */

let observedAudio = null;


function observeAudio() {

    const audio =
        getAudio();


    if (!audio) {

        return;

    }


    if (
        observedAudio ===
        audio
    ) {

        return;

    }


    observedAudio =
        audio;


    audio.addEventListener(
        "play",
        function() {

            sendPlaybackState();

        }
    );


    audio.addEventListener(
        "pause",
        function() {

            sendPlaybackState();

        }
    );


    audio.addEventListener(
        "timeupdate",
        function() {

            sendPlaybackState();

        }
    );


    audio.addEventListener(
        "loadedmetadata",
        function() {

            sendPlaybackState();

        }
    );


    audio.addEventListener(
        "durationchange",
        function() {

            sendPlaybackState();

        }
    );


    sendPlaybackState();

}


/* ==========================================================
   PLAY / PAUSE
========================================================== */

function togglePlayPause() {

    const audio =
        getAudio();


    if (!audio) {

        return;

    }


    if (audio.paused) {

        audio.play()
            .catch(
                function(error) {

                    console.log(
                        "Play failed:",
                        error
                    );

                }
            );

    }

    else {

        audio.pause();

    }

}


/* ==========================================================
   NEXT TRACK
========================================================== */

function nextTrack() {

    const button =
        findPlayerElement([

            "ytmusic-player-bar #next-button",

            "#next-button",

            "ytmusic-player-bar .next-button",

            "ytmusic-player-bar tp-yt-paper-icon-button.next-button",

            ".next-button",

            'ytmusic-player-bar [aria-label*="Next" i]',

            '[aria-label*="Next" i]',

            '[title*="Next" i]'

        ]);


    if (button) {

        button.click();

        return true;

    }

    return false;

}


/* ==========================================================
   PREVIOUS TRACK
========================================================== */

function previousTrack() {

    const button =
        findPlayerElement([

            "ytmusic-player-bar #previous-button",

            "#previous-button",

            "ytmusic-player-bar .previous-button",

            "ytmusic-player-bar tp-yt-paper-icon-button.previous-button",

            ".previous-button",

            'ytmusic-player-bar [aria-label*="Previous" i]',

            '[aria-label*="Previous" i]',

            '[title*="Previous" i]'

        ]);


    if (button) {

        button.click();

        return true;

    }

    return false;

}


/* ==========================================================
   SEEK
========================================================== */

function seekToRatio(ratio) {

    const audio =
        getAudio();


    if (!audio) {

        return;

    }


    const duration =
        Number(
            audio.duration
        );


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        return;

    }


    const safeRatio =
        Math.max(
            0,
            Math.min(
                1,
                Number(ratio)
            )
        );


    audio.currentTime =
        duration *
        safeRatio;


    sendPlaybackState();

}


/* ==========================================================
   COMMANDS FROM PARENT WIDGET
========================================================== */

ipcRenderer.on(
    "command",
    function(
        _event,
        command
    ) {

        if (!command) {

            return;

        }


        if (
            command.type ===
            "toggle-play"
        ) {

            togglePlayPause();

        }


        if (
            command.type ===
            "next"
        ) {

            sendToWidget(
                "command-result",
                {
                    command: command.type,
                    success: nextTrack()
                }
            );

        }


        if (
            command.type ===
            "previous"
        ) {

            sendToWidget(
                "command-result",
                {
                    command: command.type,
                    success: previousTrack()
                }
            );

        }


        if (
            command.type ===
            "seek"
        ) {

            seekToRatio(
                command.ratio
            );

        }

    }
);


/* ==========================================================
   MUTATION OBSERVER
========================================================== */

let scanTimer = null;


function scheduleScan() {

    if (scanTimer) {

        clearTimeout(
            scanTimer
        );

    }


    scanTimer =
        setTimeout(
            function() {

                scanTimer =
                    null;

                observeAudio();

                sendTrackInfo();

                sendPlaybackState();

            },
            250
        );

}


const observer =
    new MutationObserver(
        function() {

            scheduleScan();

        }
    );


function startObserver() {

    if (!document.body) {

        return;

    }


    observer.observe(
        document.body,
        {

            childList: true,

            subtree: true,

            characterData: true

        }
    );

}


/* ==========================================================
   INITIALIZATION
========================================================== */

function initialize() {

    startObserver();

    observeAudio();

    sendTrackInfo();

    sendPlaybackState();

}


if (
    document.readyState ===
    "loading"
) {

    window.addEventListener(
        "DOMContentLoaded",
        function() {

            setTimeout(
                initialize,
                1000
            );

        }
    );

}

else {

    setTimeout(
        initialize,
        1000
    );

}


/* ==========================================================
   PERIODIC FALLBACK SCAN
========================================================== */

setInterval(
    function() {

        observeAudio();

        sendTrackInfo();

        sendPlaybackState();

    },
    2000
);