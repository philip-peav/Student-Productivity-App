// local date and time script
const notifier = require('node-notifier'); // notifications
const path = require('path');
var notifs = []; // store all reminder notifications in here

// connect to DB
require('../scripts/dbConnection');
var db = firebase.firestore();

var submitBtn = document.getElementById("submitBtn");

// if any updates were made while on the reminders page, the notifs list needs to be refreshed
if (submitBtn != null)
{
  submitBtn.addEventListener("click", function(e)
  {
    notifs = [];
    getUserInfo();
  });
}

// request user info from backend
function getUserInfo()
{
  ipcRenderer.invoke('getUser')
  .then((result) => 
  {
    emailVal = result.currName;
    // search for username via email address from the firebase cloud storage
    var username = db.collection("users").doc(emailVal);
    username.get()
    .then(function(doc) 
    {
        if (doc.exists)
        {
            // pull reminders hashtable
            var remindersData = doc.data().remindersList;

            // loop through hashtable and apply getAlarm() to each
            for (const reminder in remindersData)
            {
                getAlarm(remindersData[reminder].Date, remindersData[reminder].Time, remindersData[reminder].Desc);
            }

            // create notif from reminder DB
            function getAlarm(date, time, desc)
            {
                reminderDate = date;
                reminderTime = convertTime(time);
                reminderNotif = reminderDate + ' ' + reminderTime;
                notifs.push([reminderNotif, desc]);
            }

            // get the 24hour time format for comparing with local time
            function convertTime(timeVal)
            {
                var oldTime = timeVal.split(':');
                var oldHour = oldTime[0];
                var oldMin = oldTime[1].slice(0,2);
                var newHour;
                if (timeVal.slice(-2) == "PM")
                {
                    newHour = parseInt(oldHour) + 12;
                }
                else
                {
                    if (oldHour == "12") {
                        newHour = "00";
                    } else {
                        newHour = oldHour;
                    }
                }
                return newHour + ':' + oldMin + ':00';
            }
        }
        else
            console.log("No such document!");
        })
    .catch(function(error) 
    {
        console.log("Error getting document:", error);
    });
  });
}

// set internal clock and retrieve user info
window.onload = function ()
{
  display_c();
  getUserInfo();
}

function display_c() {
  var refresh = 1000; // refresh every second
  mytime = setTimeout("display_clock()", refresh);
}

function display_clock() {
  var x = new Date();
  // format date part
  var month = x.getMonth() + 1;
  var day = x.getDate();
  var year = x.getFullYear();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  var x3 = year + "-" + month + "-" + day;

  // format time part
  var hour = x.getHours();
  var minute = x.getMinutes();
  var second = x.getSeconds();
  if (hour < 10) {
    hour = "0" + hour;
  }
  if (minute < 10) {
    minute = "0" + minute;
  }
  if (second < 10) {
    second = "0" + second;
  }
  var x3 = x3 + " " + hour + ":" + minute + ":" + second;

  document.getElementById("clock").innerHTML = x3;

  for (const reminder in notifs) {
    if (x3 == notifs[reminder][0]) {
        notifier.notify(
            {
            title: "The Study App",
            message: notifs[reminder][1], // extract message from reminder
            icon: path.join(__dirname, '../public/icons/logo_1.png'),
            sound: true,
            wait: true,
            },
            function (err, response) {
            console.log(err); // Response is response from notification
            }
        );
    }
  }

  display_c(); // refresh clock
}