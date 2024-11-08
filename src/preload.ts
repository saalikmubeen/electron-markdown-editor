import { ipcRenderer, contextBridge } from 'electron';
import Elements from './renderer/elements';
import { renderMarkdown } from './renderer/markdown';

/*
ipcRenderer.on('file-opened', (_, content: string) => {
  // const MarkdownView = document.getElementById('markdown-view') as HTMLTextAreaElement;
  // MarkdownView.value = content;

  Elements.MarkdownView.value = content;
  renderMarkdown(content);
});
*/

// Listen for the 'save-file-from-menu' event from the main process
// This event is fired when the user selects the Save menu item from the File menu
// in the main process. When this event is fired, we will get the markdown content
// from the MarkdownView element and send it to the main process so that it can
// save the file.
ipcRenderer.on('save-file-from-menu', () => {
  const markdown = Elements.MarkdownView.value;

  ipcRenderer.send('save-file', markdown);
});

ipcRenderer.on('revert-changes', (_, content: string) => {
  Elements.MarkdownView.value = content;
  renderMarkdown(content);
});

// Save the HTML content to a file from the Menu
ipcRenderer.on('save-html-from-menu', () => {
  const html = Elements.RenderedView.innerHTML;
  ipcRenderer.send('show-export-html-dialog', html);
});

contextBridge.exposeInMainWorld('api', {
  onFileOpen: (callback: (content: string) => void) => {
    ipcRenderer.on('file-opened', (_, content: string) => {
      callback(content);
    });
  },

  showOpenDialog: () => {
    ipcRenderer.send('show-open-dialog');
  },
  showExportHtmlDialog: (html: string) => {
    ipcRenderer.send('show-export-html-dialog', html);
  },

  openFile: (filePath: string) => {
    ipcRenderer.send('open-file', filePath);
  },

  revertChanges: (newMarkdown: string) => {
    ipcRenderer.send('revert-changes', newMarkdown);
  },

  // Expose the saveFile function to the renderer process via the context bridge
  // So in the renderer process, we can call window.api.saveFile(content) to
  // send a message to the main process to save the file.
  saveFile: (content: string) => {
    ipcRenderer.send('save-file', content);
  },

  checkForUnsavedChanges: async (content: string) => {
    // Difference between invoke and send:
    // - invoke is used for synchronous communication between the main and renderer process
    // - send is used for asynchronous communication between the main and renderer process
    // Meaning, invoke will wait for the main process to return a value before continuing
    // while send will not wait for the main process to return a value before continuing
    // and will not return a value. Send is used for one-way communication from the renderer
    // process to the main process, and is fire and forget.
    const result = await ipcRenderer.invoke('has-changes', content);
    return result;
  },

  showInFolder: () => {
    ipcRenderer.send('show-in-folder');
  },

  openInDefaultApplication: () => {
    ipcRenderer.send('open-in-default-application');
  },
});

const api = {} as const;

// contextBridge.exposeInMainWorld('api', api);

// Dynamic type for the API object
export type API = typeof api;