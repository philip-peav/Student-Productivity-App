var todoItems = [];
require('../scripts/dbConnection');
var db = firebase.firestore();
const {ipcRenderer} = require('electron');

var newTime = "";
var inputEle = document.getElementById('time');

//request user info from backend
ipcRenderer.invoke('getUser')
.then((result) => 
{
    emailVal = result.currName;
    //search for username via email address from the firebase cloud storage
    var username = db.collection("users").doc(emailVal);
    username.get()
    .then(function(doc) 
    {
        if (doc.exists)
        {
            todoItems = doc.data().remindersList;
        
            var submitBtn = document.getElementById("submitBtn");
            var todoList = document.getElementById("todolist");

            var numItems = doc.data().reminders;
            //new time and inpute ele were here

            for (const task in todoItems)
            {
                var newID = todoItems[task].ItemID; 
                var desc = todoItems[task].Desc; 
                var dateVal = todoItems[task].Date; 
                var timeVal = todoItems[task].Time;
                createTask(newID, desc, dateVal, timeVal);
            }

            //submit button
            submitBtn.addEventListener("click" ,function () 
            {
                var desc = document.getElementById("newTask").value;
                var dateVal = document.getElementById("date").value;
                var timeVal = onTimeChange();

                //validate information for submission
                if (desc.length > 0 && dateVal.length > 8 && !(timeVal.includes('undefined')))
                {
                    numItems++; //increase item count
                    newID = "newItem" + numItems; //creates new ID for element
                    createTask(newID, desc, dateVal, timeVal);
                    //add to database
                    todoItems['Task'+numItems] = {Desc: desc, Date: dateVal, Time: timeVal, ItemID: newID};
                    db.collection("users").doc(emailVal).update({
                        name: doc.data().name,
                        remindersList: todoItems,
                        reminders: numItems
                    })
                    .then(function() {
                        console.log("Document successfully written!");
                    })
                    .catch(function(error) {
                        console.error("Error writing document: ", error);
                    });
                    //clear input
                    document.getElementById("newTask").value = "";
                    document.getElementById("date").value = "";
                    document.getElementById("time").value = "";
                    //show success msg
                    document.getElementById("successMsg").classList.remove("hidden");
                    document.getElementById("errorMsg").classList.add("hidden");
                }
                else
                {
                    //show error msg
                    document.getElementById("errorMsg").classList.remove("hidden");
                    document.getElementById("successMsg").classList.add("hidden");
                }
                // location.reload();
            });

            //this is where the clock functions were

            //construct html card
            function createTask(newID, desc, dateVal, timeVal)
            {
                //create list item
                var newItem = document.createElement("li");
                newItem.classList.add("list-group-item");

                //create delete button
                var btnDelete = document.createElement("button");
                btnDelete.classList.add("deleteBtn");
                btnDelete.id = "delete" + newID;
                btnDelete.innerHTML = "🗑";
                newItem.appendChild(btnDelete);

                //create edit button
                var btnEdit = document.createElement("button");
                btnEdit.classList.add("editBtn");
                btnEdit.id = "edit" + newID;
                btnEdit.innerHTML = "✏";
                newItem.appendChild(btnEdit);

                //create more info button
                var btnDrop = document.createElement("button");
                btnDrop.classList.add("moreInfo");
                btnDrop.setAttribute("type", "button");
                btnDrop.setAttribute("data-toggle","collapse");
                btnDrop.setAttribute("data-target", "#" + newID);
                btnDrop.setAttribute("aria-expanded", "false");
                btnDrop.setAttribute("aria-controls", newID);
                btnDrop.innerHTML = desc;
                newItem.appendChild(btnDrop);

                //create drop down div
                var moreInfoTab = document.createElement("div");
                moreInfoTab.classList.add("collapse");
                moreInfoTab.id = newID;
                
                //create body of the div
                var infoCard = document.createElement("div");
                infoCard.classList.add("card");
                infoCard.classList.add("card-body");
                var newDate = document.createElement("p");
                newDate.innerHTML = "Date: " + dateVal;
                var newTime = document.createElement("p");
                newTime.innerHTML = "Time: " + timeVal;
                infoCard.appendChild(newDate);
                infoCard.appendChild(newTime);
                moreInfoTab.appendChild(infoCard);

                //add to list
                todoList.appendChild(newItem);
                todoList.appendChild(moreInfoTab);

                //deleting a todo
                $("#delete"+newID).on("click", function(e) 
                {
                    //search for task in list and delete locally
                    for (const task in todoItems)
                    {
                        if (todoItems[task].ItemID == newID)
                        {
                            //todoItems.splice(task, 1);
                            delete todoItems[task];
                        }
                    }

                    //remove from database
                    db.collection("users").doc(emailVal).update({
                        name: doc.data().name,
                        remindersList: todoItems,
                        reminders: numItems
                    })
                    .then(function() {
                        console.log("Document successfully written!");
                    })
                    .catch(function(error) {
                        console.error("Error writing document: ", error);
                    });

                    //remove from UI
                    $(this).parent().remove();
                    $("#"+newID).remove();
                    $(this).remove();
                    e.stopPropagation();
                });

                //updating a todo
                $("#edit"+newID).on("click", function(e) 
                {
                    //search for task in list and delete
                    for (const task in todoItems)
                    {
                        //load values into form
                        if (todoItems[task].ItemID == newID)
                        {
                            document.getElementById("newTask").value = todoItems[task].Desc;
                            document.getElementById("date").value = todoItems[task].Date;
                            document.getElementById("time").value = twentyfourhourTime(todoItems[task].Time);
                            delete todoItems[task];
                        }
                    }
                    //remove from database
                    db.collection("users").doc(emailVal).update({
                        name: doc.data().name,
                        remindersList: todoItems,
                        reminders: numItems
                    })
                    .then(function() {
                        console.log("Document successfully written!");
                    })
                    .catch(function(error) {
                        console.error("Error writing document: ", error);
                    });

                    //remove from UI
                    $(this).parent().remove();
                    $("#"+newID).remove();
                    $(this).remove();
                    e.stopPropagation();
                });
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

//get 12 hour format time
function onTimeChange() 
{
    var timeSplit = inputEle.value.split(':'),
        hours,
        minutes,
        meridian;
        hours = timeSplit[0];
        minutes = timeSplit[1];
    if (hours > 12) 
    {
        meridian = 'PM';
        hours -= 12;
    } 
    else if (hours < 12)
    {
        meridian = 'AM';
        if (hours == 0) 
        {
            hours = 12;
        }
    } 
    else 
    {
        meridian = 'PM';
    }
    return newTime = hours + ':' + minutes + ' ' + meridian;
}

//get the 24hour time format for editing functionality
function twentyfourhourTime(timeVal)
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
        if (oldHour == '12'){
            newHour = '00';
        } else {
        newHour = oldHour;
        }
    }
    return newHour + ':' + oldMin;
}