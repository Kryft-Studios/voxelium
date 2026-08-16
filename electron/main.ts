import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as pathTools from "node:path"
import { existsSync, mkdirSync, rmdirSync, rmSync, writeFileSync } from 'node:fs'

// we are in dist-electron/main.js
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// app root
process.env.APP_ROOT = path.join(__dirname, '..')
console.log(__dirname)
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST
export const IS_DEV = !!VITE_DEV_SERVER_URL;
function loadHTML(window: BrowserWindow,
  /**Relative to dist */
  path: string) {
  if (IS_DEV) {
    window.loadURL(`${VITE_DEV_SERVER_URL}/${path}`);
  } else {
    window.loadFile(pathTools.join(RENDERER_DIST, `${path}.html`))
  }
};
function getPath(path: string, prefix: string = "html"){
    return `${IS_DEV? VITE_DEV_SERVER_URL:RENDERER_DIST}/${path}${IS_DEV?"":`.${prefix}`}`
}
function getImageAsset(path: string){
  return getPath(path, "png")
}
// predef so GC doesnt eat it like a monster
let win!: BrowserWindow
let loadingWin!: BrowserWindow;

async function main() {
  try {
    let rejectExtraTime!: ()=>any;
    await Promise.all([new Promise(async (resolve, reject) => {

      // HERE GOES ALL THE LOADING STUFF
      // ---------------------------------------
      loadingWin = new BrowserWindow({
        // remove title bar ----
        titleBarOverlay: false,
        frame: false,
        icon: path.join(process.env.VITE_PUBLIC, 'VoxeliumLogo.png'),
        // make it small ----
        width: 600,
        height: 300,

        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        }
      })
      loadHTML(loadingWin, "loading");

      await new Promise<void>((resolve) => {
        loadingWin.webContents.once("did-finish-load", () => {
          resolve();
        });
      });
      ipcMain.addListener("loading-stop",()=>{rejectExtraTime()})
      // LOADING 1 ----- bloxd tpack
      if (!existsSync(path.join(UData, "bloxdTexturePack"))) {

        // inform the user via GUI
        loadingWin.webContents.executeJavaScript(`
        document.querySelector(".status").innerText = "Download bloxd texture pack.."`)


        // make the directory in appdata, normally AppData/Roaming/voxeliumbgm
        //(depends on OS)
        mkdirSync(path.join(UData, "bloxdTexturePack"));

        // use Github TREE API to fetch all blocks in the default texture pack in bloxd.
        let strings: { path: string, mode: string, type: string, sha: string, size: number, url: string }[] = (await (
          (await fetch(
            "https://api.github.com/repos/Bloxdy/texture-packs/git/trees/main?recursive=1"
          )).json())).tree.filter(
            (a: { path: string, mode: string, type: string, sha: string, size: number, url: string }) =>

              // use simple Regexp to detect if its a block
              // many false positives will come, but we have used a simple regexp here to avoid too much time taken
              (/default\/textures\/[a-z_]+\.png/).test(a.path)
          );
        // max concurrent downloads
        const CONCURRENCY = 12;

        // handle abortion
        let stopped = false;
        const abortController = new AbortController();

        const stopHandler = () => {
          stopped = true;
          abortController.abort();
          rmSync(pathTools.join(
            UData,
            "bloxdTexturePack"
          ), {
            "recursive": true,
            "force":true 
          })
        };

        ipcMain.once("loading-stop", stopHandler);

        try {
          for (let i = 0; i < strings.length && !stopped; i += CONCURRENCY) {
            // get the urls in the batch we're doing
            const batch = strings.slice(i, i + CONCURRENCY);

            // ui
            loadingWin.webContents.executeJavaScript(`
      setProgress(${i}, ${strings.length}, "Download bloxd texture pack.. (parallel 12 downloads)")
    `);
            // now do the fetch's
            await Promise.all(
              batch.map(async (texture) => {
                // return if aborted
                if (stopped) return;

                const rawURL =
                  `https://raw.githubusercontent.com/Bloxdy/texture-packs/main/${texture.path}`;

                const response = await fetch(rawURL, {
                  signal: abortController.signal
                });

                // if aborted return
                if (stopped) return;
                const data = await response.arrayBuffer();
                if (stopped) return;
                // write
                writeFileSync(
                  pathTools.join(
                    UData,
                    "bloxdTexturePack",
                    pathTools.basename(texture.path)
                  ),
                  new DataView(data)
                );
              })
            );
          }
        } catch (err) {
          if (stopped) {
            console.log("Texture download cancelled.");
          } else {
            throw err;
          }
        } finally {
          rejectExtraTime()
          ipcMain.removeListener("loading-stop", stopHandler);
        }
      }

      // done!
      resolve("done")
    }), new Promise((resolve,reject) => {
      // Minimum timeout
      rejectExtraTime = reject;
      setTimeout(resolve, 5000)
    })])
  } catch (e) {
    loadingWin?.close();
    return;
  }
  loadingWin?.close()

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'VoxeliumLogo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
    "modal": true,
    "title": "Voxelium Game Maker"
  })
  win.blur()
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })
  win.webContents.on("did-create-window", (window, detail) => {
    window.webContents.on("did-finish-load", () => {
      if (window.getTitle() === "VX Game Maker") {
        let saving = false;
        window.on("close", async (event) => {
          if (saving) return;
          event.preventDefault();
          saving = true;
          await window.webContents.executeJavaScript(`WT.saveAllChunks()`);
          window.destroy()
        })
      }
    })
  })
  loadHTML(win,"index");
}
const UData = app.getPath("userData")
console.log(UData)
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    //@ts-ignore
    win = null
  }
})
app.on("browser-window-created", (event, window) => {
  window.setIcon( path.join(process.env.VITE_PUBLIC, 'VoxeliumLogo.png'))
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    main()
  }
})
app.whenReady().then(main)
