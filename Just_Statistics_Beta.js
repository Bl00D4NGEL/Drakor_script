// ==UserScript==
// @name         Just statistics v1.81
// @version      1.81
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==

$(document).ready(function () {
    var version = "v1.81";
    console.log("You're currently using version " + version);
    //Variable declaration; getting the data out of local storage
    var log;
    if (!localStorage.getItem("localLog")) {
        console.log("Log not found, creating a new one");
        log = Create_Log_Object();
    }
    else {
        log = JSON.parse(localStorage.getItem("localLog"));
        console.log(log);
        console.log("Log succesfully loaded");
    }
    if (document.baseURI.match(/https/)) {
        log.Misc.Https = true;
    }
    //Load the Graph script IF the site is not https.
    //Can not load the chart stuff because it is not https.. too bad
    if (!document.baseURI.match(/https/)) {
        $("head").append("<script src='http://www.jchartfx.com/libs/v7/current/js/jchartfx.system.js'><\/script>");
        $("head").append("<script src='http://www.jchartfx.com/libs/v7/current/js/jchartfx.coreVector.js'><\/script>");
    }
    //Add the "button" to the menu bar
    var showLog = $(document.createElement("a")).attr({ id: "hrefShowLog", class: "gs_topmenu_item" }).text("Show Log").on("click", function () { $(logDiv).dialog("open"); }).appendTo("#gs_topmenu");
    $(document).ajaxComplete(function (event, xhr, settings) {
        if (xhr.status === 200) { //Check if ajax is OK
            if (settings.url.match(/\/world\/action_/)) { //Look if the ajax is a tradeskill action
                if (tradeskill === "teleport") { console.log("You teleported.. that's no tradeskill!"); return; }
                log = JSON.parse(localStorage.getItem("localLog")); //Load this up every attempt (Because of import reasons, might be able to load it a little prettier, though)
                var amount, exp, gold, item, history, buffData, titleData;
                var tradeskill = settings.url.match(/action_([a-zA-Z]+).*?\//)[1];
                //Switch to check if skill is Disenchanting since it needs special treating
                tradeskill = tradeskill.toLowerCase();
                $.ajax("/armory_action/" + tradeskill + "?show=noheader").done(function (data) {
                    try {
                        var currentRank = data.match(/leadResult active.*?#(\d+)<\/span>/i)[1];
                        if (!$("#skillLevel").html().match(/#(\d+)/) || $("#skillLevel").html().match(/#(\d+)/)[1] !== currentRank) {
                            console.log("Current Rank not written down or changed.. updating to '" + currentRank + "'");
                            $("#skillLevel").html($("#skillLevel").html() + " (#" + currentRank + ")");
                        }
                    }
                    catch (e) {
                        console.log("Cannot find rank data in data text.. \nAjax url: " + "/armory_action/" + tradeskill + "?show=noheader" + "\nError message: " + e.message + "\nData: " + data);
                    }
                });
                tradeskill = (tradeskill[0].toUpperCase() + tradeskill.substring(1)); //Convert first char to uppercase (Just for beauty reasons)
                if (!log[tradeskill]) {
                    console.log("Tradeskill '" + tradeskill + "' unknown in the log");
                    log[tradeskill] = {};
                    log[tradeskill].Rarity = {};
                    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary", "Nothing"];
                    for (var rar = 0; rar < rarities.length; rar++) {
                        log[tradeskill].Rarity[rarities[rar]] = 0;
                    }
                    log[tradeskill].Items = {};
                    log[tradeskill].Multi = {};
                    log[tradeskill].Attempts = 0;
                    log[tradeskill].Indexes = "";
                    log[tradeskill].Experience = 0;
                    $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo($("#tradeSelect"));
                    $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo($("#tradeSelectRarityChart")); //If a new tradeskill is there, add it to the select
                } //If tradeskill is not present in log create it
                console.log(xhr.responseText);
                if (!xhr.responseText.match(/depleted/i)) {
                    // var regex = /<div class="roundResult areaName">(.*?exp\)?<\/span><\/div>)/gi;
                    // var result = regex.exec(xhr.responseText); //Basic regex to get only the necessary data.
                    var result = xhr.responseText.match(/<div class="roundResult areaName">.*?exp\)?<\/span><\/div>/gi);
                    //Attention, creating skills will confuse this because not every creation gives exp, but rather a full attempt will.
                    //Will need to add a different kind of splitting here so the pattern-processing works correctly (ProcessData)
                    if (result) { //This will always say true UNLESS you worked in another window thus the result will be empty -> no log entry will be made
                        if (result.length === 1) {
                            console.log("Processing..\n" + result[0]);
                            result = result[0].match(/^<div.*?>(.*?exp\)?<\/span>)<\/div>/i)[1];
                            result = result.replace(/<script>.*?<\/script>/, "");
                            console.log("Processed..\n" + result);
                            log = ProcessData(log, xhr.responseText, result, tradeskill);
                        }
                        else {
                            for (var i = 0; i < result.length; i++) {
                                console.log("Processing..\n" + result[i]);
                                result = result[i].match(/^<div.*?>(.*?<\/span>)<\/div>/i)[1];
                                result = result.replace(/<script>.*?<\/script>/, "");
                                console.log("Processed..\n" + result);
                                log = ProcessData(log, xhr.responseText, result[i], tradeskill);
                            }
                        }
                        log.Misc.Attempts.Total++;
                        log.Misc.Attempts.Node = $(".roundResult").length;
                        //Drop analysis done, let's start with the rest
                        var scripts = xhr.responseText.match(/<script>(.*?)<\/script>/g);
                        var miscData = scripts[scripts.length - 1];
                        var currentExp = miscData.match(/exp\:\s*(.*?)\s\//mi)[1].replace(",", "");
                        var neededExp = miscData.match(/exp\:\s*.*?\/\s*(.*?)\s\(/mi)[1].replace(",", "");
                        var attemptTime;
                        if (!settings.url.match(/Disenchanting/i)) {
                            attemptTime = miscData.match(/startTimer\((\d+),*/mi)[1];
                            if (attemptTime < 5000) { attemptTime = 60000; } //Node depleted
                        }
                        else {
                            attemptTime = 0;
                        }
                        //Calculate the needed attempts to next level and update div text in the dialog
                        GetAttemptsToNextLevel(currentExp, neededExp, attemptTime, log[tradeskill].Experience, log[tradeskill].Attempts);
                        //Titlechanging data
                        if (xhr.responseText.match(/cardNone/gi)) { buffData = false; }
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
                        DisplayData(log);                   //Rarity-, Multi- and Materialoverview
                        localStorage.setItem("localLog", JSON.stringify(log));
                    }
                    else {
                        titleData = "Node depleted!";
                        buffData = "node_depleted";
                    }
                    ChangeTitle(titleData, buffData);   //Change the title according to current status
                }
            }
            else if (!settings.url.match(/chat/i)) {
                var buffStatus;
                if (xhr.responseText.match(/no\s?buff/gi)) { buffStatus = ""; }
                else { buffStatus = "yes"; }
                ChangeTitle('Drakor "Innovative & Unique Browser Based RPG." (PBBG, MPOG, MMORPG)', buffStatus);
            }
        }
    });
    SetupLog();
});

function ProcessData(log, responseText, history, tradeskill) {
    history = history.replace(/<script>(.*?)<\/script>/, "");
    var item, amount, exp, gold;
    var today = new Date();
    var localoffset = -(today.getTimezoneOffset() / 60);
    var destoffset = -3;
    var offset = destoffset - localoffset;
    var d = new Date().getTime() + offset * 3600 * 1000;
    var year = new Date().getFullYear(d);
    var month = new Date().getMonth(d) + 1;
    if (month < 10) { month = "0" + month; }
    var day = new Date().getDate(d);
    var hour = new Date().getHours(d) + offset;
    if (hour < 0) { hour = 24 + hour; day--; }
    if (day < 10) { day = "0" + day; }
    if (hour < 10) { hour = "0" + hour; }
    var logDate = year + "/" + month + "/" + day + ": ";
    var key = year + "" + month + "" + day + "" + hour; //Generate a key for the dictionary for stuff per hour mapping
    if (!log[tradeskill][key]) {
        console.log("New Key '" + key + "' created");
        log[tradeskill][key] = {};
        log[tradeskill][key].Amount = 0;
        log[tradeskill][key].Experience = 0;
        log[tradeskill][key].Attempts = 0;
    }
    log[tradeskill].Attempts++;
    log[tradeskill][key].Attempts++;
    log.Misc.Log[log.Misc.Index] = logDate + history; //Add the log to the Object via index
    log[tradeskill].Indexes += log.Misc.Index + "|";
    if (history.match(/anything/i)) { //Nothing-drop
        console.log("You did not find anything.. to bad");
        log[tradeskill].Rarity.Nothing++;
        if (!log[tradeskill].Multi['0 (Nothing)']) {//Multicounter
            log[tradeskill].Multi['0 (Nothing)'] = {};
            log[tradeskill].Multi['0 (Nothing)'].Amount = 1;
        }
        else {
            log[tradeskill].Multi['0 (Nothing)'].Amount++;
        }
        exp = history.match(/>(\d+)\s*exp</mi)[1];
        log[tradeskill][key].Experience += Number(exp);
    }
    else {
        if (history.match(/clink/mi)) { //Creation of clickable items with variating rarities!
            try {
                //Let's first check how many items were created
                console.log("HANDS WHERE I CAN SEE THEM!");
                var createdItem = responseText.match(/\[(.*?)\]/)[1]; //To get the PATTERN name, not the created items name
                console.log("You created the following item: '" + createdItem + "'\nIs that correct?");
                var createdRarities = history.match(/card(\w+)\sclink/ig);
                var createdAmount = Number(createdRarities.length);
                console.log("You created " + createdAmount + " items with this attempt, am I onto something?");
                console.log("The items that were created had the following rarities:");
                for (var i = 0; i < createdRarities.length; i++) { //Write the data into the log object and you should be done
                    var dummy_rarity = createdRarities[i].match(/card(\w+)\s/)[1];
                    log[tradeskill][dummy_rarity]++;
                    console.log(dummy_rarity);
                }
                console.log("Is that correct?");
                if (!log[tradeskill][createdItem]) {
                    console.log("You created something(" + createdItem + ") not known to human kind (Or rather this log)");
                    log[tradeskill][createdItem] = {};
                    log[tradeskill][createdItem].Drop = 1;
                    log[tradeskill][createdItem].Amount = createdAmount;
                    log[tradeskill][createdItem].Index = log.Misc.Index + "|";
                }
                else {
                    log[tradeskill][createdItem].Drop++;
                    log[tradeskill][createdItem].Amount += createdAmount;
                    log[tradeskill][createdItem].Index += log.Misc.Index + "|";
                }
                console.log("And finally, here take that object and show it to someone or something");
                console.log(log[tradeskill][createdItem]);
                if (!log[tradeskill].Multi[createdAmount]) {
                    log[tradeskill].Multi[createdAmount] = {};
                    log[tradeskill].Multi[createdAmount].Amount = 1;
                }
                else {
                    log[tradeskill].Multi[createdAmount].Amount++;
                }
            }
            catch (e) {
                console.log("Something went wrong... " + e.message);
            }
        }
        else {
            var rarity = history.match(/class=\"(\w+)\s?viewmat\">/mi)[1];
            log[tradeskill].Rarity[rarity]++;
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
                log[tradeskill].Items[item].Indexes = log.Misc.Index + "|";
                console.log("First time!!\nItem: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
            }
            else {
                log[tradeskill].Items[item].Drop++;
                log[tradeskill].Items[item].Amount += Number(amount);
                log[tradeskill].Items[item].Indexes += log.Misc.Index + "|";
                console.log("Item: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
            }
        }
        exp = history.match(/>(\d+)\s*exp/mi)[1];
        log[tradeskill][key].Amount += Number(amount);
        log[tradeskill][key].Experience += Number(exp);
    }
    gold = history.match(/\(\+([0-9,]+)\s*gold/i);
    if (!gold) { gold = 0; }
    else { gold = gold[1].replace(",", ""); log.Misc.GoldIndexes += log.Misc.Index + "|"; }
    console.log("Gold: " + gold);
    log.Misc.Index++; //Add 1 to the index for the next attempt.
    log.Misc.TotalExp += Number(exp);
    log[tradeskill].Experience += Number(exp);
    log.Misc.Gold += Number(gold);
    return log;
}

function Create_Log_Object() {
    var log = {};
    log.Misc = {};
    if (document.baseURI.match(/https/)) { log.Misc.Https = true; }
    log.Misc.Attempts = {};
    log.Misc.Attempts.Node = 0;
    log.Misc.Attempts.Total = 0;
    log.Misc.Log = [];
    log.Misc.TotalExp = 0;
    log.Misc.Gold = 0;
    log.Misc.GoldIndexes = ""; //For showing the log of gold drops
    log.Misc.Alert = false;
    log.Misc.Index = 0;
    localStorage.setItem("localLog", JSON.stringify(log));
    return log;
}

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
//Chart/Graph building
function DrawChart(json_string, title_text, chart_type) {
    try { //Sometimes this fails if jchartfx could not be loaded..
        var chart1 = new cfx.Chart();
        if (chart_type.match(/pie/i)) {
            chart1.setGallery(cfx.Gallery.Pie);
        }
        else if (chart_type.match(/bar/i)) {
            chart1.setGallery(cfx.Gallery.Bar);
        }
        else if (chart_type.match(/(lines|graph)/i)) {
            chart1.setGallery(cfx.Gallery.Lines);
        }
        $("#graph_div").html("");
        chart1.create('graph_div');
        chart1.setDataSource(json_string);
        var titles = chart1.getTitles();
        var title = new cfx.TitleDockable();
        title.setText(title_text);
        titles.add(title);
    }
    catch (e) {
        $("#graph_div").html("Something went wrong when creating the Graph..<br/>Error Message: '" + e.message + "'");
    }
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
    var averageGold = Math.floor(log.Misc.Gold / totalAttempts);
    var averageExperience = Math.floor(log.Misc.TotalExp / totalAttempts);
    var averageResources = (totalResources / totalAttempts).toFixed(2);
    var miscOutput = "<p>You have gained " + log.Misc.TotalExp + " total experience(" + averageExperience + " average experience)</p><p>You have collected " +
        log.Misc.Gold + " total gold(" + averageGold + " average gold)</p><p>Attempts/Creations on this node/pattern: " +
        log.Misc.Attempts.Node + "</p><p>Total collection attempts/creations: " + totalAttempts + "</p>";
    for (var tradeskill in log) { //Iterate over tradeskills
        if (tradeskill !== "Misc") { //Don't list the Misc thing
            var tradeskillTitle = "<h3>" + tradeskill + "</h3>";
            console.log(log[tradeskill].Rarity);
            rarityText += tradeskillTitle;
            for (var rarity in colorDict) {
                if (log[tradeskill].Rarity[rarity]) {
                    rarityText += "<p style='color:" + colorDict[rarity] + ";'>" + rarity + ": " + log[tradeskill].Rarity[rarity] + " (" + (log[tradeskill].Rarity[rarity] / log[tradeskill].Attempts * 100).toFixed(2) + "%)</p>";
                }
            }
            materialText += tradeskillTitle;
            for (var item in log[tradeskill].Items) { //Iterate over dropped items
                materialText += "<p>" + item + " x" + log[tradeskill].Items[item].Amount + " (Average gained per attempt: " + (log[tradeskill].Items[item].Amount / log[tradeskill].Items[item].Drop).toFixed(2) + ")</p>";
                totalResources += Number(log[tradeskill].Items[item].Amount);
            }
            multiText += tradeskillTitle;
            for (var multi in log[tradeskill].Multi) { //Iterate over multis
                multiText += "<p>Multi: " + multi + " Gotten: " + log[tradeskill].Multi[multi].Amount + " time(s). (" + (log[tradeskill].Multi[multi].Amount / log[tradeskill].Attempts * 100).toFixed(2) + "%)</p>";
            }
            miscOutput += tradeskillTitle;
            miscOutput += "<p>Total Experience: " + log[tradeskill].Experience + " (" + Math.floor(log[tradeskill].Experience / log[tradeskill].Attempts) + " average Experience)<br/>Total Attempts: " + log[tradeskill].Attempts + "</p>";
        }
    }
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
    var seconds = timeInMs / 1000;
    var interval = Math.floor(seconds / 31536000);
    if (interval > 0) {
        output += interval + " years ";
        seconds -= interval * 31536000;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 0) {
        output += interval + " months ";
        seconds -= interval * 2592000;
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 0) {
        output += interval + " days ";
        seconds -= interval * 86400;
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 0) {
        output += interval + " hours ";
        seconds -= interval * 3600;
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        output += interval + " minutes ";
        seconds -= interval * 60;
    }
    output += Math.floor(seconds) + " seconds";
    return output;
}

function SetupLog() {
    var tradeSelectRarityChart;
    var log = JSON.parse(localStorage.getItem("localLog"));
    var fragment = document.createDocumentFragment();
    var logDiv = $(document.createElement("div")).attr({ id: "logDiv", title: "Drop Log" }).css({ "font-size": "14px", "background-color": "lightgrey", "display": "none" }).html('<ul><li><a href="#materialDiv">Drops/ Creations</a></li>' +
        '<li><a href ="#multiDiv">Multis</a></li>' +
        '<li><a href ="#miscDiv">Miscellaneous</a></li>' +
        '<li><a href ="#rarityDiv">Rarites</a></li>' +
        '<li><a href ="#optionDiv">Options</a></li>' +
        '<li><a href ="#helpDiv">Help(WIP)</a></li>' +
        '<li><a href ="#historyDiv">History</a></li>' +
        '<li><a href ="#graphDiv">Graphs</a></li></ul>').appendTo(fragment);
    var materialDiv = $(document.createElement("div")).attr({ "id": "materialDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("materialDivText")).appendTo(logDiv);
    // $(document.createElement("div")).attr({"id": "materialDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(materialDiv);
    var multiDiv = $(document.createElement("div")).attr({ "id": "multiDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("multiDivText")).appendTo(logDiv);
    // $(document.createElement("label")).attr({"id": "multiDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(multiDiv);
    var miscDiv = $(document.createElement("div")).attr({ "id": "miscDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("miscDivText")).appendTo(logDiv);
    var rarityDiv = $(document.createElement("div")).attr({ "id": "rarityDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("rarityDivText")).appendTo(logDiv);
    var optionsDiv = $(document.createElement("div")).attr({ "id": "optionDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var displayArea = $(document.createElement("textarea")).attr({ autocomplete: "off", spellcheck: "false" }).css({ "width": "750px", "height": "200px", "display": "none" }).appendTo(optionsDiv);
    var helpDiv = $(document.createElement("div")).attr({ "id": "helpDiv" }).css({ "text-align": "left", "display": "inherit" }).html("<h5>What does that [NBA] and [BA] mean in front of my title?</h5>" +
                                                                                                                                      "<p>Basic explanation of the tags are: </br>" +
                                                                                                                                      "[NBA] = No Buff Active - [BA] = Buff Active </br>" +
                                                                                                                                      "This means that it will basically display if you currently got a food buff active or not.</p></br>" +
                                                                                                                                      "<h5>Can I contribute in any way?</h5>" +
                                                                                                                                      "<p>Sure! If you got any suggestion feel free to message Bl00D4NGEL with it. </br>" +
                                                                                                                                      "Can I help with this help file? </br>" +
                                                                                                                                      "Sure thing. Just message Bl00D4NGEL once again with any idea of what could be added to this.</p>").appendTo(logDiv);
    var historyDiv = $(document.createElement("div")).attr({ id: "historyDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var graphDiv = $(document.createElement("div")).attr({ id: "graphDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var graph_div = $(document.createElement("div")).attr({ id: "graph_div" }).css({ "width": "auto", "height": "400px", "text-align": "left", "display": "inherit" }).appendTo(graphDiv);
    if (!log.Misc.Https) { //It should only add the Graph stuff if it can even be loaded which can not be done if the connection is https.
        tradeSelectRarityChart = $(document.createElement("select")).attr({ id: 'tradeSelectRarityChart' }).insertBefore(graph_div);
        var rarityPercentButton = $(document.createElement("button")).text("Rarities").on("click", function () {
            var json_array = [];
            log = JSON.parse(localStorage.getItem("localLog"));
            var tradeskill = $(tradeSelectRarityChart).val();
            if (tradeskill) {
                for (var rarity in log[tradeskill].Rarity) {
                    var json = {};
                    json.Amount = log[tradeskill].Rarity[rarity];
                    json.Rarity = rarity;
                    json_array.push(json);
                }

                console.log(json_array);
                $("#graph_div").html("");
                DrawChart(json_array, "Rarities", "pie");
            }
            else {
                $("#graph_div").html("You didn't select a tradeskill, shame on you!");
            }
        }).insertBefore(graph_div);
        var attemptsAndAmountButton = $(document.createElement("button")).html("Attempts and Amounts<br/>of last 24 hours").on("click", function () {
            if ($(tradeSelectRarityChart).val()) {
                log = JSON.parse(localStorage.getItem("localLog"));
                var jsonAmountAndAttempts = [];
                var yesterdayKey = getYesterdaysDate();
                var yesterdayHour = Number(yesterdayKey.match(/(\d{2}$)/)[1]); //Last two digits are the hour
                var yesterdayWithoutHour = Number(yesterdayKey.match(/(^\d{8})/)[1]); //First 6 digits = year-month-day
                var z = 0;
                while (z < 24) {
                    yesterdayHour++;
                    if (yesterdayHour > 23) {
                        var date = new Date();
                        var month = date.getMonth() + 1;
                        var day = date.getDate() - 1;
                        yesterdayWithoutHour = date.getFullYear() + '' + (month < 10 ? '0' : '') + month + '' + (day < 10 ? '0' : '') + day;
                    } //Add 1 to the Day
                    yesterdayHour = yesterdayHour % 24; //If a value is > 24 it will autoconvert to the "new day"
                    if (yesterdayHour < 10) { yesterdayHour = "0" + yesterdayHour; }
                    var dummy = {};
                    dummy.Date = "" + yesterdayHour; //So it's a string
                    if (log[$(tradeSelectRarityChart).val()][(yesterdayWithoutHour + "" + yesterdayHour)]) {
                        dummy.Amount = log[$(tradeSelectRarityChart).val()][(yesterdayWithoutHour + "" + yesterdayHour)].Amount;
                        dummy.Attempts = log[$(tradeSelectRarityChart).val()][(yesterdayWithoutHour + "" + yesterdayHour)].Attempts;
                    }
                    else {
                        dummy.Amount = 0;
                        dummy.Attempts = 0;
                    }
                    jsonAmountAndAttempts.push(dummy);
                    z++;
                }
                DrawChart(jsonAmountAndAttempts, "Attempts and Amounts of last 24 hours", "lines");
            }
            else {
                $("#graph_div").html("You didn't select a tradeskill, shame on you!");
            }
            // Here you would call the graph-drawer and fill the data it (Would create three different diagrams most likely)
        }).insertBefore(graph_div);
        var experienceButton = $(document.createElement("button")).html("Experience of last 24 hours").on("click", function () {
            if ($(tradeSelectRarityChart).val()) {
                console.log("Creating graph for Experience of the last 24 hours for the Tradeskill '" + $(tradeSelectRarityChart).val() + "'");
                log = JSON.parse(localStorage.getItem("localLog"));
                var jsonExperience = [];
                var yesterdayKey = getYesterdaysDate();
                console.log("Yesterday was: " + yesterdayKey);
                var yesterdayHour = Number(yesterdayKey.match(/(\d{2}$)/)[1]); //Last two digits are the hour
                var yesterdayWithoutHour = Number(yesterdayKey.match(/(^\d{8})/)[1]); //First 6 digits = year-month-day
                var z = 0;
                while (z < 24) {
                    yesterdayHour++;
                    if (yesterdayHour > 23) {
                        var date = new Date();
                        var month = date.getMonth() + 1;
                        var day = date.getDate();
                        yesterdayWithoutHour = date.getFullYear() + '' + (month < 10 ? '0' : '') + month + '' + (day < 10 ? '0' : '') + day;
                    } //Add 1 to the Day
                    yesterdayHour = yesterdayHour % 24; //If a value is > 24 it will autoconvert to the "new day"
                    if (yesterdayHour < 10) { yesterdayHour = "0" + yesterdayHour; }
                    var dummy = {};
                    dummy.Date = "" + yesterdayHour; //So it's a string
                    console.log((yesterdayWithoutHour + "" + yesterdayHour));
                    if (log[$(tradeSelectRarityChart).val()][(yesterdayWithoutHour + "" + yesterdayHour)]) {
                        dummy.Experience = log[$(tradeSelectRarityChart).val()][(yesterdayWithoutHour + "" + yesterdayHour)].Experience;
                    }
                    else {
                        dummy.Experience = 0;
                    }
                    jsonExperience.push(dummy);
                    z++;
                }
                DrawChart(jsonExperience, "Experience of last 24 hours", "lines");
            }
            else {
                $("#graph_div").html("You didn't select a tradeskill, shame on you!");
            }
        }).insertBefore(graph_div);
    }
    else {
        $(graph_div).html("Sorry, but the graphs cannot be loaded in the HTTPS version of Drakor.");
    }
    //Rarity in bar chart
    //drawChart([log[tradeskill].Rarity],"Stats", "graph_div");
    var tradeLog = $(document.createElement("div")).attr({ id: "log" }).appendTo(historyDiv);
    var alertCheckbox = $(document.createElement("input")).attr({ id: "alert", type: "checkbox" }).on("click", function (event) { log.Misc.Alert = $(this).prop('checked'); }).insertBefore(displayArea);
    $(document.createElement("span")).html("Put you to the Drakor page when the node depletes/ the pattern completes?<br/>").insertBefore(displayArea);
    var resetButton = $(document.createElement("button")).attr({ id: "resetButton" }).html("Reset Statistics").css({ "width": "auto", "height": "auto" }).on("click", function () { ResetStatistics(); }).insertBefore(displayArea);
    $(document.createElement("p")).insertBefore(displayArea); //To make a linebreak
    var importButton = $(document.createElement("button")).attr({ value: "import_1" }).html("Import data").css({ "width": "auto", "height": "auto" }).on("click", function () {
        if ($(this).val() === "import_1") {
            $(displayArea).css("display", "block").text("");
            $(this).val("import_2").text("Confirm import");
        }
        else if ($(this).val() === "import_2") {
            localStorage.setItem("localLog", $(displayArea).text());
            alert("Import succesful!");
            $(this).text("Import data");
            $(displayArea).text("").css("display", "none");
        }
    }).insertBefore(displayArea);
    var exportButton = $(document.createElement("button")).attr({ id: "localButton" }).html("Export data").css({ "width": "auto", "height": "auto" }).on("click", function () {
        $(displayArea).text(localStorage.getItem("localLog"));
        $(displayArea).css("display", "block");
        $(importButton).text("Import data");
        $(importButton).val("import_1");
    }).insertBefore(displayArea);
    var tradeSelect = $(document.createElement("select")).attr({ id: "tradeSelect" }).on("change", function () {
        if ($(this).val()) {
            var log = JSON.parse(localStorage.getItem("localLog"));
            $("#materialSelect").find("option").remove().end().append("<option name='' value=''>Select a material</option>");
            var keys = Object.keys(log[$(this).val()].Items).sort();
            for (var i = 0; i < keys.length; i++) {
                if (keys[i] !== "Attempts") {
                    $(document.createElement("option")).attr({ name: keys[i], value: keys[i] }).text(keys[i]).appendTo($("#materialSelect"));
                }
            }
            var text = "<br/>";
            var indexes = log[$(this).val()].Indexes.split("|");
            var start = 0;
            if (indexes.length > 1000) {
                start = indexes.length - 1000;
            }
            for (var j = start; j < indexes.length; j++) {
                text += log.Misc.Log[indexes[j]] + "<br/>";
            }
            $(tradeLog).html(text);
        }
        else {
            $(tradeLog).html("");
            $("#materialSelect").find("option").remove().end().append("<option name='' value=''>Select a material</option>");
        }
    }).insertBefore(tradeLog);
    var materialSelect = $(document.createElement("select")).attr({ id: "materialSelect" }).on("change", function () {
        if ($(this).val()) {
            var log = JSON.parse(localStorage.getItem("localLog"));
            var text = "<br/>";
            var indexes = log[$(tradeSelect).val()].Items[$(this).val()].Indexes.split("|");
            var start = 0;
            if (indexes.length > 1000) {
                start = indexes.length - 1000;
            }
            for (var i = start; i < indexes.length - 1; i++) {
                text += log.Misc.Log[indexes[i]] + "<br/>";
            }
            $(tradeLog).html(text);
        }
        else {
            $(tradeLog).html("");
        }
    }).insertBefore(tradeLog);
    var goldButton = $(document.createElement("button")).attr({ id: "goldButton" }).text("Display gold history").css({ "width": "auto", "height": "auto" }).on("click", function () {
        var log = JSON.parse(localStorage.getItem("localLog"));
        var text = "<br/>";
        var indexes = log.Misc.GoldIndexes.split("|");
        var start = 0;
        if (indexes.length > 1000) {
            start = indexes.length - 1000;
        }
        if (indexes.length === 1) { alert("No gold found yet"); }
        else {
            for (var i = start; i < indexes.length - 1; i++) {
                text += log.Misc.Log[indexes[i]] + "<br/>";
            }
            $(tradeLog).html(text);
        }
    }).insertBefore(tradeLog);
    $(document.createElement("option")).attr({ name: "", value: "" }).text("Select a tradeskill").appendTo(tradeSelect);
    $(document.createElement("option")).attr({ name: "", value: "" }).text("Select a tradeskill").appendTo(tradeSelectRarityChart);
    $(document.createElement("option")).attr({ name: "", value: "" }).text("Select a material").appendTo(materialSelect);
    for (var tradeskill in log) {
        if (tradeskill !== "Misc") {
            $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo(tradeSelect);
            $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo(tradeSelectRarityChart);
        }
    }
    if (log.Misc.Alert) {
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
        width: 850,
        height: 550
    });
    $(fragment).appendTo("#gs_topmenu");
}
function getYesterdaysDate() {
    var date = new Date();
    var localoffset = -(date.getTimezoneOffset() / 60);
    var destoffset = -3;
    var offset = destoffset - localoffset;
    date.setDate(date.getDate() - 1);
    date.setHours(date.getHours() + offset);
    //return date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    return date.getFullYear() + '' + (month < 10 ? '0' : '') + month + '' + (day < 10 ? '0' : '') + day + '' + (hour < 10 ? '0' : '') + hour;
}
function ResetStatistics() {
    var localStorageElements = ["materialDivText", "multiDivText", "rarityDivText", "miscDivText"];
    for (var i = 0 ; i < localStorageElements.length; i++) {
        console.log("Resetting " + localStorageElements[i]);
        localStorage.setItem(localStorageElements[i], "");
        $("#" + localStorageElements[i].slice(0, -4)).html("");
    }
    localStorage.setItem("localLog", "");
    Create_Log_Object();
    $("#materialSelect").find("option").remove().end().append("<option name='' value=''>Select a material</option>");
    $("#tradeSelect").find("option").remove().end().append("<option name='' value=''>Select a tradeskill</option>");
    $("#log").html("");
    console.log("Everything has been re-set");
}