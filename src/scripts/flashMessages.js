// this script is for flash error message handling

var successMsg = document.getElementById("successMsg");
var errorMsg = document.getElementById("errorMsg");

successMsg.addEventListener("click", function(e){
    $(this).toggleClass("hidden");
    e.stopPropagation();
});

errorMsg.addEventListener("click", function(e){
    $(this).toggleClass("hidden");
    e.stopPropagation();
});