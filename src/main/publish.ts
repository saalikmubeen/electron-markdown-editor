/*

To build the electron app with the electron-packager package, add the following
script to the package.json file:




"scripts": {
    "start": "electron .",
    "build": "npm run build-mac && npm run build-win && npm run build-linux",
    "build-mac": "electron-packager . --platform=darwin --out=build --icon=./icons/Icon.icns --asar --overwrite",
    "build-win": "electron-packager . --platform=win32 --out=build --icon=./icons/Icons.ico --asar --overwrite",
    "build-linux": "electron-packager . --platform=linux --out=build --icon=./icons/Icons.png --asar --overwrite",
    "test": "echo \"Error: no test specified\" && exit 1"
},


All this is build into the electron-forge package, so you don't have to worry about it.
electron-forge uses the electron-packager package to build the app under the hood.

*/
