import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as pathTools from "node:path"
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { interval, promisifyEventListener } from '../common/promises'
import { logLines } from '../common/logLines'

// we are in dist-electron/main.js
const DIRNAME = path.dirname(fileURLToPath(import.meta.url))

// app root
process.env.APP_ROOT = path.join(DIRNAME, '..')

// DRI
const APPRT = process.env.APP_ROOT;

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(APPRT, 'dist-electron')
export const RENDERER_DIST = path.join(APPRT, 'dist')
export const IS_DEV = !!VITE_DEV_SERVER_URL;
const USER_DATA_FOLDER = app.getPath("userData")
console.log(USER_DATA_FOLDER)
// where vite stuff lives
process.env.VITE_PUBLIC = IS_DEV ? path.join(APPRT, 'public') : RENDERER_DIST

logLines(
  `AppRoot: ${APPRT}`,
  `ViteDevServerURL (If any): ${VITE_DEV_SERVER_URL}`,
  `Me (electron-dist) ${MAIN_DIST}`,
  `CompiledCodeDist (if any): ${RENDERER_DIST}`,
  `DevMode: ${IS_DEV}`,
  `Vite: ${process.env.VITE_PUBLIC}`
);
/**
 *  Loads a HTML Page
 * 
 * If vite -> loads dev server URL
 * If local -> loads dist file
 */
function loadHTML(window: BrowserWindow,
  /**Relative to project root */
  path: string) {

  // if dev mode, use loadURL. this is because the code is hosted on the localhost:5173 by vite rn.
  // if not, use the compiled file
  window[IS_DEV ? "loadURL" : "loadFile"](getPath(path, "html"))
};
/** Small helper to get path regardless of if built */
function getPath(path: string, prefix: string = "html") {
  return `${IS_DEV ? VITE_DEV_SERVER_URL : RENDERER_DIST}/${path}${IS_DEV ? "" : `.${prefix}`}`
}

/**
 * Output from the Github TREE API.
 * 
 * GHTA has more stuff but only path is included here as its the only thing we need
 */
interface TREE_API_OUTPUT {

  /* the path relative to the repo fetched */
  path: string,
}

// predef so GC doesnt eat it like a monster
/** The main index window */
let win!: BrowserWindow
/** The loading screen window */
let loadingWin!: BrowserWindow;

/**
 * The main function.
 * 
 * This is like the main function in lower languages.
 */
async function main() {

  try {
    /**
     * used for cancelling minimum timeout if user clicks stop before its done
     */
    let rejectExtraTime!: () => any;
    // ----------------- HANDLE LOADING -----------------------
    await Promise.all(
      // promise 1 - the actual loading
      [
        new Promise(async (resolve, reject) => {

          // HERE GOES ALL THE LOADING STUFF
          // ---------------------------------------
          loadingWin = new BrowserWindow({
            // remove title bar ----
            titleBarOverlay: false,
            frame: false,

            // icon ----
            icon: path.join(process.env.VITE_PUBLIC, 'VoxeliumLogo.png'),

            // make it small ----
            width: 600,
            height: 300,

            // ONLY use this for this page, dont use on UNTRUSTED pages
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false,
            }
          })

          // load the 'loading.html' page
          loadHTML(loadingWin, "loading");
          // wait for the HTML to load
          /** Electron webcontents [THE HTML PAGE] event listener */
          const EV = loadingWin.webContents.once.bind(loadingWin.webContents);
          console.log("started loading", loadingWin.webContents.once.toString())
          try {
            await promisifyEventListener(EV, "did-finish-load")
          } catch (e) {
            console.log("uh oh", JSON.stringify(loadingWin.webContents.once))
          }
          console.log("finished loading")
          // When user clicks loading stop, stop loading and also stop the extra time if the user clicked before it
          ipcMain.addListener("loading-stop", () => { rejectExtraTime(); reject() })

          async function fail(message: string, stopFn: Function) {
            console.error(message);
            // tell the user about the error
            loadingWin.webContents.executeJavaScript(`setProgress(0, 10, "Failed: ${message} (10s)");`);
            // fetch user's attention 
            loadingWin.flashFrame(true);

            // show progress visually
            await interval(10, 1000, (timesDone) => {
              loadingWin.webContents.executeJavaScript(`setProgress(${timesDone}, 10, "Failed: ${message} (${10 - timesDone}s)")`)
            });

            loadingWin.webContents.executeJavaScript(`setStopped()`)
            await stopFn()

            // now destroy the whole parent promise
            reject()
          }

          // LOADING 1 ----- bloxd tpack
          if (!existsSync(pathTools.join(USER_DATA_FOLDER, "bloxdTexturePack"))) {

            // inform the user via GUI
            loadingWin.webContents.executeJavaScript(`setProgress(0,1,"Starting to download the bloxd texture pack")`)
            console.log("Begin downloading bloxd texture pack")

            // use Github TREE API to fetch all blocks in the default texture pack in bloxd.
            console.log("Fetching files from Bloxdy/texture-api via Github Tree API")

            /** the filtered output from the Bloxdy/texture-api repo*/
            let strings!: TREE_API_OUTPUT[]

            /** The response from the attempt to fetch */
            let fetchResponse!: Response;
            /** A function to try to fetch the github tree api contents. throw error =fail */
            async function tryFetch() {

              // throws error if fetch throws error
              // throws error if response not OK
              !(
                fetchResponse = await fetch("https://api.github.com/repos/Bloxdy/texture-packs/git/trees/main?recursive=1")
              ).ok ?
                // IIFE to fail
                (() => { throw "" })() :
                // nothing
                void 0
            }
            try {
              await tryFetch()
            } catch (e) {
              /**  retries */
              const MAX_RETRY = 10;

              /**  times retried */
              let counter = 0;

              /** Whether the retries were successful */
              let success = false;
              while (++counter <= MAX_RETRY) {
                try {
                  await tryFetch();

                  // no error = success
                  success = true;
                  break;
                } catch { }
              }

              // the user prob has no internet or bad internet
              if (!success) {
                // GUI
                await fail("Failed to fetch the bloxd api contents using GitHub TREE API [Retried 10 times]. You may be offline.", new Function());
                return;
              }
            }
            try {
              strings = (
                await (
                  fetchResponse.json()
                    .then((a:
                      // github gives much more but we are just using this because this is all we need
                      { tree: TREE_API_OUTPUT[] }
                    ) => {
                      // debug feedback
                      console.log(`Fetched ${a.tree.length} snake cased blocks`)
                      return a.tree;
                    }))
              ).filter(
                // get all the possible textures that may be used for blocks
                (a: TREE_API_OUTPUT) =>

                  // use simple Regexp to detect if its a block
                  // blocks are usually in format snake_case.png
                  // many false positives will come, but we have used a simple regexp here to avoid too much overhead
                  (/default\/textures\/[a-z_]+\.png/).test(a.path));
            } catch (e) {

            }
            console.log(`Filtered and got ${strings.length} textures that are possibly for blocks`);
            /** max concurrent downloads */
            const CONCURRENCY = 12;

            // make the directory in appdata, normally AppData/Roaming/voxeliumbgm
            //(depends on OS)
            // linux has smth else
            // usr/data/..?
            // linux users u can comment here :)
            // -----> []
            mkdirSync(pathTools.join(USER_DATA_FOLDER, "bloxdTexturePack"));

            // handle abortion
            /** JS AbortController. A hybrid, can be used by both user code and JS fetch */
            const ABORT_CONTROLLER=  new AbortController();

            /** A function that stops the fetching of bloxd texture packs */
            const STOP = () => {
              // abort all fetch signals
              ABORT_CONTROLLER.abort();

              // remove the file we're putting stuff to
              rmSync(pathTools.join(USER_DATA_FOLDER, "bloxdTexturePack"), {
                // flags to stop the OS from doing "dir not empty"
                "recursive": true,
                "force": true
              })
            };
            // if the user clicks the STOP button
            ipcMain.once("loading-stop", STOP);
            try {
              for (let i = 0; i < strings.length && !ABORT_CONTROLLER.signal.aborted; i += CONCURRENCY) {
                // get the urls in the batch we're doing
                /** The URLs to be fetched and written */
                const BATCH = strings.slice(i, i + CONCURRENCY);

                // ui
                loadingWin.webContents.executeJavaScript(`setProgress(${i}, ${strings.length}, "Download bloxd texture pack.. (parallel 12 downloads)")`);
                // now do the fetch's
                await Promise.all(
                  BATCH.map(async (texture) => {
                    // return if aborted
                    if (ABORT_CONTROLLER.signal.aborted) return;

                    // use the github RAW CONTENT API (raw.githubusercontent.com)
                    const URL = `https://raw.githubusercontent.com/Bloxdy/texture-packs/main/${texture.path}`;

                    /** Response from the github raw content api */
                    let response!: Response;
                    async function tryFetch() {
                      !(response = await fetch(URL, {
                        // abortion signal
                        signal: ABORT_CONTROLLER.signal
                      })).ok ?
                        // IIFE to jump to the catch block if response not OK
                        (() => { throw "" })() :
                        // else do nothing
                        void 0;
                    }
                    try {
                      // try fetching normally
                      // not to be confused with the tryFetch in the github tree api fetch test
                      await tryFetch()
                    } catch (e) {

                      // if the fetching failed, attempt retry
                      // max retries
                      const MAX_RETRY = 5;
                      let counter = 0;
                      let success = false;
                      // increment in the check itself
                      // ++ is pre increment hencefore the new value is used
                      while (++counter <= MAX_RETRY) {
                        try {
                          // try fetch
                          // from our impl, if anything bad happens (not OK or err), it will jump to catch
                          await tryFetch();
                          // this means success. break out of this NOW.
                          success = true;
                          break
                        } catch (e) { }
                      }
                      if (!success) {
                        fail(`Tried to fetch ${URL} but failed [5 Retries]. You may not be connected to the internet.`, STOP)
                        return;
                      }
                    }

                    if (ABORT_CONTROLLER.signal.aborted) return;

                  const DATA = await response.arrayBuffer();
                    if (ABORT_CONTROLLER.signal.aborted) return;

                    // write
                    writeFileSync(pathTools.join(USER_DATA_FOLDER, "bloxdTexturePack", pathTools.basename(texture.path)), Buffer.from(DATA));
                  })
                );
              }
            } catch (err) {
              if (ABORT_CONTROLLER.signal.aborted) {
                fail("Texture Download Cancelled!", STOP)
              } else {
                throw err;
              }
            } finally {
              rejectExtraTime()
              ipcMain.removeListener("loading-stop", STOP);
            }
          }

          // done!
          resolve("done")
        }),
        // --------------------------------- Minimum Time ----------------------------------
        new Promise((resolve, reject) => {
          // Minimum timeout
          rejectExtraTime = reject;
          setTimeout(resolve, 5000)
        })])
  } catch (e) {

    // close & RETURN
    loadingWin?.close();
    return;
  }
  // close & CONTINUE
  loadingWin?.close()

  // make the main index.html window
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'VoxeliumLogo.png'),
    /**
     * {@link ./preload.ts}
     */
    webPreferences: {
      preload: path.join(DIRNAME, 'preload.mjs'),
    },
    "fullscreenable": true,
    "title": "Voxelium Game Maker",
    "autoHideMenuBar": true
  })

  // load the  actual page now
  loadHTML(win, "index");
  win.blur()
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })
  win.webContents.on("did-create-window", (window) => {
    // wait for this new window to load
    console.log("hi")
    window.webContents.on("did-finish-load", () => {
      // if its the vx game maker i.e. the main NOA pge
      if (window.getTitle() === "VX Game Maker") {

        // handle saving
        let saving = false;
        window.on("close", async (event) => {
          // if the os already warned then tell it to shu the fuh up
          if (saving) return event.preventDefault();
          event.preventDefault();
          saving = true;
          await window.webContents.executeJavaScript(`WT.saveAllChunks()`);
          window.destroy();
        })
      }
    })
  })
}

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

// SET ICON
app.on("browser-window-created", (_, window) => {
  window.setIcon(path.join(process.env.VITE_PUBLIC, 'VoxeliumLogo.png'))
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    main()
  }
})

app.whenReady().then(main)
