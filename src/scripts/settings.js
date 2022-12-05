// manage app settings 
require('../scripts/dbConnection');
var db = firebase.firestore();
const {ipcRenderer} = require('electron');

// request user info from backend
let username;
let emailVal;

ipcRenderer.invoke('getUser')
.then((result) => {
    emailVal = result.currName;
    //search for username via email address from the firebase cloud storage
    return username = db.collection("users").doc(emailVal);
})
.then (username => {
    return username.get()
})
.then(function(doc) {
    if (doc.exists){
        document.getElementById("inputUsername3").value = doc.data().name;
        document.getElementById("inputSchool").value = doc.data().portalLink;
    }
    else
        console.log("No such document!");
})
.catch(function(error) {
    console.log("Error getting document:", error);
});

let save = document.getElementById("submitBtn");

// update database with changes
save.addEventListener("click", ()=> {
    newName = document.getElementById("inputUsername3").value;
    portalLink = document.getElementById("inputSchool").value;
    try {
        db.collection("users").doc(emailVal).update({name: newName, portalLink: portalLink});
        //show success msg
        document.getElementById("successMsg").classList.remove("hidden");
        document.getElementById("errorMsg").classList.add("hidden");
    } catch {
        //show error msg
        document.getElementById("successMsg").classList.add("hidden");
        document.getElementById("errorMsg").classList.remove("hidden");
    }
    
});