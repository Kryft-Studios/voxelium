import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("loadingAPI", {
    stop: () => ipcRenderer.send("loading-stop")
});