// manage app settings 
require('../scripts/dbConnection');
var db = firebase.firestore();
const {ipcRenderer} = require('electron');
var Chart = require('chart.js');

// request user info from backend
let username;
let emailVal;
let prevBreakHours;
let prevStudyHours;
let studiedHours = [];
let breakHours = [];
// extract the last 7 days from the DB
let startDay;
let daysOfWeek; 

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
        // collect info
        studyInfo = doc.data().studyTimeTrackers;
        prevStudyHours = doc.data().prevStudyAvg;
        prevBreakHours = doc.data().prevBreakAvg;

        // get all the days from the DB in order of oldest to newest date
        daysInDB = Object.keys(studyInfo).sort(function(a, b) {
            var dateA = new Date(a), dateB = new Date(b);
            return dateA - dateB;
        });

        // get the last 7 days from the list of days
        daysInDB.length < 7 ? startDay = 0 : startDay = daysInDB.length-7;
        daysOfWeek = daysInDB.slice(startDay, daysInDB.length+1); // use as label for chart and to extract corresponding study times

        calculateAvg();
        createChart();
    }
    else
        console.log("No such document!");
})
.catch(function(error) {
    console.log("Error getting document:", error);
}); 

// get the average study amount for the current week
const calculateAvg = () => {
    for (day in daysOfWeek) {
        studiedHours.push((studyInfo[daysOfWeek[day]].study)/3600); // divide by 3600 to convert seconds to hours
        breakHours.push((studyInfo[daysOfWeek[day]].break)/3600); // toFixed(2) stops it at 2 decimal places
    }
    
    let avgStudyTime = (studiedHours.reduce((a, b) => a + b, 0) / studiedHours.length);
    let avgBreakTime = (breakHours.reduce((a, b) => a + b, 0) / breakHours.length);
    
    document.getElementById("avgStudy").innerText = 'Average Time Studied: '+avgStudyTime.toFixed(2)+' hours';
    document.getElementById("avgBreak").innerText = 'Average Break Time: '+avgBreakTime.toFixed(2)+' hours';
}

// create the bar graph
const createChart = () => {
    var ctx = document.getElementById('chart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: daysOfWeek,
            datasets: [{
                label: 'hours studied',
                data: studiedHours,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(54, 162, 235, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                display: true,
                text: 'Hours Studied'
            }
        }
    });
}