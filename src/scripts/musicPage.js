require('../scripts/dbConnection');
var db = firebase.firestore();
var emailVal = "";
const {ipcRenderer} = require('electron');

var connect = document.getElementById("connectBtn");

// open Spotify Server
connect.addEventListener("click", () => {
    require("electron").shell.openExternal('http://localhost:8888/login');
});