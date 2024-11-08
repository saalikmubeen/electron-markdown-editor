import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  Menu,
  type MenuItemConstructorOptions,
  clipboard,
  globalShortcut,
  Notification,
  Tray,
  nativeTheme,
} from 'electron';
import Positioner from 'electron-positioner';
import { readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';
// import "./crashReporter";

// user data path is used to store user data for the app such as settings, cache, etc.
// It can be used to store the sqlite database for the app, or any other data that the
// app needs to store for the user. Difference between app data path and user data path
// is that app data path is used to store data that is shared between all users on the
// computer, while user data path is used to store data that is specific to the user
// that is currently logged in on the computer.
const userDataPath = app.getPath('userData');
const dbPath = join(userDataPath, 'markdown-editor.sqlite');

/*
#title-bar {
    -webkit-app-region: drag;
    user-select: none;
}
*/

type MarkdownFile = {
  content: string;
  filePath: string;
};

const currentFile: MarkdownFile = {
  content: '',
  filePath: '',
};

let tray: Tray | null = null;

const setCurrentFile = (
  browserWindow: BrowserWindow,
  filePath: string,
  content: string
) => {
  currentFile.content = content;
  currentFile.filePath = filePath;

  // Set the title of the browser window(window that is displaying our app on the computer)
  // to the file path of the current file so that the user knows which file they are working on.
  browserWindow.setTitle(`${basename(filePath)} - Markdown Editor`); // ${app.name}

  // Set the represented filename of the window to the file path (MacOS specific)
  // (Little icon that appears in the title bar of the browser window on MacOS showing the file path)
  browserWindow.setRepresentedFilename(filePath);

  // Add the file path to the recent documents list (MacOS specific)
  app.addRecentDocument(filePath);
};

// If the current file has a filePath (meaning it has been saved before and it's not a new file),
// we save the content to the file path. Otherwise, we show the save dialog to get the file path
// from the user for the new file.
const getCurrentFile = async (browserWindow?: BrowserWindow) => {
  if (currentFile.filePath) return currentFile.filePath;

  if (!browserWindow) return;

  const filePath = showSaveDialog(browserWindow);

  return filePath;
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // minHeight: 400,
    // minWidth: 300,
    // maxHeight: 800,
    // maxWidth: 1200,
    maximizable: true,
    minimizable: true,
    // titleBarStyle: 'hidden', // This option is used to hide the title bar of the browser window
    // titleBarOverlay: true, // This option is used to overlay the title bar on top of the content of the browser window
    show: false,
    webPreferences: {
      nodeIntegration: false, // this option is used to enable or disable Node.js integration in the renderer process i.e the browser window can access Node.js APIs
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }

  // Once the browser window is ready to show i.e once the HTML has been loaded and
  // parsed in the browser window, we show the browser window and focus on it (to avoid
  // brief flash of white screen when the browser window is shown).
  mainWindow.once('ready-to-show', () => {
    // mainWindow.show();
    // mainWindow.focus();
  });

  // mainWindow.webContents.openDevTools({
  //   mode: 'detach',
  // });

  return mainWindow;
};

// This event is emitted after the app has been initialized and
// is ready to create browser windows.
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  let browserWindow: BrowserWindow | null = createWindow();

  // Emitted when the window is closed.
  browserWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    browserWindow = null;
  });

  // Tray is used to create a system tray icon for the app(for example, the icon that appears
  // in the system tray on the bottom right of the screen on Windows and the top right of the
  // screen on MacOS). The tray icon can be used to show the browser window when the user clicks
  // on the icon in the system tray.
  // (Up in the Menu Bar on MacOS, and down in the System Tray on Windows)
  // Icon for the tray is specified using the Tray class and the path to the icon file.
  // Use a grayscale icon ending with the suffix Template.png (e.g., iconTemplate.png). This file
  // naming convention tells macOS to treat the icon as a template image, allowing it to automatically
  // adjust the icon color for light and dark modes.This method saves you from having to create
  // separate icons for each mode. The grayscale requirement means the icon should only use shades
  // of gray.MacOS will change the icon to black or white depending on the background or mode (light or dark),
  // without requiring manual changes. This approach is particularly useful for icons that have
  // simple shapes without complex colors, as it avoids hardcoding color changes based on mode.
  tray = new Tray('./src/icons/firesaleTemplate.png');
  tray.setIgnoreDoubleClickEvents(true);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        browserWindow?.show();
        browserWindow?.focus();
      },
    },
    {
      label: 'Quit',
      role: 'quit',
    },
  ]);

  // Set the context menu for the tray icon so that when the user right clicks on the tray icon,
  // the context menu appears with the options specified in the context menu.
  // tray.setContextMenu(contextMenu);

  tray.on('right-click', () => {
    // Show the context menu when the user right clicks on the tray icon
    tray?.popUpContextMenu(contextMenu);
  });

  const positioner = new Positioner(browserWindow);

  tray.on('click', () => {
    if (!tray) return;

    // Check if the browser window is visible, if it is, hide the browser window
    if (browserWindow && browserWindow.isVisible()) {
      return browserWindow.hide();
    }

    // Calculate the position of the browser window based on the position of the tray icon
    // so that the browser window appears centered below the tray icon when the user clicks
    // on the tray icon.
    const trayPosition = positioner.calculate(
      'trayCenter',
      tray.getBounds()
    );

    // Set the position of the browser window to the calculated position so that the browser
    // window appears centered below the tray icon when the user clicks on the tray icon.
    browserWindow?.setPosition(trayPosition.x, trayPosition.y, false);

    // Else show the browser window and focus on it if it is not visible already.
    browserWindow?.show();
  });

  // Register a global shortcut to show the browser window when the user presses
  globalShortcut.register('CmdOrCtrl+Shift+F', () => {
    app.focus();
    browserWindow?.show();
    browserWindow?.focus();
  });

  globalShortcut.register('CmdOrCtrl+Shift+Alt+O', () => {
    // ** Clipboard API **
    let content = clipboard.readText();
    content = content.toUpperCase();
    clipboard.writeText(content);

    // ** Notification API **
    const notification = new Notification({
      title: 'Clipboard Text Converted',
      body: 'Clipboard text has been converted to uppercase',
    });
    notification.show();
  });
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('quit', () => {
  globalShortcut.unregisterAll();
});

const showOpenDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile'],
    buttonLabel: 'Open',
    title: 'Open File', // Title of the open dialog (Windows specific)
    filters: [
      { name: 'Markdown File', extensions: ['md'] },
      { name: 'Text File', extensions: ['txt'] },
    ],
  });

  if (result.canceled) return;

  const [filePath] = result.filePaths;

  openFile(browserWindow, filePath);
};

const openFile = async (
  browserWindow: BrowserWindow,
  filePath: string
) => {
  const content = await readFile(filePath, { encoding: 'utf-8' });

  // On open, we update the current file with the new content and file path
  // because when we open a file, we have a an already existing file path and content.
  setCurrentFile(browserWindow, filePath, content);

  browserWindow.webContents.send('file-opened', content, filePath);
};

const showExportHtmlDialog = async (
  browserWindow: BrowserWindow,
  html: string
) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Export HTML',
    filters: [{ name: 'HTML File', extensions: ['html'] }],
  });

  if (result.canceled) return;

  const { filePath } = result;

  if (!filePath) return;

  exportHtml(filePath, html);
};

const exportHtml = async (filePath: string, html: string) => {
  await writeFile(filePath, html, { encoding: 'utf-8' });
};

ipcMain.on('show-open-dialog', (event) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  showOpenDialog(browserWindow);
});

ipcMain.on('show-export-html-dialog', async (event, html: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  showExportHtmlDialog(browserWindow, html);
});

ipcMain.on('open-file', async (event, filePath: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  openFile(browserWindow, filePath);
});

const showSaveDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Save File',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'Markdown File', extensions: ['md'] }],
  });

  if (result.canceled) return;

  const { filePath } = result;

  if (!filePath) return;

  return filePath;
};

const saveFile = async (
  browserWindow: BrowserWindow,
  content: string
) => {
  const filePath = await getCurrentFile(browserWindow);

  if (!filePath) return;

  await writeFile(filePath, content, { encoding: 'utf-8' });

  // On save, we update the current file with the new content and file path
  setCurrentFile(browserWindow, filePath, content);
};

ipcMain.on('save-file', async (event, content: string) => {
  // BrowserWindow.getFocusedWindow()
  // Get the browser window from the event sender (the renderer process that sent the message)
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  // event.reply can be used to send a message back to the renderer process that sent the message
  // to the main process. This is alternative to using BrowserWindow.fromWebContents(event.sender)
  // to get the browser window that sent the message to the main process and then sending a message
  // back to the browser window.
  // event.reply('file-saved', currentFile.filePath);

  if (!browserWindow) return;

  await saveFile(browserWindow, content);
});

const hasChanges = (content: string) => {
  return content !== currentFile.content;
};

// Difference between ipcMain.handle and ipcMain.on is that ipcMain.handle is used to handle
// synchronous messages from the renderer process, while ipcMain.on is used to handle
// asynchronous messages from the renderer process. Meaning that ipcMain.handle is used when
// the renderer process is expecting a return value from the main process, while ipcMain.on is
// used when the renderer process is not expecting a return value from the main process.
ipcMain.handle('has-changes', (event, content: string) => {
  const changed = hasChanges(content);

  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  // Set the document edited status of the browser window to true if there are unsaved changes
  browserWindow?.setDocumentEdited(changed);

  // Set the title of the browser window to indicate that there are unsaved changes
  if (changed) {
    // check if the title of the browser window already contains the Edited suffix
    if (!browserWindow?.getTitle().endsWith('(Edited)')) {
      browserWindow?.setTitle(
        `${browserWindow?.getTitle()} (Edited)`
      );
    }
  } else {
    // If there are no unsaved changes, remove the Edited suffix from the title of the browser window
    browserWindow?.setTitle(
      browserWindow?.getTitle().replace('(Edited)', '')
    );
  }

  return changed;
});

ipcMain.on('revert-changes', async (event, newMarkdown: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  const changes = await hasChanges(newMarkdown);

  if (changes) {
    const response = dialog.showMessageBoxSync(browserWindow, {
      type: 'question',
      message:
        'You have unsaved changes. Are you sure you want to revert?',
      buttons: ['Yes', 'No'],
    });

    if (response === 1) return;
  }

  browserWindow.webContents.send(
    'revert-changes',
    currentFile.content
  );
});

ipcMain.on('show-in-folder', async (event) => {
  const { filePath } = currentFile;

  if (!filePath) return;

  // Show the file in the folder in the system file manager where the file
  // actually exists on the computer.
  await shell.showItemInFolder(filePath);
});

ipcMain.on('open-in-default-application', async (event) => {
  const { filePath } = currentFile;

  if (!filePath) return;

  // Open the file in the default application for the file type
  await shell.openPath(filePath);
});

ipcMain.on('write-to-clipboard', (event, content: string) => {
  clipboard.writeText(content);
});

ipcMain.on('read-from-clipboard', (event) => {
  event.reply('read-from-clipboard', clipboard.readText());
});

// You are on the hook for creating your own application menu if we replace
// the default application menu with a custom application menu. But all the
// component pieces are still lying around for you with all of the native OS
// functionality built in so that you don't have to reimplement it.
// https://www.electronjs.org/docs/latest/api/menu-item#roles
const template: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        accelerator: 'CmdOrCtrl+O', // Keyboard shortcut
        click: (_, browserWindow) => {
          // FIrst check if the browser window exists, if it doesn't create a new browser window
          // for my app
          if (!browserWindow) browserWindow = createWindow();
          // And then show the open dialog to open a file in the browser window created above.
          showOpenDialog(browserWindow);
        },
      },
      {
        label: 'Save File',
        // Accelerator is used to assign a keyboard shortcut to a menu item so that the user
        // can use the keyboard shortcut to trigger the menu item instead of using the mouse.
        // Accelerators work from within the application when the application is in focus and
        // not from outside the application (for that you would need to use global shortcuts).
        accelerator: 'CmdOrCtrl+S',
        click: (_, browserWindow) => {
          if (!browserWindow) browserWindow = createWindow();

          browserWindow.webContents.send('save-file-from-menu');
        },
      },
      {
        label: 'Save HTML',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: (_, browserWindow) => {
          if (!browserWindow) browserWindow = createWindow();

          browserWindow.webContents.send('save-html-from-menu');
        },
      },
    ],
  },
  // Role is used to assign a predefined role to a menu item so that you don't have to
  // reimplement the already existing functionality of the role in the menu item.
  { label: 'Edit', role: 'editMenu' },
  { label: 'View', role: 'viewMenu' },
  { label: 'Window', role: 'windowMenu' },
];

if (process.platform === 'darwin') {
  // Mac OS expects first menu to be the app name.
  template.unshift({
    label: app.name,
    // role: "appMenu",
    submenu: [
      { label: `About ${app.name}`, role: 'about' },
      { label: 'Quit', role: 'quit' },
    ],
  });
}

const applicationMenu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(applicationMenu);
