require('../scripts/dbConnection');
var db = firebase.firestore();
const {ipcRenderer} = require('electron');

//notifications
const notifier = require('node-notifier');
const path = require('path'); //going to use this to replace the icon later

var loginBtn = document.getElementById("submitBtn");
var loadingIcon = document.getElementById("loadingIcon");

loginBtn.addEventListener('click', function()
{
    loadingIcon.classList.remove("hidden");
    var emailField = document.getElementById("inputEmail3").value;
    var passField = document.getElementById("inputPassword3").value;

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function()
    {
        return firebase.auth().signInWithEmailAndPassword(emailField, passField)
        .then(function()
        {
            var user = firebase.auth().currentUser;

            //send info to backend
            ipcRenderer.send('sendUserInfo', user);
            let successFlash = document.getElementById("successMsg");
            successFlash.classList.remove("hidden");

            return window.location = "../pages/mainWindow.html";
        })
        .catch(function(error) 
        {
            loadingIcon.classList.add("hidden");
            if(error)
            {
                let errorFlash = document.getElementById("errorMsg");
                errorFlash.classList.remove("hidden");
                if (error.message == 'The password is invalid or the user does not have a password.') {
                    errorFlash.innerHTML = '❌ Incorrect Password!';
                } else if (error.message == 'The email address is badly formatted.') {
                    errorFlash.innerHTML = '❌ Invalid email format!';
                } else {
                    errorFlash.innerHTML = '❌ '+error.message;
                }
            }
        });
    })
    .catch(function(error)
    {
        loadingIcon.classList.add("hidden");
        console.log(error);
    });
});