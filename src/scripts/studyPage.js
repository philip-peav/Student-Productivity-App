var startTime = 0; // this value will change depending on what the user selects, default value is 25:00
var time = startTime * 60; //number of seconds total
var totalStudiedTime = 0; 
//var studiedTime = totalStudiedTime * 60;
var totalBreakTime = 0;
//var breakTime = totalBreakTime * 60;
var width = 0;

//this value is for creating 1 percent of the progress bar
// multiply and divide by 10 to avoid floating point error (check April 2, 2020 NOTE in google doc for more info)
var onePercent; 

//IDs used for setInterval for the pomodoro timer and study/break time trackers
var intervalID; 

//toggle between time when studying and time when on break (check March 30, 2020 NOTE in google doc for more info)
var studying = 2; 

//toggle the on/off state for alerts (1 = on, 0 = off)
var toggleAlarm = 1;
var toggleNotification = 1;

//used to indicate when the reset function is called
//this is needed to prevent incrementing the study/break time trackers when selecting study/break lengths
//more detail found in May 3rd NOTE
var resetTimerClicked = 0;

//setting info to be changed from html document
var pomodoroTimer = document.getElementById('pomodoro-timer');
var taskMessage = document.getElementById('dropdownMenuButton');
var breakMessage = document.getElementById('dropdownMenuButton2');
var startButton = document.getElementById('startButton');
var pauseButton = document.getElementById('stopButton');
var timeStudied = document.getElementById('timeStudied');
var timeOnBreak = document.getElementById('timeOnBreak');
var progressBar = document.getElementById("myBar");

//notifications
const notifier = require('node-notifier');

//db instance
require('../scripts/dbConnection');
var db = firebase.firestore();
const {ipcRenderer} = require('electron');


// request user info from backend
let username;
let emailVal;
// use for whenever a reset is needed in testing only
let daysOfWeek = ['13 May 2020','14 May 2020','15 May 2020','16 May 2020','17 May 2020','18 May 2020'];

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
        
        studyTimerDB = doc.data().studyTimeTrackers;

        // one time use, delete after - too lazy to create the schema model in the firebase console LOL
        // for (day in daysOfWeek) {
        //     studyTimerDB[daysOfWeek[day]] = {
        //         study: 0, 
        //         break: 0
        //     }
        //     db.collection("users").doc(emailVal).update({studyTimeTrackers: studyTimerDB})
        // }

        totalStudiedTime = studyTimerDB[dayName].study;
        totalBreakTime = studyTimerDB[dayName].break;
        
        let studiedMinutes = Math.floor(totalStudiedTime/60);
        let studiedSeconds = totalStudiedTime % 60;
    
        studiedMinutes = studiedMinutes < 10 ? '0' + studiedMinutes : studiedMinutes;
        studiedSeconds = studiedSeconds < 10 ? '0' + studiedSeconds : studiedSeconds;
    
        timeStudied.innerHTML = studiedMinutes + ":" + studiedSeconds;

        let breakMinutes = Math.floor(totalBreakTime/60);
        let breakSeconds = totalBreakTime % 60;
    
        breakMinutes = breakMinutes < 10 ? '0' + breakMinutes : breakMinutes;
        breakSeconds = breakSeconds < 10 ? '0' + breakSeconds : breakSeconds;
    
        timeOnBreak.innerHTML = breakMinutes + ":" + breakSeconds;
    }
    else
        console.log("No such document!");
})
.catch(function(error) {
    console.log("Error getting document:", error);
});

// call these once to stop all timers from taking too long on first use of the setInterval function
updateTimer();
totalStudiedTime++; 
totalBreakTime++;

// retrieve current day (in the format: 17 May 2020)
var d = new Date();
// change to dd/mm/yyyy
var dayName = d.toString().split(' ')[2] + " " + d.toString().split(' ')[1] +  " " + d.toString().split(' ')[3];
console.log(dayName);

function updateTimer(){
    let minutes = Math.floor(time/60);
    let seconds = time % 60;

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds; // if seconds less than 10, make it 00, 01, 02, etc.

    pomodoroTimer.innerHTML = minutes + ':'+ seconds;

    // update study and break time trackers every second, only works if the parent function is NOT called from resetTimer()
    if(resetTimerClicked == 0){ 
        updateTimeTrackers();
    }
   resetTimerClicked = 0;
    
    // progress bar
    if(width <= 100){
        if(time % onePercent == 0){
            width++;
            progressBar.style.width = width + "%";
        } 
        
        if(width == 100){
            
            if(toggleAlarm == 1){
                var alarm = document.getElementById("alarm")
                alarm.load();
                alarm.play();
            }

            if(toggleNotification == 1){
                if(studying == 1){
                    notifier.notify(
                        {
                        title: 'The Study App',
                        message: "Great work, your study session is complete! Time for a break!",
                        sound: true, // Only Notification Center or Windows Toasters
                        wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait
                        },
                        function(err, response) {
                        // Response is response from notification
                        }
                    );
                } else {
                    notifier.notify(
                        {
                        title: 'The Study App',
                        message: "Break time is over, back to work!",
                        sound: true, // Only Notification Center or Windows Toasters
                        wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait
                        },
                        function(err, response) {
                        // Response is response from notification
                        }
                    );
                }

            }
        }
    }

    if(time != 0) {
        time--;
    } else {
        clearInterval(intervalID);
        intervalID = 0;
    }
}

function startTimer(){
    if(!intervalID){ // to prevent multiple setIntervals being queued up
        
        intervalID = setInterval(updateTimer, 1000);

        startButton.classList.remove("btn-outline-info"); 
        startButton.classList.add("btn-info"); // fill box with colour
    
        pauseButton.classList.add("btn-outline-danger"); // remove colour from pause button
        pauseButton.classList.remove("btn-danger");
    }
}

function pauseTimer(){
    clearInterval(intervalID);
    intervalID = 0;

    pauseButton.classList.remove("btn-outline-danger"); 
    pauseButton.classList.add("btn-danger"); // fill box with colour

    startButton.classList.add("btn-outline-info"); // remove colour from start button
    startButton.classList.remove("btn-info");
}

function resetTimer(){
    time = startTime * 60;
    width = 0;
    resetTimerClicked = 1;
    updateTimer();
    pauseTimer();
}

function setTimer(studyLength){
    startTime = studyLength;
    studying = 1;

    onePercent = (startTime * 60) * 0.01;
    width = 0;
    
    if(studyLength == 25){
        taskMessage.innerHTML = "✍ Regular Task | 25 minutes ";
    } else {
        taskMessage.innerHTML = "📚 Extended Task | 45 minutes ";
    }
    taskMessage.classList.remove("btn-outline-success"); 
    taskMessage.classList.add("btn-success"); // fill box with colour

    breakMessage.classList.add("btn-outline-info"); // remove colour from break button
    breakMessage.classList.remove("btn-info");

    breakMessage.innerHTML = "⏳ Break "; // reset break dropdown button text
    resetTimer();
}

function breakTimer(breakLength){
    startTime = breakLength;
    studying = 0;

    onePercent = (startTime * 60) * 0.01;
    width = 0;

    if(breakLength == 5){
        breakMessage.innerHTML = "🥪 Short Break | 5 minutes ";
    } else {
        breakMessage.innerHTML = "😴 Long Break | 15 minutes ";
    }
    breakMessage.classList.remove("btn-outline-info");
    breakMessage.classList.add("btn-info"); // fill box with colour

    taskMessage.classList.add("btn-outline-success"); // remove colour from task button 
    taskMessage.classList.remove("btn-success");  
    taskMessage.innerHTML = "🚀 Select Task "; // reset task select dropdown button text
    resetTimer();
}

//function alters state of alerts, argument takes 1 or 2 depending on which alert is being toggled
function toggleAlert(alertType){
    if(alertType == 1){
        var alarmButton = document.getElementById('alarmButton');
        alarmButton.innerHTML = (alarmButton.innerHTML == "🔊") ? "🔇" : "🔊";

        if(alarmButton.innerHTML == "🔊"){
            toggleAlarm = 1;
        } else {
            toggleAlarm = 0;
        }
    } else {
        var notificationButton = document.getElementById('notificationButton');
        notificationButton.innerHTML = (notificationButton.innerHTML == "🔔") ? "🔕" : "🔔";

        if(notificationButton.innerHTML == "🔔"){
            toggleNotification = 1;
        } else {
            toggleNotification = 0;
        }
    }
}

function updateTimeTrackers(){
    if(studying == 1){
        let studiedMinutes = Math.floor(totalStudiedTime/60);
        let studiedSeconds = totalStudiedTime % 60;
    
        studiedMinutes = studiedMinutes < 10 ? '0' + studiedMinutes : studiedMinutes;
        studiedSeconds = studiedSeconds < 10 ? '0' + studiedSeconds : studiedSeconds;
    
        timeStudied.innerHTML = studiedMinutes + ":" + studiedSeconds;
        
        totalStudiedTime++;
    }else if(studying == 0){
        let breakMinutes = Math.floor(totalBreakTime/60);
        let breakSeconds = totalBreakTime % 60;
    
        breakMinutes = breakMinutes < 10 ? '0' + breakMinutes : breakMinutes;
        breakSeconds = breakSeconds < 10 ? '0' + breakSeconds : breakSeconds;
    
        timeOnBreak.innerHTML = breakMinutes + ":" + breakSeconds;
        
        totalBreakTime++;
    }
}

//update tracking timers in the db when the user presses return
function updateTimerDB() {

    studyTimerDB[dayName] = {
        study: totalStudiedTime, 
        break: totalBreakTime
    }

    db.collection("users").doc(emailVal).update({studyTimeTrackers: studyTimerDB})
}