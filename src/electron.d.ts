/// <reference types="vite/client" />
/// <reference types="electron" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare interface Window {
  api: {
    onFileOpen: (
      callback: (content: string, filePath: string) => void
    ) => void;
    showOpenDialog: () => void;
    showExportHtmlDialog: (html: string) => void;
    openFile: (filePath: string) => void;
    saveFile: (content: string) => void;
    checkForUnsavedChanges: (content: string) => Promise<boolean>;
    revertChanges: (newMarkdown: string) => void;
    showInFolder: () => void;
    openInDefaultApplication: () => void;
  };

  // Dynamic typing for the API object
  // api: import("./preload").API;
}
