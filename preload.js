const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

    // Set exact window size
    resizeWindow: (width, height) => {
        ipcRenderer.send("resize-widget", {
            width: width,
            height: height
        });
    },

    // Resize window while dragging the resize handle
    resizeWindowByDelta: (deltaWidth, deltaHeight) => {
        ipcRenderer.send("resize-window-delta", {
            deltaWidth: deltaWidth,
            deltaHeight: deltaHeight
        });
    },

    // Minimize Electron window
    minimizeWindow: () => {
        ipcRenderer.send("minimize-window");
    },

    // Close Electron window
    closeWindow: () => {
        ipcRenderer.send("close-window");
    },

    loadTasks: () => {
        return ipcRenderer.invoke("load-tasks");
    },

    saveTasks: (tasks) => {
        return ipcRenderer.invoke("save-tasks", tasks);
    }

});