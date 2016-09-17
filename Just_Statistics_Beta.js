// ==UserScript==
// @name         Just statistics v1.71 Beta
// @version      1.71B
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==


var version = "v1.71 BETA";
console.log("You're currently using version " + version);
//Variable declaration; getting the data out of local storage
var log;
if (!localStorage.getItem("localLog")) {
    console.log("Log not found, creating a new one");
    Create_Log_Object();
}
else {
    log = localStorage.getItem("localLog");
    log = JSON.parse(log);
    console.log(log);
    console.log("Log succesfully loaded");
}
function Create_Log_Object() {
    log = {};
    log.Misc = {};
    log.Misc.Attempts = {};
    log.Misc.Attempts.Node = 0;
    log.Misc.Attempts.Total = 0;
    log.Misc.TotalExp = 0;
    log.Misc.Gold = 0;
    log.Misc.Alert = false;
    localStorage.setItem("localLog", JSON.stringify(log));
}

$(document).ready(function () {
    //Add the "button" to the menu bar
    // $(document.createElement("a")).attr({id: "hrefShowLog", class: "gs_topmenu_item"}).text("Show Log").appendTo("#gs_topmenu");
    $(document).ajaxComplete(function (event, xhr, settings) {
        if (xhr.status === 200) { //Check if ajax is OK
            if (settings.url.match(/\/world\/action_/)) { //Look if the ajax is a tradeskill action
                var amount, exp, gold, item, history, buffData, titleData;
                var tradeskill = settings.url.match(/action_(.*?)\//)[1];
                tradeskill = (tradeskill[0].toUpperCase() + tradeskill.substring(1)); //Convert first char to uppercase (Just for beauty reasons)
                var copy = tradeskill.tradeskills;
                if (!log[tradeskill]) {
                    log[tradeskill] = {};
                    log[tradeskill].Rarity = {};
                    log[tradeskill].Items = {};
                    log[tradeskill].Multi = {};
                } //If tradeskill is not present in log create it
                console.log(xhr.responseText);
                /*
                depleted:
<div class="roundResult damage areaDepleted">This <b>Logging</b> area has been depleted... </div>
*/
                if (!xhr.responseText.match(/depleted/i)) {


                    var regex = /<div class="roundResult areaName">(.*?)(<script>.*<\/script>)(.*?)<\/div>/gi;
                    var result = regex.exec(xhr.responseText); //Basic regex to get only the necessary data.
                    if (!result) { //Nothing-drop
                        if (!log[tradeskill].Rarity.Nothing) {
                            log[tradeskill].Rarity.Nothing = 1;
                        }
                        else {
                            log[tradeskill].Rarity.Nothing++;
                        }
                        if (!log[tradeskill].Multi['0 (Nothing)']) {//Multicounter
                            log[tradeskill].Multi['0 (Nothing)'] = {};
                            log[tradeskill].Multi['0 (Nothing)'].Amount = 1;
                        }
                        else {
                            log[tradeskill].Multi['0 (Nothing)'].Amount++;
                        }
                        exp = xhr.responseText.match(/>(\d+)\s*exp</mi)[1];
                    }
                    else {
                        history = result[1] + result[3]; //The string the user sees in the end.
                        var rarity = history.match(/class=\"(\w+)\s?viewmat\">/mi)[1];
                        if (!log[tradeskill].Rarity[rarity]) {
                            log[tradeskill].Rarity[rarity] = 1;
                        }
                        else {
                            log[tradeskill].Rarity[rarity]++;
                        }
                        item = history.match(/\[.*?\].*\[(.*?)\]/)[1];
                        amount = history.match(/<\/span>\s*x(\d+)/)[1];
                        if (!log[tradeskill].Multi[amount]) {//Multicounter
                            log[tradeskill].Multi[amount] = {};
                            log[tradeskill].Multi[amount].Amount = 1;
                        }
                        else {
                            log[tradeskill].Multi[amount].Amount++;
                        }
                        if (!log[tradeskill].Items[item]) { //Itemcounter
                            log[tradeskill].Items[item] = {};
                            log[tradeskill].Items[item].Drop = 1;
                            log[tradeskill].Items[item].Amount = Number(amount);
                            console.log("Item: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
                        }
                        else {
                            log[tradeskill].Items[item].Drop++;
                            log[tradeskill].Items[item].Amount += Number(amount);
                            console.log("Item: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
                        }
                        exp = result[3].match(/(\d+)/gi);
                    }
                    log.Misc.TotalExp += Number(exp);
                    gold = xhr.responseText.match(/playtitle.*?\+(\d*,*\d+).*?<\/span>/gi);
                    if (!gold) { gold = 0; }
                    else { gold = gold[1].replace(",", ""); }
                    console.log("Gold: " + gold);
                    log.Misc.Gold += Number(gold);
                    log.Misc.Attempts.Total++;
                    log.Misc.Attempts.Node = $(".roundResult").length;
                    //Drop analysis done, let's start with the rest
                    var scripts = xhr.responseText.match(/<script>(.*?)<\/script>/g);
                    var miscData = scripts[scripts.length - 1];
                    var currentExp = miscData.match(/exp\:\s*(.*?)\s\//mi)[1].replace(",", "");
                    var neededExp = miscData.match(/exp\:\s*.*?\/\s*(.*?)\s\(/mi)[1].replace(",", "");
                    var attemptTime = miscData.match(/startTimer\((\d+),*/mi)[1];
                    //Calculate the needed attempts to next level and update div text in the dialog
                    GetAttemptsToNextLevel(currentExp, neededExp, attemptTime, log.Misc.TotalExp, log.Misc.Attempts.Total);
                    //Titlechanging data
                    buffData = scripts[scripts.length - 2];
                    if (buffData.match(/cardNone/gi)) { buffData = false; }
                    else { buffData = "yes"; }
                    if (miscData.match(/\d+%\sof/gi)) {
                        titleData = miscData.match(/(\d+)%\sof/i)[1] + "% of Node left";
                    }
                    else if (miscData.match(/x\d+\.\.\./)) {
                        titleData = miscData.match(/x(\d+)\.\.\./)[1] + " attempts left";
                    }
                    else if (miscData.match(/complete/i)) {
                        titleData = "Creation completed";
                        buffData = "pattern_done";
                    }

                }
                else {
                    titleData = "Node depleted!";
                    buffData = "node_depleted";
                }
                ChangeTitle(titleData, buffData);   //Change the title according to current status
                DisplayData(log);                   //Rarity-, Multi- and Materialoverview
                localStorage.setItem("localLog", JSON.stringify(log));
            }
            else if (!settings.url.match(/chat/i)) {
                var buffStatus;
                if (xhr.responseText.match(/cardNone/gi)) { buffStatus = ""; }
                else { buffStatus = "yes"; }
                ChangeTitle('Drakor "Innovative & Unique Browser Based RPG." (PBBG, MPOG, MMORPG)', buffStatus);
            }
        }
    });
    SetupLog();
});

function ChangeTitle(activity, buffState) {
    var foodBuffInfo = "[NBA] ";
    if (buffState === "yes") { foodBuffInfo = "[BA] "; }
    else if (buffState === "node_depleted" || buffState === "pattern_done") {
        foodBuffInfo = "";
        if (log.Misc.Alert && buffState === "node_depleted") {
            alert("Node depleted!");
        }
        else if (log.Misc.Alert && buffState === "pattern_done") {
            alert("Creation completed");
        }
    }
    $("title").text((foodBuffInfo + activity));
}

function GetDate() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    var newdate = year + "/" + month + "/" + day;
    return newdate;
}

function GetAttemptsToNextLevel(currentExp, neededExp, attemptTime, totalExp, totalAttempts) {

    var diffExp = neededExp - currentExp;
    var averageExperience = Math.floor(totalExp / totalAttempts);
    var attemptsToLevel = Math.floor(diffExp / averageExperience);
    var timeToLevel = attemptsToLevel * attemptTime; //In Milliseconds
    var stringTimeToLevel = ConvertIntoSmallerTimeFormat(timeToLevel); //Convert into String like "2 days 12 hours"
    $("#miscDiv").html("<p>Experience left to level-up: <b>" + diffExp + "</b><br/>Average attempts to level-up: " + attemptsToLevel +
                       "<br/>This takes about <b>" + stringTimeToLevel + "</b> on this node</p>");
    localStorage.setItem("miscDivText", $("#miscDiv").html());
}

function DisplayData(log) {
    var colorDict = {
        "Nothing": "#0aa",
        "Common": "#999",
        "Superior": "#48c730",
        "Rare": "#2f84c7",
        "Epic": "#bd33de",
        "Legendary": "#f14c02"
    };
    var totalResources;
    var totalAttempts = Number(log.Misc.Attempts.Total);
    var rarityText = "<p><b>Rarities collected</b></p>";
    var materialText = "<p><b>You have collected..</b></p>";
    var multiText = materialText;
    for (var tradeskill in log) { //Iterate over tradeskills
        if (tradeskill !== "Misc") { //Don't list the Misc thing
            var tradeskillTitle = "<h3>" + tradeskill + "</h3>";
            rarityText += tradeskillTitle;
            for (var rarity in colorDict) {
                if (log[tradeskill].Rarity[rarity]) {
                    rarityText += "<p style='color:" + colorDict[rarity] + ";'>" + rarity + ": " + log[tradeskill].Rarity[rarity] + " (" + (log[tradeskill].Rarity[rarity] / totalAttempts * 100).toFixed(2) + "%)</p>";
                }
            }
            materialText += tradeskillTitle;
            for (var item in log[tradeskill].Items) { //Iterate over dropped items
                materialText += "<p>" + item + " x" + log[tradeskill].Items[item].Amount + " (Average gained per attempt: " + (log[tradeskill].Items[item].Amount / log[tradeskill].Items[item].Drop).toFixed(2) + ")</p>";
                totalResources += Number(log[tradeskill].Items[item].Amount);
            }
            multiText += tradeskillTitle;
            for (var multi in log[tradeskill].Multi) { //Iterate over multis
                multiText += "<p>Multi: " + multi + " Gotten: " + log[tradeskill].Multi[multi].Amount + " time(s). (" + (log[tradeskill].Multi[multi].Amount / totalAttempts * 100).toFixed(2) + "%)</p>";
            }
        }
    }
    var averageGold = Math.floor(log.Misc.Gold.Total / totalAttempts);
    var averageExperience = Math.floor(log.Misc.TotalExp / totalAttempts);
    var averageResources = (totalResources / totalAttempts).toFixed(2);
    var miscOutput = "<p>You have gained " + log.Misc.TotalExp + " total experience(" + averageExperience + " average experience)</p><p>You have collected " +
        log.Misc.Gold + " total gold(" + averageGold + " average gold)</p><p>Attempts/Creations on this node/pattern: " +
        log.Misc.Attempts.Node + "</p><p>Total collection attempts/creations: " + totalAttempts + "</p>";
    $("#rarityDiv").html(rarityText);
    localStorage.setItem("rarityDivText", $("#rarityDiv").html());
    $("#materialDiv").html(materialText);
    localStorage.setItem("materialDivText", $("#materialDiv").html());
    $("#multiDiv").html(multiText);
    localStorage.setItem("multiDivText", $("#multiDiv").html());
    $("#miscDiv").html($("#miscDiv").html() + miscOutput); //Add the previous text there because of exp information.
    localStorage.setItem("miscDivText", $("#miscDiv").html());
}
/*
timeInMs gets calculated down to hours, minutes and seconds and gets output as a string
example ConvertIntoSmallerTimeFormat(3600000) [1 hour in milliseconds]
output: 1 Hour(s) 0 Minute(s) 0 Second(s)
*/
function ConvertIntoSmallerTimeFormat(timeInMs) {
    var output = "";
    var milliseconds = timeInMs % 1000;
    timeInMs -= milliseconds;
    timeInMs = timeInMs / 1000;
    if (timeInMs > 0) {
        var seconds = timeInMs % 60;
        output = " and " + seconds + " Second(s)" + output;
        timeInMs -= seconds;
        timeInMs = timeInMs / 60;
        if (timeInMs > 0) {
            var minutes = timeInMs % 60;
            output = minutes + " Minute(s) " + output;
            timeInMs -= minutes;
            timeInMs = timeInMs / 60;
            if (timeInMs > 0) {
                var hours = timeInMs % 24;
                output = hours + " Hour(s) " + output;
                timeInMs -= hours;
                timeInMs = timeInMs / 24;
                if (timeInMs > 0) {
                    output = timeInMs + " Days " + output;
                }
            }
        }
    }
    return output;
}

function SetupLog() {
    /* Temporary disabled
    var selectLogMaterial = document.createElement("select");
    var selectLogMulti = document.createElement("select");
    selectLogMaterial.style.fontSize = "14px";
    selectLogMulti.style.fontSize = "14px";
    selectLogMaterial.style.padding = "4px";
    selectLogMulti.style.padding = "4px";
    selectLogMaterial.id = "selectLogMaterial";
    selectLogMulti.id = "selectLogMulti";
    */var fragment = document.createDocumentFragment();
    var logDiv = $(document.createElement("div")).attr({ id: "logDiv", title: "Drop Log" }).css({ "font-size": "14px", "background-color": "lightgrey", "display": "none" }).html('<ul><li><a href="#materialDiv">Drops/ Creations</a></li>' +
        '<li><a href ="#multiDiv">Multis</a></li>' +
        '<li><a href ="#miscDiv">Miscellaneous</a></li>' +
        '<li><a href ="#rarityDiv">Rarites</a></li>' +
        '<li><a href ="#optionDiv">Options</a></li>' +
        '<li><a href ="#helpDiv">Help(WIP)</a></li></ul>').appendTo(fragment);
    var materialDiv = $(document.createElement("div")).attr({ "id": "materialDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("materialDivText")).appendTo(logDiv);
    // $(document.createElement("div")).attr({"id": "materialDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(materialDiv);
    var multiDiv = $(document.createElement("div")).attr({ "id": "multiDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("multiDivText")).appendTo(logDiv);
    // $(document.createElement("label")).attr({"id": "multiDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(multiDiv);
    var miscDiv = $(document.createElement("div")).attr({ "id": "miscDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("miscDivText")).appendTo(logDiv);
    var rarityDiv = $(document.createElement("div")).attr({ "id": "rarityDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("rarityDivText")).appendTo(logDiv);
    var optionsDiv = $(document.createElement("div")).attr({ "id": "optionDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var helpDiv = $(document.createElement("div")).attr({ "id": "helpDiv" }).css({ "text-align": "left", "display": "inherit" }).html("<h5>What does that [NBA] and [BA] mean in front of my title?</h5>" +
                                                                                                                                 "<p>Basic explanation of the tags are: </br>" +
                                                                                                                                 "[NBA] = No Buff Active - [BA] = Buff Active </br>" +
                                                                                                                                 "This means that it will basically display if you currently got a food buff active or not.</p></br>" +
                                                                                                                                 "<h5>Can I contribute in any way?</h5>" +
                                                                                                                                 "<p>Sure! If you got any suggestion feel free to message Bl00D4NGEL with it. </br>" +
                                                                                                                                 "Can I help with this help file? </br>" +
                                                                                                                                 "Sure thing. Just message Bl00D4NGEL once again with any idea of what could be added to this.</p>").appendTo(logDiv);
    var alertCheckbox = $(document.createElement("input")).attr({ id: "alert", type: "checkbox" }).on("click", function (event) { log.Misc.Alert = $(this).prop('checked'); }).appendTo(optionsDiv);
    $(document.createElement("span")).html("Put you to the Drakor page when the node depletes/ the pattern completes?<br/>").appendTo(optionsDiv);
    var resetButton = $(document.createElement("button")).attr({ id: "resetButton" }).html("Reset Statistics").css({ "width": "auto", "height": "auto" }).on("click", function () { ResetStatistics(); }).appendTo(optionsDiv);
    $(document.createElement("p")).appendTo(optionsDiv); //To make a linebreak
    var localButton = $(document.createElement("button")).attr({ id: "localButton" }).html("Output Localstorage variables").css({ "width": "auto", "height": "auto" }).on("click", function () {
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            var value = localStorage[key];
            console.log(key + " => " + value);
        }
    }).appendTo(optionsDiv);
    var showLog = $(document.createElement("a")).attr({ id: "hrefShowLog", class: "gs_topmenu_item" }).text("Show Log").on("click", function () { $(logDiv).dialog("open"); }).appendTo("#gs_topmenu");
    if (localStorage.getItem("popAlert")) {
        $(alertCheckbox).prop('checked', true);
    }
    else {
        $(alertCheckbox).prop('checked', false);
    }
    logDiv.tabs();
    logDiv.dialog({
        autoOpen: false,
        show: {
            effect: "blind",
            duration: 500
        },
        width: 700,
        height: 400
    });
    $(fragment).appendTo("#gs_topmenu");
}

function ResetStatistics() {
    $("#materialDivText", "#multiDivText", "#miscDivText", "#expDiv", "#rarityDiv").each(function () {
        $(this).html("");
    });
    console.log("Everything has been re-set");
    Create_Log_Object();
}
/*
Patch notes 1.42
10th.June.2016
-	Started doing patch notes, yay!
- 	Commented variables, moved them to the ResetStatistics function
- 	Cleaned up the UpdateStatisticDivs function from junk lines
-	Renamed and rearranged variables in "SetupLog" function
- 	Created fall-back else in the amount,expDropped and totalExp if-clause to report an error to the console
11th.June.2016
-   Added a dictionary variable "materialDic" that helps build up the displayed log of a specific material
-   Added a history log for specific materials/multis
-   Removed alert from ResetStatistics as it was kind of annoying
-   Removed the Limit function since it was a pointless (and unallowed) feature anyway
-   Reworded some labels on the checkbox and console outputs
-   Renamed script to "Just statistics v1.42" instead of the original name "Collection history"
Ninja patch:
-   Added everything to it's own div inside the original div (class ="skillresultsheader")
-	Fixed a bug where the select(s) would not reset their data properly
12th.June.2016
-   Fixed a bug where the multi would display "ou" if you didn't find anything
-   Also fixed the display of this so it does not display the time twice
-   Fixed a bug where if you would execute the jquery command to get this script while you have already collected/created materials it would not execute the script correctly
-   Fixed a bug where the multi-select would not reset/rebuild properly

Patch notes 1.5
14th.June.2016
-   Re-did the setup of the log requirements so that it now checks for an existing id(logDiv) and not for the text of the last element
    This will make further implementation easier
-   Started to save the "totalStatistics" variable in the local storage. This is just the beginning of session-continued data collection (Still in it's early steps)
-   Created a help button and added functionality to it (It appends text to the end of the div)
-   Optimized the main Interval to set a "perfect" interval time via function.
-   Created a function(GetRightTiming) to calculate the "perfect" interval time based on the passed between 25% and 50%
-   Moved the node-information into the main-loop as this should have a good interval now
15th.June.2016
-   Optimized the GetRightTiming function a little more and tried to fix a few more bugs connected to it
-   Added a 5 second interval that loops over, only really executes code if the graphical log isn't built yet
-   Fixed a "typo" in the ouput variable of the Mainloop, "You have collected" => "You have collected/ created"
17th.June.2016
-   Re-did the whole GetRightTiming function that it now waits until the attempt will end in 2 seconds and then do it's thing
-   Now checking if the refresh vs real time is synced in the MainLoop
-   Added a food buff status-tag to the title header. (NBA = No Buff Active; BA = Buff Active) - Also made this available in v1.42 as this was easy to implement
18th.June.2016
-   Finalized the data-over-session storage of statistics. This is still experimental so no guarantee that it will work 100%
-   You can now see how long you have been working on a node
-   Added the display of how many total attempts and how many node attempts you've done
-   Added a few lines to the help-file

Patch notes 1.51
18th.June.2016
-   Added a checkbox to the top to display the rarities below
-   Changed the conditions for the rarity-meter to be displayed and added it to the new checkbox
-   Changed SetTotalStatstics => WriteCheckboxStatus, this will wrrite the value of the checkbox into the local storage
-   Adjusted the text of how long you've been working on a node as it was only "covering" collection and not crafting
-   Adjusted the total-attempt display as it was only "covering" collection but not crafting

Patch notes 1.52
19th.June.2016
-   Fixed a bug where the last attempt of a crafting skill would cause a some weird stuff e.g. nothingrarity +1 and so on
-   Adjusted the ResetStatistics function to be up to latest standards
-   Added a checkbox for the "nerdy" stuff (Basically a log of what gets written/ loaded into/out of local storage)
-   Removed the rarity-meter (RIP somewhere around early June - 19th.June.2016)
-   Added a small % to the "You'Ve collected something x amount of times" thing
Patch notes 1.6
20th.June.2016-23th.June.2016
-   Created a new function to create the output which takes arguments like exp and so on
-   Moved most of the mainLoop into the new created function, the mainloop function now mainly concats data to use it in the AddData function
-   Fixed a bug where a double exp occuring would cause the log to mess up and display weird multis

*/
