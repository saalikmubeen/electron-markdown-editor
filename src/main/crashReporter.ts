// Import this file in both the main and renderer process to enable crash reporting
// and sending uncaught exceptions to a server.

import { crashReporter } from 'electron';

// This is the URL of the server where the crash reports will be sent
const host = 'http://localhost:3000';

const config = {
  productName: 'Markdown Editor',
  companyName: 'Markdown Editor Inc.',
  submitURL: `${host}/crashreports`,
  uploadToServer: true,
};

crashReporter.start(config);

function sendUncaughtExceptionReport(error: Error) {
  const body = {
    error: {
      name: error.name,
      message: error.message,
      // fileName: error.fileName,
      // lineNumber: error.lineNumber,
      // columnNumber: error.columnNumber,
      stack: error.stack,
    },
    productName: config.productName,
    companyName: config.companyName,
    // version: "",
    platform: process.type, // In main process, this will be "browser" and in renderer process, this will be "renderer"
    date: new Date(),
  };

  fetch(`${host}/uncaughtexceptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// In main process, the process.type will be "browser" and in renderer process, it will be "renderer"
if (process.type === 'browser') {
  process.on('uncaughtException', (error: Error) => {
    sendUncaughtExceptionReport(error);
  });
} else {
  window.addEventListener('error', (event) => {
    sendUncaughtExceptionReport(event.error);
  });
}

console.log('[INFO] Crash reporting started.', crashReporter);

export default crashReporter;

// * Server code for receiving crash reports
/*
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const writeFile = require('write-file');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));

const crashesPath = path.join(__dirname, 'crashes');
const exceptionsPath = path.join(__dirname, 'uncaughtexceptions');

const upload = multer({
  dest: crashesPath,
}).single('upload_file_minidump');

app.post('/crashreports', upload, (request, response) => {
  const body = {
    ...request.body,
    filename: request.file.filename,
    date: new Date(),
  };
  const filePath = `${request.file.path}.json`;
  const report = JSON.stringify(body);

  writeFile(filePath, report, error => {
    if (error) return console.error('Error Saving', report);
    console.log('Crash Saved', filePath, report);
  });

  response.end();
});

app.post('/uncaughtexceptions', (request, response) => {
  const filePath = path.join(exceptionsPath, `${uuid()}.json`);
  const report = JSON.stringify({ ...request.body, date: new Date() });

  writeFile(filePath, report, error => {
    if (error) return console.error('Error Saving', report);
    console.log('Exception Saved', filePath, report);
  });

  response.end();
});

server.listen(3000, () => {
  console.log('Crash report server running on Port 3000.');
});

*/
