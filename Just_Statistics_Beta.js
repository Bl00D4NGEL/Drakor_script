// ==UserScript==
// @name         Just statistics v1.83
// @version      1.83
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==

/*
New feature (Node data) still need to be tested on pattern skills (e.g. ring crafting) and Treasure Hunting
*/
String.prototype.paddingLeft = function(paddingValue){
    return String(paddingValue + this).slice(-paddingValue.length);
}
$(document).ready(function () {
    var version = "v1.83";
    var last_change = "2016-11-19";
    console.log("You're currently using Just Statistics version " + version + "\nThis version was last edited on the " + last_change);
    //Variable declaration; getting the data out of local storage
    var log;
    if (!localStorage.getItem("localLog")) {
        console.log("Log not found, creating a new one");
        log = Create_Log_Object();
    }
    else {
        try {
            log = JSON.parse(localStorage.getItem("localLog"));
            console.log(log);
            console.log("Log succesfully loaded");
        }
        catch (e) {
            console.log("Dude.. whatever you did with the localStorage variable \"localLog\".. it wasn't a great idea and now everything is gone :(");
            log = Create_Log_Object();
        }
    }
    log.Misc.Version = "Just Statistics version " + version;
    log.Misc.Last_Change = last_change;
    //Load the Graph script EVEN IF the site is https.
    //Can load the chart stuff because it is https.. yay
    $("head").append("<script src='https://rawgit.com/softwarefx/jChartFX/master/js/jchartfx.system.js'><\/script>");
    $("head").append("<script src='https://rawgit.com/softwarefx/jChartFX/master/js/jchartfx.coreVector.js'><\/script>");
    localStorage.setItem("localLog", JSON.stringify(log));
    //Add the "button" to the menu bar
    var showLog = $(document.createElement("a")).attr({ id: "hrefShowLog", class: "gs_topmenu_item" }).text("Show Log").on("click", function () { $(logDiv).dialog("open"); }).appendTo("#gs_topmenu");
    $(document).ajaxComplete(function (event, xhr, settings) {
        if (xhr.status === 200) { //Check if ajax is OK
            if (settings.url.match(/\/world\/action_/)) { //Look if the ajax is a tradeskill action
                log = JSON.parse(localStorage.getItem("localLog")); //Load this up every attempt (Because of import reasons, might be able to load it a little prettier, though)
                var amount, exp, gold, item, history, buffActive = false, titleData, actionStatus;
                var tradeskill = settings.url.match(/action_([a-zA-Z]+).*?\//)[1];
                if (tradeskill === "teleport") { console.log("You teleported.. that's no tradeskill!"); return; }
                tradeskill = tradeskill.toLowerCase();
                var ladder_tradeskill = tradeskill;
                if(tradeskill.match(/Researching/i)){ladder_tradeskill = 'research';}
                $.ajax("/armory_action/" + ladder_tradeskill + "?show=noheader").done(function (data) {
                    try {
                        var currentRank = data.match(/leadResult active.*?#(\d+)<\/span>/i)[1];
                        if (!$("#skillLevel").html().match(/#/)) { //First Time
                            $("#skillLevel").html($("#skillLevel").html() + " (#" + currentRank + ")");
                        }
                        else if ($("#skillLevel").html().match(/#/g).length > 1) {
                            console.log("Aww.. the rank got written down more than once.. let's not do that");
                            $("#skillLevel").html($("#skillLevel").html($("#skillLevel").html().replace(/\s\(.*?$/)));
                        }
                        if (!$("#skillLevel").html().match(/#(\d+)/) || $("#skillLevel").html().match(/#(\d+)\)$/)[1] !== currentRank) {
                            console.log("Current Rank changed.. updating to '" + currentRank + "'");
                            $("#skillLevel").html($("#skillLevel").html($("#skillLevel").html().replace(/\s\(.*?$/)));
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
                    log[tradeskill].Node = {};
                    log[tradeskill].Attempts = 0;
                    log[tradeskill].Indexes = "";
                    log[tradeskill].Experience = 0;
                    $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo($("#tradeSelect"));
                    $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo($("#tradeSelectRarityChart")); //If a new tradeskill is there, add it to the select
                } //If tradeskill is not present in log create it
                console.log("XHR-Responsetext:\n" + xhr.responseText);
                if (!xhr.responseText.match(/depleted/i)) {
                    try{
                        // var regex = /<div class="roundResult areaName">(.*?exp\)?<\/span><\/div>)/gi;
                        // var result = regex.exec(xhr.responseText); //Basic regex to get only the necessary data.
                        var result = xhr.responseText.match(/<div class="roundResult areaName">.*?exp\s*\)?<\/span><\/div>/gi);
                        //Attention, creating skills will confuse this because not every creation gives exp, but rather a full attempt will.
                        if (result) { //This will always say true UNLESS you worked in another window thus the result will be empty -> no log entry will be made
                            var nodeId = xhr.responseText.match(/starttimer\(.*?action_.*?-(.*?)-/i);
                            // if(nodeId){console.log("Node-Id is: " + nodeId[1]);}
                            var nodeName = $(".locationTitle").text();
                            //Attention! If the node is a settlement node, the level-range can be adjusted. Same goes for TH => adjust node level range to currently selected level range
                            if(nodeName.match(/settlement|treasure/i)){
                                console.log("You're working on a Settlement node or a TH node!");
                                nodeName = nodeName.match(/(.*?)\(/)[1]; //Only the text is what we want for the log.
                                var selectLevelFrom = $("#minRange").val();;
                                var selectLevelTo = $("#maxRange").val();;
                                nodeName += "(Node Level "  + selectLevelFrom + " - " + selectLevelTo + ")";
                                console.log("Changed node-name to: " + nodeName);
                            }
                            if (result.length === 1) {
                                console.log("Processing..\n" + result[0]);
                                result = result[0].match(/^<div.*?>(.*?exp\s*\)?<\/span>)<\/div>/i)[1];
                                result = result.replace(/<script>.*?<\/script>/, "");
                                console.log("Processed..\n" + result);
                                log = ProcessData(log, xhr.responseText, result, tradeskill, nodeName);
                            }
                            else {
                                for (var i = 0; i < result.length; i++) {
                                    console.log("Processing..\n" + result[i]);
                                    result = result[i].match(/^<div.*?>(.*?<\/span>)<\/div>/i)[1];
                                    result = result.replace(/<script>.*?<\/script>/, "");
                                    console.log("Processed..\n" + result);
                                    log = ProcessData(log, xhr.responseText, result[i], tradeskill, nodeName);
                                }
                            }
                            log.Misc.Attempts.Total++;
                            log.Misc.Attempts.Node = $(".roundResult").length;
                            //Drop analysis done, let's start with the rest
                            var scripts = xhr.responseText.match(/<script>(.*?)<\/script>/g);
                            var miscData = scripts[scripts.length - 1];
                            var currentExp = miscData.match(/\(\'exp\:\s*(.*?)\s\//mi)[1].replace(",", "");
                            var neededExp = miscData.match(/\(\'exp\:\s*.*?\/\s*(.*?)\s\(/mi)[1].replace(",", "");
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
                            var buffrarity = xhr.responseText.match(/dricon\scard(\w+)\sslot_default/i);
                            if (buffrarity[1] !== 'None') { buffActive = true; }
                            if (xhr.responseText.match(/\d+%\sof/gi)) {
                                titleData = xhr.responseText.match(/(\d+)%\sof/i)[1] + "% of Node left";
                            }
                            else if (xhr.responseText.match(/x\d+\.\.\./)) {
                                titleData = xhr.responseText.match(/x(\d+)\.\.\./)[1] + " attempts left";
                            }
                            else {
                                titleData = "Creation done!";
                                actionStatus = "alert";
                            }
                            DisplayData(log);                   //Rarity-, Multi- and Materialoverview
                        }
                    }
                    catch(e){
                        console.log("Why do you do this to me..\n" + e.message);
                        console.log(e);
                    }
                }
                else {
                    titleData = "Node depleted!";
                    actionStatus = "alert";
                }
                ChangeTitle(titleData, buffActive, actionStatus);   //Change the title according to current status
                try { //If the localstorage space is used up, this won't work
                    localStorage.setItem("localLog", JSON.stringify(log));
                    $(showLog).text("Show Log");
                }
                catch (e) {
                    if (!$(showLog).text().match(/!/)) {//Add an exclamation mark to the show log button to notify the user the saving went bad
                        $(showLog).text($(showLog.text() + " (!!!)"));
                    }
                }
            }
        }
    });
    SetupLog();
});

function ProcessData(log, responseText, history, tradeskill, nodeName) {
    try {
        history = history.replace(/<script>(.*?)<\/script>/, "");

        var log_history = history;
        log_history = log_history.replace(/<\/?.*?>/g, "");
        var item, amount, multi, exp, gold, rarity;
        try {
            exp = history.match(/>(\d+)\s*exp/mi)[1];
        }
        catch (e) { //If you're max level it will display + x total exp
            exp = history.match(/\+<b>(\d+)<\/b>/i);
            if (!exp) { //If this still fails for whatever reason, just default to 0 exp
                exp = 0;
                //Log the error in the history.
                console.log("When processing the experience gained an error occured and the gained exp was set to 0..\nMessage: " + e.message);
                if (!log.Misc.Log[log.Misc.Index]) {
                    log.Misc.Log[log.Misc.Index] = "Something went wrong when trying to get the exp..<br/>Message: " + e.message;
                }
                else {
                    log.Misc.Log[log.Misc.Index] += "Something went wrong when trying to get the exp..<br/>Message: " + e.message;
                }
            }
            else {
                exp = exp[1];
            }
        }
        var date = new Date();
        date.setTime(date.getTime() + (-3 + date.getTimezoneOffset() / 60) * 60 * 60 * 1000);//So the date is synced with Drakor timers
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var logDate = date.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
        var key = (logDate + (hour < 10 ? '0' : '') + hour).replace(/\D/g, ""); //Generate a key for the dictionary for stuff per hour mapping
        if (!log[tradeskill][key]) {
            console.log("New Key '" + key + "' created");
            log[tradeskill][key] = {};
            log[tradeskill][key].Amount = 0;
            log[tradeskill][key].Experience = 0;
            log[tradeskill][key].Attempts = 0;
        }
        if(!log[tradeskill].Node){log[tradeskill].Node = {};} //For older versions
        if(!log[tradeskill].Node[nodeName]){
            console.log(nodeName + " is a new node and will be added to the object");
            log[tradeskill].Node[nodeName] = {};
            log[tradeskill].Node[nodeName].Items = {};
            log[tradeskill].Node[nodeName].Rarity = {};
            var rarities = ['Nothing', 'Common', 'Superior', 'Rare', 'Epic', 'Legendary'];
            for(var i=0;i<rarities.length;i++){log[tradeskill].Node[nodeName].Rarity[rarities[i]] = 0;}
            log[tradeskill].Node[nodeName].Misc = {};
            log[tradeskill].Node[nodeName].Misc.Experience = 0;
            log[tradeskill].Node[nodeName].Misc.Attempts = 0;
            console.log(log[tradeskill].Node[nodeName]);
        }
        log[tradeskill].Attempts++;
        log[tradeskill].Node[nodeName].Misc.Attempts++;
        if ($("#history").prop('checked')) {
            log.Misc.Log[log.Misc.Index] = logDate + log_history; //Add the log to the Object via index
            log[tradeskill].Indexes += log.Misc.Index + "|";
            log.Misc.Index++; //Add 1 to the index for the next attempt.
        }
        if (history.match(/anything/i)) { //Nothing-drop
            console.log("You did not find anything.. to bad");
            log[tradeskill].Rarity.Nothing++;
            log[tradeskill].Node[nodeName].Rarity.Nothing++;
            multi = 0;
            amount = 1; //I dropped ONE item whose name is NOTHING
            item = "Nothing";
            rarity = "Nothing";
        }
        else {
            if (history.match(/clink/mi)) { //Creation of clickable items with variating rarities!
                try {
                    //Let's first check what and how many items were created
                    item = responseText.match(/\[(.*?)\]/)[1]; //To get the PATTERN name, not the created items name
                    rarity = history.match(/card(\w+)\sclink/ig);
                    amount = Number(rarity.length);
                    for (var i = 0; i < rarity.length; i++) { //Write the data into the log object and you should be done
                        var dummy_rarity = rarity[i].match(/card(\w+)\s/)[1];
                        log[tradeskill][dummy_rarity]++;
                        log[tradeskill].Node[nodeName].Rarity[dummy_rarity]++;
                        console.log("Crafted rarity: " + dummy_rarity);
                    }
                }
                catch (e) {
                    console.log("Something went wrong when trying to process a linkable item... " + e.message);
                }
            }
            else {
                rarity = history.match(/class=\"(\w+)\s?viewmat\">/mi)[1];
                log[tradeskill].Rarity[rarity]++;
                log[tradeskill].Node[nodeName].Rarity[rarity]++;
                item = history.match(/\[.*?\].*\[(.*?)\]/)[1];
                amount = history.match(/<\/span>\s*x(\d+)/)[1];
            }
            multi = amount;
        }
        log[tradeskill][key].Attempts++;
        log[tradeskill][key].Amount += Number(amount);
        log[tradeskill][key].Experience += Number(exp);
        if (!log[tradeskill].Multi[multi]) {//Multicounter
            log[tradeskill].Multi[multi] = {};
            log[tradeskill].Multi[multi].Amount = 1;
        }
        else {
            log[tradeskill].Multi[multi].Amount++;
        }
        if (!log[tradeskill].Items[item]) { //Itemcounter
            log[tradeskill].Items[item] = {};
            log[tradeskill].Items[item].Drop = 1;
            log[tradeskill].Items[item].Amount = Number(amount);
            if ($("#history").prop('checked')) {
                log[tradeskill].Items[item].Indexes = log.Misc.Index + "|";
            }
            console.log("First time!!\nItem: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
        }
        else {
            log[tradeskill].Items[item].Drop++;
            log[tradeskill].Items[item].Amount += Number(amount);

            if ($("#history").prop('checked')) {
                log[tradeskill].Items[item].Indexes += log.Misc.Index + "|";
            }
            console.log("Item: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
        }
        if(!log[tradeskill].Items[item].Rarity){ //If rarity hasn't been set yet (Older versions did not have this)
            log[tradeskill].Items[item].Rarity = rarity; //This will take the last-generated rarity on this function (Pattern that create different rarities *will* bug on this.
        }
        if(!log[tradeskill].Node[nodeName].Items[item]){
            log[tradeskill].Node[nodeName].Items[item] = {};
            log[tradeskill].Node[nodeName].Items[item].Attempts = 1;
            log[tradeskill].Node[nodeName].Items[item].Rarity = rarity; //This will take the last-generated rarity on this function (Pattern that create different rarities *will* bug on this.

        }
        else{
            log[tradeskill].Node[nodeName].Items[item].Attempts++;
        }
        gold = history.match(/\(\+([0-9,]+)\s*gold/i);
        if (!gold) { gold = 0; }
        else { gold = gold[1].replace(",", ""); log.Misc.GoldIndexes += log.Misc.Index + "|"; }
        log.Misc.TotalExp += Number(exp);
        log[tradeskill].Experience += Number(exp);
        log[tradeskill].Node[nodeName].Misc.Experience += Number(exp);
        log.Misc.Gold += Number(gold);
        return log;
    }
    catch (e) {
        console.log("Oops, something went wrong when trying to process the data in the ProcessData function.. Message: " + e.message + "\nException:");
        console.log(e);
        return log;
    }
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
    log.Misc.History = true;
    log.Misc.Index = 0;
    localStorage.setItem("localLog", JSON.stringify(log));
    return log;
}

function ChangeTitle(titleText, buffActive, actionStatus) {
    var foodBuffInfo = "[NBA] ";
    var log = JSON.parse(localStorage.getItem("localLog"));
    if (buffActive) { foodBuffInfo = "[BA] "; }
    if (actionStatus === "alert") {
        console.log("Log object:");
        console.log(log);
        try {
            if (log.Misc.Alert) {
                alert("Creation completed/Node depleted!");
            }
        }
        catch (e) {
            console.log("Come on.. what is wrong with the damn alert :(\n" + e.message);
        }
    }
    $("title").text((foodBuffInfo + titleText));
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
    localStorage.setItem("expText", "<p>Experience left to level-up: <b>" + diffExp + "</b><br/>Average attempts to level-up: " + attemptsToLevel +
                         "<br/>This takes about <b>" + stringTimeToLevel + "</b> on this node</p>");
}

function ExportDataWithoutHistory() {
    var log = JSON.parse(localStorage.getItem("localLog"));
    log.Misc.Log = [];
    log.Misc.GoldIndexes = "";
    for (var tradeskill in log) {
        if (tradeskill !== "Misc") {
            log[tradeskill].Indexes = "";
            for (var item in log[tradeskill].Items) {
                log[tradeskill].Items[item].Indexes = "";
            }
        }
    }
    log.Misc.Index = 0;
    console.log(log);
    return log;
}

function GetPercent(val1, val2){
    return (val1/val2*100).toFixed(2);
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
    var nodeText = "";
    var averageGold = Math.floor(log.Misc.Gold / totalAttempts);
    var averageExperience = Math.floor(log.Misc.TotalExp / totalAttempts);
    var averageResources = (totalResources / totalAttempts).toFixed(2);
    var miscOutput = "<h4>" + log.Misc.Version + " last updated on " + log.Misc.Last_Change + "</h4><p>You have gained " + log.Misc.TotalExp + " total experience(" + averageExperience + " average experience)</p><p>You have collected " +
        log.Misc.Gold + " total gold(" + averageGold + " average gold)</p><p>Attempts/Creations on this node/pattern: " +
        log.Misc.Attempts.Node + "</p><p>Total collection attempts/creations: " + totalAttempts + "</p>";
    for (var tradeskill in log) { //Iterate over tradeskills
        if (tradeskill !== "Misc") { //Don't list the Misc thing
            var tradeskillTitle = "<h3>" + tradeskill + "</h3>";
            console.log(log[tradeskill].Rarity);
            rarityText += tradeskillTitle;
            for (var rarity in colorDict) {
                if (log[tradeskill].Rarity[rarity]) {
                    var percent = GetPercent(log[tradeskill].Rarity[rarity], log[tradeskill].Attempts);
                    if(percent < 100){percent = percent.paddingLeft(Array(6).join('0'));}
                    rarityText += "<pre style='color:" + colorDict[rarity] + ";'>" +
                        (rarity + ": " + log[tradeskill].Rarity[rarity] + "/" + log[tradeskill].Attempts +
                         " (" + percent + "%)</pre>").paddingLeft(Array(48).join(' '));
                }
            }
            materialText += tradeskillTitle;
            for (var item in log[tradeskill].Items) { //Iterate over dropped items
                var itemString = item + " x" + log[tradeskill].Items[item].Amount;
                itemString = itemString.paddingLeft(Array(32).join(' '));
                var percent = GetPercent(log[tradeskill].Items[item].Drop, log[tradeskill].Attempts);
                if(percent < 100){percent = percent.paddingLeft(Array(6).join('0'));}
                itemString += " (Average: " + (log[tradeskill].Items[item].Amount / log[tradeskill].Items[item].Drop).toFixed(2) +
                    " | Raw Drops/Creations: " + log[tradeskill].Items[item].Drop + "/" + log[tradeskill].Attempts +
                    " [" + percent + " %])</pre>";
                materialText += "<pre style='color:" + colorDict[log[tradeskill].Items[item].Rarity] + "';>" + itemString;
                totalResources += Number(log[tradeskill].Items[item].Amount);
            }
            multiText += tradeskillTitle;
            for (var multi in log[tradeskill].Multi) { //Iterate over multis
                var percent = GetPercent(log[tradeskill].Multi[multi].Amount, log[tradeskill].Attempts);
                if(percent < 100){percent = percent.paddingLeft(Array(6).join('0'));}
                multiText += "<pre>" + ("Multi: " + multi + " Gotten: " + log[tradeskill].Multi[multi].Amount + "/" + log[tradeskill].Attempts +
                                        " time(s). (" + percent + "%)</pre>").paddingLeft(Array(48).join(' '));;
            }
            miscOutput += tradeskillTitle;
            miscOutput += "<p>Total Experience: " + log[tradeskill].Experience + " (" + Math.floor(log[tradeskill].Experience / log[tradeskill].Attempts) + " average Experience)<br/>Total Attempts: " + log[tradeskill].Attempts + "</p>";
            for(var node in log[tradeskill].Node){
                nodeText += "<h3>" + node + "</h3><p>You gained " + log[tradeskill].Node[node].Misc.Experience +
                    " experience and performed a total of " + log[tradeskill].Node[node].Misc.Attempts + " attempts on this node.</p><h4>Items</h4>";
                for(var item in log[tradeskill].Node[node].Items){
                    var percent = GetPercent(log[tradeskill].Node[node].Items[item].Attempts, log[tradeskill].Node[node].Misc.Attempts);
                    if(percent < 100){percent = percent.paddingLeft(Array(6).join('0'));}
                    nodeText += "<pre style='color:" + colorDict[log[tradeskill].Node[node].Items[item].Rarity] + ";'>" +
                        (item + " => " + log[tradeskill].Node[node].Items[item].Attempts + "/" + log[tradeskill].Node[node].Misc.Attempts +
                         " (" + percent + "%)</pre>").paddingLeft(Array(48).join(' '));
                }
                nodeText += "<h4>Rarity</h4>";
                for(var rarity in log[tradeskill].Node[node].Rarity){
                    if(log[tradeskill].Node[node].Rarity[rarity]){
                        var percent = GetPercent(log[tradeskill].Node[node].Rarity[rarity], log[tradeskill].Node[node].Misc.Attempts);
                        if(percent < 100){percent = percent.paddingLeft(Array(6).join('0'));}
                        nodeText += "<pre style='color:" + colorDict[rarity] + ";'>" +
                            (rarity + ": " + log[tradeskill].Node[node].Rarity[rarity] + "/" + log[tradeskill].Node[node].Misc.Attempts +
                             " (" + percent + "%)</pre>").paddingLeft(Array(48).join(' '));
                    }
                }
            }
        }
    }
    $("#rarityDiv").html(rarityText);
    localStorage.setItem("rarityDivText", $("#rarityDiv").html());
    $("#materialDiv").html(materialText);
    localStorage.setItem("materialDivText", $("#materialDiv").html());
    $("#multiDiv").html(multiText);
    localStorage.setItem("multiDivText", $("#multiDiv").html());
    $("#miscDiv").html(localStorage.getItem("expText") + miscOutput); //Add the previous text there because of exp information.
    localStorage.setItem("miscDivText", $("#miscDiv").html());
    $("#nodeDiv").html(nodeText);
    localStorage.setItem("nodeDivText", $("#nodeDiv").html());
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
        output += interval + " year(s) ";
        seconds -= interval * 31536000;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 0) {
        output += interval + " month(s) ";
        seconds -= interval * 2592000;
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 0) {
        output += interval + " day(s) ";
        seconds -= interval * 86400;
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 0) {
        output += interval + " hour(s) ";
        seconds -= interval * 3600;
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        output += interval + " minute(s) ";
        seconds -= interval * 60;
    }
    output += Math.floor(seconds) + " seconds";
    return output;
}

/*
logObject is the log object with the tradeskill you want the data for
thingsToLookFor is an Array of the keys (Amount, Attempts, Experience)
timeFrom will be the date to start at
timeTo will be the date to stop at (will stop at the current date)
*/
function CollectDataForChart(logObject, thingsToLookFor, timeFrom, timeTo) {
    var returnArray = [];
    var date = new Date();
    date.setTime(date.getTime() + (-3 + date.getTimezoneOffset() / 60) * 60 * 60 * 1000);
    var month = date.getMonth();
    var day = date.getDate();
    var hour = date.getHours();
    var currentDate = date.getFullYear() + '' + (month < 10 ? '0' : '') + month + '' + (day < 10 ? '0' : '') + day + (hour < 10 ? '0' : '') + hour;
    if (Number(timeTo) > Number(currentDate)) {
        console.log("Eww, the user entered a date in the future..");
        timeTo = currentDate;
    }
    var toYear = timeTo.substring(0, 4);
    var toMonth = timeTo[4] + timeTo[5];
    var toDay = timeTo[6] + timeTo[7];
    var toHour = timeTo[8] + timeTo[9];
    date.setFullYear(toYear);
    date.setMonth(toMonth);
    date.setDate(toDay);
    date.setHours(toHour);
    var fromDate = new Date();
    var fromYear = timeFrom.substring(0, 4);
    var fromMonth = timeFrom[4] + timeFrom[5];
    var fromDay = timeFrom[6] + timeFrom[7];
    var fromHour = timeFrom[8] + timeFrom[9];
    fromDate.setFullYear(fromYear);
    fromDate.setMonth(fromMonth);
    fromDate.setDate(fromDay);
    fromDate.setHours(fromHour);
    var diffHours = Math.round((date - fromDate) / 3600000);
    console.log("Diffhours: " + diffHours);
    for (var i = 0; i < diffHours; i++) {
        fromDate.setHours(fromDate.getHours() + 1);
        month = fromDate.getMonth() + 1;
        day = fromDate.getDate();
        hour = fromDate.getHours();
        var key = fromDate.getFullYear() + '' + (month < 10 ? '0' : '') + month + '' + (day < 10 ? '0' : '') + day + (hour < 10 ? '0' : '') + hour;
        // console.log(key);
        var dummy = {};
        for (var j = 0; j < thingsToLookFor.length; j++) {
            dummy.Date = key;
            if (logObject[key]) {
                dummy[thingsToLookFor[j]] = logObject[key][thingsToLookFor[j]];
            }
            else if (returnArray.length > 1) {
                dummy[thingsToLookFor[j]] = 0;
            }
        }
        // console.log(dummy);
        if (!logObject[key] && returnArray.length === 0) { continue; }
        returnArray.push(dummy);
        // console.log(fromDate);
    }
    // console.log(returnArray);
    return returnArray;
}

function DisplayHistory(logObject) {
    var indexes = [];
    try {
        indexes = logObject.Indexes.split("|");
    }
    catch (e) {
        if (logObject) { //Maybe it's the goldindexes that we are looking for
            try {
                indexes = logObject.split("|");
            }
            catch (e) {
                $("#log").html("Something went wrong when processing your data..<br/>" + e.message);
                return;
            }
        }
        else { //Well.. if not.. just throw an error message
            $("#log").html("Something went wrong when processing your data..<br/>" + e.message);
            return;
        }
    }
    var log = JSON.parse(localStorage.getItem("localLog"));
    var text = "";
    var start = 0;
    if (indexes.length > 1000) {
        start = indexes.length - 1000;
    }
    if (!$("#reverseCheckbox").prop('checked')) {
        for (var i = start; i < indexes.length - 1; i++) {
            if (log.Misc.Log[indexes[i]]) {
                text += log.Misc.Log[indexes[i]] + '<br/>';
            }
        }
    }
    else {
        for (var j = indexes.length - 2; j > start; j--) {
            if (log.Misc.Log[indexes[j]]) {
                text += log.Misc.Log[indexes[j]] + '<br/>';
            }
        }
    }
    $("#log").html(text);
}

function SetupLog() {
    var tradeSelectRarityChart;
    var log = JSON.parse(localStorage.getItem("localLog"));
    var fragment = document.createDocumentFragment();
    var logDiv = $(document.createElement("div")).attr({ id: "logDiv", title: "Drop Log" })
    .css({ "font-size": "14px", "background-color": "lightgrey", "display": "none" })
    .html('<ul><li><a href="#materialDiv">Items</a></li>' +
          '<li><a href ="#multiDiv">Multis</a></li>' +
          '<li><a href ="#rarityDiv">Rarites</a></li>' +
          '<li><a href ="#nodeDiv">Node data</a></li>' +
          '<li><a href ="#miscDiv">Miscellaneous</a></li>' +
          '<li><a href ="#optionDiv">Options</a></li>' +
          '<li><a href ="#helpDiv">Help</a></li>' +
          '<li><a href ="#historyDiv">History</a></li>' +
          '<li><a href ="#graphDiv">Graphs</a></li></ul>').appendTo(fragment);
    var materialDiv = $(document.createElement("div")).attr({ "id": "materialDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("materialDivText")).appendTo(logDiv);
    // $(document.createElement("div")).attr({"id": "materialDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(materialDiv);
    var multiDiv = $(document.createElement("div")).attr({ "id": "multiDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("multiDivText")).appendTo(logDiv);
    // $(document.createElement("label")).attr({"id": "multiDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(multiDiv);
    var miscDiv = $(document.createElement("div")).attr({ "id": "miscDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("miscDivText")).appendTo(logDiv);
    var rarityDiv = $(document.createElement("div")).attr({ "id": "rarityDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("rarityDivText")).appendTo(logDiv);
    var nodeDiv = $(document.createElement("div")).attr({"id": "nodeDiv"}).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("nodeDivText")).appendTo(logDiv);
    var optionsDiv = $(document.createElement("div")).attr({ "id": "optionDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var displayArea = $(document.createElement("textarea")).attr({ id: "displayArea", autocomplete: "off", spellcheck: "false" }).css({ "width": "750px", "height": "200px", "display": "none" }).appendTo(optionsDiv);
    var helpDiv = $(document.createElement("div")).attr({ "id": "helpDiv" }).css({ "text-align": "left", "display": "inherit" }).html("<h5>Why are there three exclamation marks next to the \"Show Log\" button?</h5>" +
                                                                                                                                      "<p>This means that the saving of your data did <b>not</b> succeed. " +
                                                                                                                                      "You can now do the following to be able to keep being able to collect statistics by doing the following:<br/>" +
                                                                                                                                      "<ol><li>Reset your data in the \"Options\" tab by clicking on the \"Reset Statistics\" button or</li>" +
                                                                                                                                      "<li>In the \"Options\" tab, click on the button \"Export data without the history\" then select the the whole text (Click into the text field and press Control + a) that is in there and copy it (Control + C)" +
                                                                                                                                      "then you need to click on the \"Import data\" button and paste (Control + V) the text into there and hit the \"Confirm import\" button.</li></ol>" +
                                                                                                                                      "Now your old stats (Dropped/created things, multis, rarities) are carried over but the history of the drops (e.g. You collected [material] x times) " +
                                                                                                                                      "is not accessible anymore, though the graphs will still work.</p>" +
                                                                                                                                      "<h5>What does that [NBA] and [BA] mean in front of my title?</h5>" +
                                                                                                                                      "<p>Basic explanation of the tags are: </br>" +
                                                                                                                                      "[NBA] = No Buff Active - [BA] = Buff Active </br>" +
                                                                                                                                      "This means that it will basically display if you currently got a food buff active or not.</p></br>" +
                                                                                                                                      "<h5>Can I contribute in any way?</h5>" +
                                                                                                                                      "<p>Sure! If you got any suggestion feel free to message Bl00D4NGEL with it.</p>" +
                                                                                                                                      "<h5>Can I help with this help file?</h5>" +
                                                                                                                                      "<p>Sure thing. Just message Bl00D4NGEL once again with any idea of what could be added to this.</p>").appendTo(logDiv);
    var historyDiv = $(document.createElement("div")).attr({ id: "historyDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var graphDiv = $(document.createElement("div")).attr({ id: "graphDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var graph_div = $(document.createElement("div")).attr({ id: "graph_div" }).css({ "width": "auto", "height": "400px", "text-align": "left", "display": "inherit" }).appendTo(graphDiv);
    if (!log.Misc.Https) { //It should only add the Graph stuff if it can even be loaded which can not be done if the connection is https.
        var formDiv = $(document.createElement("div")).css("display", "block").insertBefore(graph_div);
        $(document.createElement("span")).text("Select a tradeskill").insertBefore(formDiv);
        var graphForm = $(document.createElement("form")).on("submit", function (e) { e.preventDefault(); }).appendTo(formDiv);
        var tradeskillSelect = $(document.createElement("select")).insertBefore(formDiv);
        var rarityButton = $(document.createElement("button")).attr({ id: "rarityButton" }).css("display", "none").html("Rarities").on("click", function () {
            var jsonArray = [];
            for (var rarity in log[$(tradeskillSelect).val()].Rarity) {
                var json = {};
                json.Amount = log[$(tradeskillSelect).val()].Rarity[rarity];
                json.Rarity = rarity;
                jsonArray.push(json);
            }
            DrawChart(jsonArray, "Rarities", "Pie");
        }).insertBefore(formDiv);
        for (var tradeskill in log) {
            if (tradeskill === "Misc") { continue; }
            $(document.createElement("option")).attr({ value: tradeskill }).text(tradeskill).appendTo(tradeskillSelect);
        }
        $(document.createElement("span")).html("Select the details you want to display<br/>").appendTo(graphForm);
        var details = ["Amount", "Attempts", "Experience"];
        for (var i = 0; i < details.length; i++) {
            $(document.createElement("input")).attr({ type: "checkbox", class: "checkbox-graph", id: "graph-" + details[i] }).appendTo(graphForm);
            $(document.createElement("span")).text(details[i]).on("click", function () { $("#graph-" + $(this).text()).click(); }).appendTo(graphForm);
        }
        var fromToArray = ["from", "to"]; //For id-mapping
        var selectArray = ["Year", "Month", "Day", "Hour"]; //For select-id-
        for (var j = 0; j < fromToArray.length; j++) {
            $(document.createElement("span")).html("<br/>Select data " + fromToArray[j] + " (Format: Year/Month/Day/Hour)<br/>").appendTo(graphForm);
            for (var element = 0; element < selectArray.length; element++) {
                var isCurrent = false;
                var d = new Date();
                d.setTime(d.getTime() + (-3 + d.getTimezoneOffset() / 60) * 60 * 60 * 1000);
                var select = $(document.createElement("select")).attr({ id: fromToArray[j] + "-" + selectArray[element] }).appendTo(graphForm);
                if (selectArray[element] === "Year") {
                    for (var year = 2016; year <= d.getFullYear() ; year++) {
                        $(document.createElement("option")).attr({ value: year }).text(year).appendTo(select);
                    }
                }
                else if (selectArray[element] === "Month") {
                    var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    for (var month = 0; month < monthArray.length; month++) {
                        if (d.getMonth() === month) { isCurrent = true; } else { isCurrent = false; }
                        $(document.createElement("option")).attr({ value: (month < 10 ? '0' : '') + month, selected: isCurrent }).text(monthArray[month]).appendTo(select);
                    }
                }
                else if (selectArray[element] === "Day") {
                    for (var day = 1; day < 32; day++) {
                        if (Number(d.getDate()) - 1 === day && fromToArray[j] === "from") { isCurrent = true; }
                        else if (Number(d.getDate()) === day && fromToArray[j] === "to") { isCurrent = true; }
                        else { isCurrent = false; }
                        $(document.createElement("option")).attr({ value: (day < 10 ? '0' : '') + day, selected: isCurrent }).text(day).appendTo(select);
                    }
                }
                else {
                    for (var hour = 0; hour < 24; hour++) {
                        if (d.getHours() === hour) { isCurrent = true; } else { isCurrent = false; }
                        $(document.createElement("option")).attr({ value: (hour < 10 ? '0' : '') + hour, selected: isCurrent }).text(hour).appendTo(select);
                    }
                }
            }

        }
        $(document.createElement("button")).attr({ type: "submit" }).text("Show graph").on("click", function () {
            var graphArray = [];
            var checkboxes = $(".checkbox-graph");
            for (var i = 0; i < checkboxes.length; i++) {
                if ($(checkboxes[i]).prop('checked')) {
                    graphArray.push($(checkboxes[i]).attr('id').substring(6));
                }
            }
            if (graphArray.length === 0) { alert("You need to at least select one of the three details to display.."); return; }
            var timeFrom = $("#from-Year").val() + $("#from-Month").val() + $("#from-Day").val() + $("#from-Hour").val();
            var timeTo = $("#to-Year").val() + $("#to-Month").val() + $("#to-Day").val() + $("#to-Hour").val();
            if (Number(timeFrom) > Number(timeTo)) { alert("Your date range is not correct, check again!"); return; }
            var jsonArray = CollectDataForChart(log[$(tradeskillSelect).val()], graphArray, timeFrom, timeTo);
            DrawChart(jsonArray, "", "graph");
        }).appendTo(graphForm);
    }
    else {
        $(graph_div).html("Sorry, but the graphs cannot be loaded in the HTTPS version of Drakor.");
    }
    //Rarity in bar chart
    //drawChart([log[tradeskill].Rarity],"Stats", "graph_div");
    var tradeLog = $(document.createElement("div")).attr({ id: "log" }).appendTo(historyDiv);
    var alertCheckbox = $(document.createElement("input")).attr({ id: "alert", type: "checkbox" }).on("click", function (event) {
        var log = JSON.parse(localStorage.getItem("localLog"));
        log.Misc.Alert = $(this).prop('checked');
        localStorage.setItem("localLog", JSON.stringify(log));
    }).prop('checked', log.Misc.Alert).insertBefore(displayArea);
    var alertSpan = $(document.createElement("span")).html("Put you to the Drakor page when the node depletes/ the pattern completes?<br/>").insertBefore(displayArea);
    var historyCheckbox = $(document.createElement("input")).attr({ id: "history", type: "checkbox" }).on("click", function (event) {
        var log = JSON.parse(localStorage.getItem("localLog"));
        log.Misc.History = $(this).prop('checked');
        localStorage.setItem("localLog", JSON.stringify(log));
    }).prop('checked', log.Misc.History).appendTo(alertSpan);
    $(document.createElement("span")).html("Keep the history of your drops/creations?<br/>").insertBefore(displayArea);
    var resetButton = $(document.createElement("button")).attr({ id: "resetButton" }).html("Reset Statistics").css({ "width": "auto", "height": "auto" }).on("click", function () { ResetStatistics(); }).insertBefore(displayArea);
    $(document.createElement("p")).insertBefore(displayArea); //To make a linebreak
    var importButton = $(document.createElement("button")).attr({ value: "import_1" }).html("Import data").css({ "width": "auto", "height": "auto" }).on("click", function () {
        if ($(this).val() === "import_1") {
            $(displayArea).css("display", "block").val("");
            $(this).val("import_2").text("Confirm import");
        }
        else if ($(this).val() === "import_2") {
            try {
                if (!$("#displayArea").val()) { return; }
                localStorage.setItem("localLog", $("#displayArea").val());
                alert("Import succesful!");
                $(this).text("Import data");
                $(displayArea).val("").css("display", "none");
            }
            catch (e) {
                alert("Something went wrong.. " + e.message);
            }
        }
    }).insertBefore(displayArea);
    var exportButton = $(document.createElement("button")).attr({ id: "localButton" }).html("Export data").css({ "width": "auto", "height": "auto" }).on("click", function () {
        $(displayArea).val(localStorage.getItem("localLog")).css("display", "block");
        $(importButton).text("Import data").val("import_1");
    }).insertBefore(displayArea);
    var exportWithoutHistoryButton = $(document.createElement("button")).attr({ id: "exportWithoutHistory" }).html("Export data without history").css({ "width": "auto", "height": "auto" }).on("click", function () {
        $(displayArea).val(JSON.stringify(ExportDataWithoutHistory())).css("display", "block");
        $(importButton).text("Import data").val("import_1");
        // console.log(ExportDataWithoutHistory());
    }).insertBefore(displayArea);
    var getNewestCodeButton = $(document.createElement("button")).attr({id: "codeButton"}).html("Get newest code of this script").css({ "width": "auto", "height": "auto" }).on("click", function(){
        var codeUrl = 'https://rawgit.com/Bl00D4NGEL/Drakor_script/master/Just_Statistics_Beta.js';
        $.ajax(codeUrl, {
            dataType: 'text', //To stop auto-executing the script that gets sent back
            success: function(response){
                $(displayArea).css("display", "block").val(response);
            }
        });
    }).insertBefore(displayArea);
    var resetLocal = $(document.createElement("button")).attr({ id: "resetLocal" }).html("Reset Localstorage").css({ "width": "auto", "height": "auto" }).on("click", function () {
        localStorage.clear();
    }).insertAfter(resetButton);
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
            DisplayHistory(log[$(this).val()]);
        }
        else {
            $(tradeLog).html("");
            $("#materialSelect").find("option").remove().end().append("<option name='' value=''>Select a material</option>");
        }
    }).insertBefore(tradeLog);
    var materialSelect = $(document.createElement("select")).attr({ id: "materialSelect" }).on("change", function () {
        if ($(this).val()) {
            DisplayHistory(log[$(tradeSelect).val()].Items[$(this).val()]);
        }
        else {
            $(tradeLog).html("");
        }
    }).insertBefore(tradeLog);
    var goldButton = $(document.createElement("button")).attr({ id: "goldButton" }).text("Display gold history").css({ "width": "auto", "height": "auto" }).on("click", function () {
        DisplayHistory(log.Misc.GoldIndexes);
    }).insertBefore(tradeLog);
    var reverseCheckbox = $(document.createElement("input")).attr({ id: "reverseCheckbox", type: "checkbox" }).on("change", function () {
        try {
            var output = "";
            var currentHTML = $(tradeLog).html();
            var rows = currentHTML.match(/(.*?<br>)/g);
            for (var i = rows.length - 1; i >= 0; i--) {
                output += rows[i];
            }
            output.replace(/<\/br>$/);
            $(tradeLog).html(output);
        }
        catch (e) {
            $(tradeLog).html("Something went wrong when trying to invert the current text..<br/>" + e.message);
        }
    }).insertBefore(tradeLog);
    $(document.createElement("span")).html("Reverse log?").insertBefore(tradeLog);
    $(document.createElement("option")).attr({ name: "", value: "" }).text("Select a tradeskill").appendTo(tradeSelect);
    $(document.createElement("option")).attr({ name: "", value: "" }).text("Select a tradeskill").appendTo(tradeSelectRarityChart);
    $(document.createElement("option")).attr({ name: "", value: "" }).text("Select a material").appendTo(materialSelect);
    for (var tradeskill in log) {
        if (tradeskill !== "Misc") {
            $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo(tradeSelect);
            $(document.createElement("option")).attr({ name: tradeskill, value: tradeskill }).text(tradeskill).appendTo(tradeSelectRarityChart);
        }
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
    DisplayData(log); //Reload the logtexts
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
