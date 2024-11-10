// ** Renderer Process:
// The renderer process is responsible for rendering web content(HTML, CSS, JavaScript) in
// each window and handles the user interface.Each window or tab runs its own renderer process,
// working similarly to a browser tab, and is sandboxed from the operating system.Renderer processes
// can use Node.js APIs if explicitly enabled(although it’s usually restricted for security reasons).

import { renderMarkdown } from './markdown';
import Elements from './elements';

window.api.onFileOpen((content: string) => {
  Elements.MarkdownView.value = content;
  Elements.ShowFileButton.disabled = false;
  Elements.OpenInDefaultApplicationButton.disabled = false;
  renderMarkdown(content);
});

Elements.MarkdownView.addEventListener('input', async () => {
  const markdown = Elements.MarkdownView.value;

  renderMarkdown(markdown);

  // Check for unsaved changes when the markdown view is updated
  const hasChanges = await window.api.checkForUnsavedChanges(
    markdown
  );

  Elements.SaveMarkdownButton.disabled = !hasChanges;
  Elements.RevertButton.disabled = !hasChanges;
});

Elements.OpenFileButton.addEventListener('click', () => {
  window.api.showOpenDialog();
});

Elements.ExportHtmlButton.addEventListener('click', () => {
  const html = Elements.RenderedView.innerHTML;
  window.api.showExportHtmlDialog(html);
});

Elements.SaveMarkdownButton.addEventListener('click', () => {
  const content = Elements.MarkdownView.value;
  window.api.saveFile(content);
});

Elements.ShowFileButton.addEventListener('click', () => {
  window.api.showInFolder();
});

Elements.OpenInDefaultApplicationButton.addEventListener(
  'click',
  () => {
    window.api.openInDefaultApplication();
  }
);

Elements.RevertButton.addEventListener('click', () => {
  const markdown = Elements.MarkdownView.value;
  window.api.revertChanges(markdown);
});

Elements.NewFileButton.addEventListener('click', () => {
  Elements.MarkdownView.value = '';
  Elements.RenderedView.innerHTML = '';
  Elements.ShowFileButton.disabled = true;
  Elements.OpenInDefaultApplicationButton.disabled = true;
  Elements.SaveMarkdownButton.disabled = true;
  Elements.RevertButton.disabled = true;

  window.api.saveFile('');
});

const getDraggedFile = (event: DragEvent) =>
  event.dataTransfer?.items[0];
const getDroppedFile = (event: DragEvent) =>
  event.dataTransfer?.files[0];

const fileTypeIsSupported = (file: DataTransferItem | File) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

document.addEventListener('dragstart', (event) => {
  event.preventDefault();
});

document.addEventListener('dragover', (event) => {
  event.preventDefault();
});

document.addEventListener('dragleave', (event) => {
  event.preventDefault();
});

document.addEventListener('drop', (event) => {
  event.preventDefault();
});

Elements.MarkdownView.addEventListener('dragover', (event) => {
  event.preventDefault();

  const draggedFile = getDraggedFile(event);

  if (draggedFile && fileTypeIsSupported(draggedFile)) {
    Elements.MarkdownView.classList.add('drag-over');
  } else {
    Elements.MarkdownView.classList.add('drag-error');
  }
});

Elements.MarkdownView.addEventListener('dragleave', () => {
  Elements.MarkdownView.classList.remove('drag-over');
  Elements.MarkdownView.classList.remove('drag-error');
});

Elements.MarkdownView.addEventListener('drop', (event) => {
  event.preventDefault();

  const droppedFile = getDroppedFile(event);

  if (droppedFile && fileTypeIsSupported(droppedFile)) {
    // Send the file path to the main process to read the file
    const filePath = droppedFile.path;
    window.api.openFile(filePath);
  } else {
    alert('Unsupported file type. Please drop a .txt or .md file.');
  }

  Elements.MarkdownView.classList.remove('drag-over');
  Elements.MarkdownView.classList.remove('drag-error');
});
