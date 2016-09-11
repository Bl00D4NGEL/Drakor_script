// ==UserScript==
// @name         Automatic trade ad
// @version      1.0
// @description  Automatically send a trade advert every hour
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// ==/UserScript==

$(document).ready(function(){
var chatStuff = {
    "chatChannel" : "t", //This is the channel to send to t=trade
    "chatMsg" : "Spammy things" //This is the actual message
};
    var myDate = new Date();
    var seconds = myDate.getTime();
    var hours = (seconds / 3600000).toFixed(4);
    var oldTime = localStorage.getItem("tradechat_timer");
    console.log("It has been " + (hours - oldTime).toFixed(4) + " hours since the last trade ad");
    if(hours - oldTime > 1){
        Main(chatStuff);
        setInterval(function(){
            Main(chatStuff);
        }, 3600000);
    }
    else{
        var leftMilliSeconds = (1- (hours - oldTime)) * 3600000;
        console.log("Sending new mesage in " + leftMilliSeconds.toFixed(2) + " milliseconds");
        setTimeout(function(){
            Main(chatStuff);
            setInterval(function(){
                Main(chatStuff);
            }, 3600000);
        }, leftMilliSeconds);
    }
});

function Main(chatStuff){
    var myDate = new Date();
    var seconds = myDate.getTime();
    var hours = (seconds / 3600000).toFixed(4);
    localStorage.setItem("tradechat_timer", hours);
    post('dr_chatBody', 'http://www.drakor.com/chat/send', chatStuff);
}

function post(results, path, params) {
    var form = document.createElement("form");
    form.setAttribute("id", "myForm");

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }
    $.post(path, params, function(data){
        document.getElementById(results).innerHTML += data;
    });
}