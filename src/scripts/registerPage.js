require('../scripts/dbConnection');
//notifications
const notifier = require('node-notifier');
const path = require('path'); //going to use this to replace the icon later
var signupBtn = document.getElementById("submitBtn");
var db = firebase.firestore();


signupBtn.addEventListener('click', function()
{
    console.log("clicked");
    var emailField = document.getElementById("inputEmail3").value;
    var passField = document.getElementById("inputPassword3").value;
    var nameField = document.getElementById("inputUsername3").value;

    firebase.auth().createUserWithEmailAndPassword(emailField, passField)
    .then(function(){
        // Add a new document in collection "users"
        db.collection("users").doc(emailField).set({
            name: nameField,
            portalLink: "https://cap.mcmaster.ca/mcauth/login.jsp?app_id=1505&app_name=Avenue",
            prevBreakAvg: 0,
            prevStudyAvg: 0,
            reminders: 0,
            remindersList: {},
            studyTimeTrackers: {},
        })
        .then(function() {
            console.log("Document successfully written!");
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
        let successFlash = document.getElementById("successMsg");
        successFlash.classList.remove("hidden");
        document.location.href = "../pages/loginPage.html";
    })
    .catch(function(error){
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
    })
});