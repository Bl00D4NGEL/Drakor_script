// ==UserScript==
// @name         Just statistics v1.841
// @version      1.841
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==

/*
New feature (Node data) still need to be tested on pattern skills (e.g. ring crafting) and Treasure Hunting
*/
String.prototype.paddingLeft = function (paddingValue) {
    return String(paddingValue + this).slice(-paddingValue.length);
};

var debug = 1;
var debugId = "#debugDiv";
var version = "v1.841";
var last_change = "2017-04-26";

$(document).ready(function () {
    SetupLog();
    Info("You're currently using Just Statistics version " + version + "\nThis version was last edited on the " + last_change);
    //Variable declaration; getting the data out of local storage
    var log;
    if (!localStorage.getItem("localLog")) {
        Info("Log not found, creating a new one");
        log = Create_Log_Object();
    }
    else {
        try {
            log = JSON.parse(localStorage.getItem("localLog"));
            Info("Log succesfully loaded");
        }
        catch (e) {
            Error("Could not load load");
            log = Create_Log_Object();
        }
    }
    //Load the Graph script EVEN IF the site is https.
    //Can load the chart stuff because it is https.. yay
    try {
        $("head").append("<script src='https://rawgit.com/softwarefx/jChartFX/master/js/jchartfx.system.js'><\/script>");
        $("head").append("<script src='https://rawgit.com/softwarefx/jChartFX/master/js/jchartfx.coreBasic.js'><\/script>");
    }
    catch (ex) {
        Error("Cannot load Graph-Library: " + ex.message);
    }
    //Add the "button" to the menu bar
    var showLog = $(document.createElement("a")).attr({ id: "hrefShowLog", class: "gs_topmenu_item" }).text("Show Log").on("click", function () {
        $(logDiv).dialog("open");
    }).appendTo("#gs_topmenu");

    $(".menuItem").on("click", function () {
        if ($(this).attr('class').match(/menuFighting/i)) { return; } //Don't do this for combat nodes..
        else {
            GetAndSetRank();
        }
    });
    $(document).ajaxComplete(function (event, xhr, settings) {
        if (xhr.status === 200) { //Check if ajax is OK
            if (settings.url === "/adventure" || settings.url.match(/travel/)) {
                $(".menuItem").on("click", function () {
                    if ($(this).attr('class').match(/menuFighting/i)) { return; } //Don't do this for combat nodes..
                    else {
                        GetAndSetRank();
                    }
                });
            }
            else if (settings.url.match(/combinepattern/) && !settings.url.match(/action/)) {
                GetAndSetRank();
            }
            else if (settings.url.match(/\/world\/action_/)) { //Look if the ajax is a tradeskill action
                log = JSON.parse(localStorage.getItem("localLog")); //Load this up every attempt (Because of import reasons, might be able to load it a little prettier, though)
                var amount, exp, gold, item, history, buffActive = false, titleData, actionStatus;
                var tradeskill = settings.url.match(/action_([a-zA-Z]+).*?\//)[1];
                if (tradeskill === "teleport") { Info("You teleported.. that's no tradeskill!"); return; }
                GetAndSetRank();
                tradeskill = (tradeskill[0].toUpperCase() + tradeskill.substring(1)); //Convert first char to uppercase (Just for beauty reasons)
                if (!log[tradeskill]) {
                    Info("New Tradeskill: '" + tradeskill + "'");
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
                    $(document.createElement("option"))
						.attr({ name: tradeskill, value: tradeskill })
						.text(tradeskill).appendTo($("#tradeSelectRarityChart")); //If a new tradeskill is there, add it to the select
                } //If tradeskill is not present in log create it
                if (!xhr.responseText.match(/depleted/i)) {
                    try {
                        // var regex = /<div class="roundResult areaName">(.*?exp\)?<\/span><\/div>)/gi;
                        // var result = regex.exec(xhr.responseText); //Basic regex to get only the necessary data.
                        var result = xhr.responseText.match(/<div class="roundResult areaName">.*?(?:exp|beginner)\s*\)?<\/span.*?><\/div>/gi);
                        //Attention, creating skills will confuse this because not every creation gives exp, but rather a full attempt will.
                        if (result) { //This will always say true UNLESS you worked in another window thus the result will be empty -> no log entry will be made
                            var nodeName = $(".locationTitle").text();
                            //Attention! If the node is a settlement node, the level-range can be adjusted. Same goes for TH => adjust node level range to currently selected level range
                            if (nodeName.match(/settlement|treasure/i)) {
                                Debug("You're working on a Settlement node or a TH node!");
                                nodeName = nodeName.match(/(.*?)\(/)[1]; //Only the text is what we want for the log.
                                var selectLevelFrom = $("#minRange").val();
                                var selectLevelTo = $("#maxRange").val();
                                nodeName += "(Node Level " + selectLevelFrom + " - " + selectLevelTo + ")";
                                Debug("Changed node-name to: " + nodeName);
                            }
                            var temp = result[0].match(/^<div.*?>(.*?(?:exp|beginner)\s*\)?<\/span.*?>)<\/div>/gi);
                            if (result.length === 1) {
                                if (result[0].match(/^<div class="roundResult areaName">Your combines are complete./)) {
                                    titleData = "Creation done!";
                                    actionStatus = 'alert';
                                }
                                result = result[0].replace("<div class=\"roundResult areaName\">Your combines are complete.</div>", "");
                                result = result.match(/^<div.*?>(.*?(?:exp|beginner)\s*\)?<\/span.*?>)<\/div>/i)[1];
                                result = result.replace(/<script>.*?<\/script>/, "");
                                log = ProcessData(log, xhr.responseText, result, tradeskill, nodeName);
                            }
                            else {
                                for (var i = 0; i < result.length; i++) {
                                    if (result[i].match(/^<div class="roundResult areaName">Your combines are complete./)) {
                                        titleData = "Creation done!";
                                        actionStatus = 'alert';
                                    }
                                    result[i] = result[i].replace("<div class=\"roundResult areaName\">Your combines are complete.</div>", "");
                                    result[i] = result[i].replace(/<script>.*?<\/script>/, "");
                                    result[i] = result[i].match(/^<div.*?>(.*?<\/span.*?>)<\/div>/i)[1];
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
                            log = GetAttemptsToNextLevel(log, currentExp, neededExp, attemptTime, log[tradeskill].Experience, log[tradeskill].Attempts, tradeskill);
                            //Titlechanging data
                            var buffrarity = xhr.responseText.match(/dricon\scard(\w+)\sslot_default/i);
                            if (buffrarity[1] !== 'None') { buffActive = true; }
                            if (titleData !== 'Creation done!') {
                                if (xhr.responseText.match(/\d+%\sof/gi)) {
                                    titleData = xhr.responseText.match(/(\d+)%\sof/i)[1] + "% of Node left";
                                }
                                else if (xhr.responseText.match(/x\d+\.\.\./)) {
                                    titleData = xhr.responseText.match(/x(\d+)\.\.\./)[1] + " attempts left";
                                }
                            }
                            DisplayData(log);//Rarity-, Multi- and Materialoverview
                        }
                    }
                    catch (e) {
                        Error("Handling Responsetext: " + e.message);
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
                        Error("Localstorage is full");
                    }
                }
            }
            else if (settings.url.match(/workers\/collectworker/)) {
                var material = xhr.responseText.match(/\[(.*?)\]/)[1];
                HandleOfflineWorker("delete", material);
            }
            else if (settings.url.match(/workers/i)) {
                var text = xhr.responseText;
                var items = text.match(/(<div>Worker collecting.*?<\/div><\/div>)/ig);
                if (!items) { return; }
                for (var i = 0; i < items.length; i++) {
                    var material = items[i].match(/\[(.*?)\]/);
                    var time = items[i].match(/Collect <b>\d+<\/b> in (.*?)<\/div>/);
                    if (!time) { HandleOfflineWorker("delete", material[1]); }
                    else {
                        var seconds = ConvertStringIntoSeconds(time[1]);
                        var utc = new Date(new Date().getTime() + parseInt(seconds) * 1000).getTime();
                        var param = {
                            "Material": material[1],
                            "Time": utc
                        };
                        HandleOfflineWorker("check", param);
                    }
                }
                DisplayData(JSON.parse(localStorage.getItem("localLog")));
            }
        }
    });
});

function GetAndSetRank() {

    return;
    // TEMPORARY disable this



    var log = JSON.parse(localStorage.getItem("localLog"));
    if (log.profileId === undefined) {
        $.ajax("/profile").success(function (data) {
            var profId = data.match(/<a href="\/armory\/profile\/(\d+)\?show=noheader/);
            if (profId) {
                var log = JSON.parse(localStorage.getItem("localLog"));
                log.profileId = profId[1];
                localStorage.setItem("localLog", JSON.stringify(log));
            }
        });
    }
    else {
        $.ajax("/armory/profile/" + log.profileId + "?show=noheader").success(function (data) {
            var trades = data.match(/<div class="tradeskillBox".*?>.*?<\/div><\/div>/gi);
            var titleText = $(".skillTitle").html();
            titleText = titleText.replace(/<.*?>/g, "");
            var current_trade = titleText.match(/^([\w\s]+)\s/)[1];
            for (var i = 0; i < trades.length; i++) {
                var trade = trades[i];
                var tradeskill = trade.match(/<span class="tradeLabel">(.*?\))<\/span>/)[1];
                tradeskill = tradeskill.replace(/<.*?>/g, "");
                var real_trade = tradeskill.match(/^([\w\s]+)\s/)[1];
                if (real_trade === current_trade) {
                    //console.log("TRADESKILL: " + real_trade);
                    var level = trade.match(/<div class="tradeLevel">(\d+)<\/div>/)[1];
                    //console.log("LEVEL: " + level);
                    var rank = tradeskill.match(/(\(#[\d,]+\))/)[1];
                    //console.log("RANK: " + rank);
                    $(".skillTitle").html(real_trade + " - Level " + level + " " + rank);
                }

            }
        });
    }
}

function addCommas(x) {
    return x.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

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
                //Okay one last time since you might just not have enough inventory spaces
                if (history.match(/get more space/)) {
                    Error("Out of inventory space!");
                }
                //Log the error in the history (The last resort for this).
                Error("When processing the experience gained an error occured and the gained exp was set to 0..\nMessage: " + e.message);
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
            Info("New Date-Key '" + key + "' created");
            log[tradeskill][key] = {};
            log[tradeskill][key].Amount = 0;
            log[tradeskill][key].Experience = 0;
            log[tradeskill][key].Attempts = 0;
        }
        if (!log[tradeskill].Node) { log[tradeskill].Node = {}; } //For older versions
        if (!log[tradeskill].Node[nodeName]) {
            Info("NEW NODE: '" + nodeName + "'");
            log[tradeskill].Node[nodeName] = {};
            log[tradeskill].Node[nodeName].Items = {};
            log[tradeskill].Node[nodeName].Rarity = {};
            var rarities = ['Nothing', 'Common', 'Superior', 'Rare', 'Epic', 'Legendary'];
            for (var i = 0; i < rarities.length; i++) { log[tradeskill].Node[nodeName].Rarity[rarities[i]] = 0; }
            log[tradeskill].Node[nodeName].Misc = {};
            log[tradeskill].Node[nodeName].Misc.Experience = 0;
            log[tradeskill].Node[nodeName].Misc.Attempts = 0;
        }
        log[tradeskill].Attempts++;
        log[tradeskill].Node[nodeName].Misc.Attempts++;
        if ($("#history").prop('checked')) {
            log.Misc.Index++; //Add 1 to the index for the next attempt.
            log.Misc.Log[log.Misc.Index] = logDate + log_history; //Add the log to the Object via index
            log[tradeskill].Indexes += log.Misc.Index + "|";
        }
        if (history.match(/anything/i)) { //Nothing-drop
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
                    amount = parseInt(rarity.length);
                    for (var i = 0; i < rarity.length; i++) { //Write the data into the log object and you should be done
                        var dummy_rarity = rarity[i].match(/card(\w+)\s/)[1];
                        log[tradeskill][dummy_rarity]++;
                        log[tradeskill].Node[nodeName].Rarity[dummy_rarity]++;
                        Info("Crafted rarity: " + dummy_rarity);
                    }
                }
                catch (e) {
                    Error("Error processing item<br>" + e.message);
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
        log[tradeskill][key].Amount += parseInt(amount);
        log[tradeskill][key].Experience += parseInt(exp);
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
            log[tradeskill].Items[item].Amount = parseInt(amount);
            if ($("#history").prop('checked')) {
                log[tradeskill].Items[item].Indexes = log.Misc.Index + "|";
            }
            Info("First time!!<br>Item: " + item + " | Amount: " + amount);
        }
        else {
            log[tradeskill].Items[item].Drop++;
            log[tradeskill].Items[item].Amount += parseInt(amount);

            if ($("#history").prop('checked')) {
                log[tradeskill].Items[item].Indexes += log.Misc.Index + "|";
            }
            Info("Item: " + item + " - Amount: " + amount + " - Total: " + log[tradeskill].Items[item].Amount);
        }
        if (!log[tradeskill].Items[item].Rarity) { //If rarity hasn't been set yet (Older versions did not have this)
            log[tradeskill].Items[item].Rarity = rarity; //This will take the last-generated rarity on this function (Pattern that create different rarities *will* bug on this.
        }
        if (!log[tradeskill].Node[nodeName].Items[item]) {
            log[tradeskill].Node[nodeName].Items[item] = {};
            log[tradeskill].Node[nodeName].Items[item].Attempts = 1;
            log[tradeskill].Node[nodeName].Items[item].Rarity = rarity; //This will take the last-generated rarity on this function (Pattern that create different rarities *will* bug on this.

        }
        else {
            log[tradeskill].Node[nodeName].Items[item].Attempts++;
        }
        gold = history.match(/\(\+([0-9,]+)\s*gold/i);
        if (!gold) { gold = 0; }
        else {
            gold = gold[1].replace(",", "");
            if ($("#history").prop("checked")) {
                log.Misc.GoldIndexes += log.Misc.Index + "|";
            }
        }
        log.Misc.TotalExp += parseInt(exp);
        log[tradeskill].Experience += parseInt(exp);
        log[tradeskill].Node[nodeName].Misc.Experience += parseInt(exp);
        log.Misc.Gold += parseInt(gold);
        return log;
    }
    catch (e) {
        Error("PROCESSDATA: " + e.message);
        return log;
    }
}

function Create_Log_Object() {
    var log = {};
    log.Misc = {};
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
        try {
            if (log.Misc.Alert) {
                Info("Creation completed/Node depleted!", true);
            }
        }
        catch (e) {
            Error("ChangeTitle: " + e.message);
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
    dateObj.setTime(dateObj.getTime() + (-3 + dateObj.getTimezoneOffset() / 60) * 60 * 60 * 1000);
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    var newdate = year + "/" + month + "/" + day;
    return newdate;
}

function GetAttemptsToNextLevel(log, currentExp, neededExp, attemptTime, totalExp, totalAttempts, trade) {
    var diffExp = neededExp - currentExp;
    var averageExperience = Math.floor(totalExp / totalAttempts);
    var attemptsToLevel = Math.floor(diffExp / averageExperience);
    var timeToLevel = attemptsToLevel * attemptTime; //In Milliseconds
    log.Misc.TimeToLevel = timeToLevel;
    log.Misc.DiffExp = diffExp;
    log.Misc.AttemptsToLevel = attemptsToLevel;
    log.Misc.LevelupTradeskill = trade;
    return log;
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
    return log;
}

function GetPercent(val1, val2) {
    return (val1 / val2 * 100).toFixed(2);
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
    var totalAttempts = parseInt(log.Misc.Attempts.Total);
    var averageGold = Math.floor(parseInt(log.Misc.Gold) / totalAttempts);
    var averageExperience = Math.floor(parseInt(log.Misc.TotalExp) / totalAttempts);
    var averageResources = (totalResources / totalAttempts).toFixed(2);
    var miscDiv = $("#miscDiv");
    miscDiv.html("");
    var rarityDiv = $("#rarityDiv");
    rarityDiv.html("");
    var multiDiv = $("#multiDiv");
    multiDiv.html("");
    var materialDiv = $("#materialDiv");
    materialDiv.html("");
    var nodeDiv = $("#nodeDiv");
    nodeDiv.html("");

    if (Object.keys(log.Misc.OfflineWorker).length > 0) {
        CreateOfflineWorkerPanel(log);
    }
    var misc = $(document.createElement("p")).html("Total Experience gained: " + log.Misc.TotalExp + " (" + averageExperience + " on average)<br>" +
												   "Total Gold gained: " + log.Misc.Gold + " (" + averageGold + " on average)<br>" +
												   "Total Collection/Creation attempts: " + totalAttempts + "<br>" +
												   "Experience left to levelup in " + log.Misc.LevelupTradeskill + ": " + log.Misc.DiffExp + "<br>" +
												   "Average time left to levelup: " + ConvertIntoSmallerTimeFormat(parseInt(log.Misc.TimeToLevel)) + " (" +
												   log.Misc.AttemptsToLevel + " attempts)").appendTo(miscDiv);
    misc.html(addCommas(misc.html()));
    for (var tradeskill in log) { //Iterate over tradeskills
        if (!tradeskill.match(/misc/i)) { //Don't list the Misc thing
            var tradeskillTitle = $(document.createElement("h2")).css("padding", "5px").html("Tradeskill: " + tradeskill);
            tradeskillTitle.clone().appendTo($(".statisticDiv"));
            var tradeData = $(document.createElement("p"))
			.html("Total Experience: " + log[tradeskill].Experience + " (" + Math.floor(log[tradeskill].Experience / log[tradeskill].Attempts) +
				  " on average)<br>Total Attempts: " + log[tradeskill].Attempts).appendTo(miscDiv);
            tradeData.html(addCommas(tradeData.html()));
            var materialTable = $(document.createElement("table")).css({ "width": "100%" }).attr({ "class": "materialTable" }).appendTo(materialDiv);
            var tr = $(document.createElement("tr")).css("font-weight", "bold").appendTo(materialTable);
            var titles = ["Material", "Amount", "Average", "Gotten/Total"];
            for (var i = 0; i < titles.length; i++) {
                var td = $(document.createElement("td")).html(titles[i]).appendTo(tr);
            }
            for (var item in log[tradeskill].Items) { //Iterate over dropped items
                var tr = $(document.createElement("tr")).appendTo(materialTable);
                var values = [item, log[tradeskill].Items[item].Amount,
							  (log[tradeskill].Items[item].Amount / log[tradeskill].Items[item].Drop).toFixed(2),
							  log[tradeskill].Items[item].Drop + "/" + log[tradeskill].Attempts + " (" +
							  GetPercent(log[tradeskill].Items[item].Drop, log[tradeskill].Attempts) + " %)"];
                for (var j = 0; j < values.length; j++) {
                    var td = $(document.createElement("td")).html(values[j]).appendTo(tr);
                }
            }

            var multiTable = $(document.createElement("table")).css({ "width": "100%" }).attr({ "class": "multiTable" }).appendTo(multiDiv);
            var tr = $(document.createElement("tr")).css("font-weight", "bold").appendTo(multiTable);
            var titles = ["Multi", "Gotten/Total"];
            for (var i = 0; i < titles.length; i++) {
                var td = $(document.createElement("td")).html(titles[i]).appendTo(tr);
            }
            for (var multi in log[tradeskill].Multi) { //Iterate over multis
                var tr = $(document.createElement("tr")).appendTo(multiTable);
                var values = [multi, log[tradeskill].Multi[multi].Amount + "/" + log[tradeskill].Attempts + " ("
							  + GetPercent(log[tradeskill].Multi[multi].Amount, log[tradeskill].Attempts) + "%)"];
                for (var j = 0; j < values.length; j++) {
                    var td = $(document.createElement("td")).html(values[j]).appendTo(tr);
                }
            }

            var rarityTable = $(document.createElement("table")).css({ "width": "100%" }).attr({ "class": "rarityTable" }).appendTo(rarityDiv);
            var tr = $(document.createElement("tr")).css("font-weight", "bold").appendTo(rarityTable);
            var titles = ["Rarity", "Gotten/Total"];
            for (var i = 0; i < titles.length; i++) {
                var td = $(document.createElement("td")).html(titles[i]).appendTo(tr);
            }
            for (var rarity in colorDict) {
                if (log[tradeskill].Rarity[rarity]) {
                    var tr = $(document.createElement("tr")).css("color", colorDict[rarity]).appendTo(rarityTable);
                    var values = [rarity, log[tradeskill].Rarity[rarity] + "/" + log[tradeskill].Attempts + " ("
								  + GetPercent(log[tradeskill].Rarity[rarity], log[tradeskill].Attempts) + "%)"];
                    for (var j = 0; j < values.length; j++) {
                        var td = $(document.createElement("td")).html(values[j]).appendTo(tr);
                    }
                }
            }

            for (var node in log[tradeskill].Node) {
                var nodeHeading = $(document.createElement("h2")).html("Node: " + node).appendTo(nodeDiv);
                var nodeDescription = $(document.createElement("h5"))
				.html("Gained experience: " + log[tradeskill].Node[node].Misc.Experience + "<br>Attempts/Creations done: " +
					  log[tradeskill].Node[node].Misc.Attempts).appendTo(nodeDiv);
                nodeDescription.html(addCommas(nodeDescription.html()));
                var nodeTable = $(document.createElement("table")).css({ "width": "100%" }).attr({ "class": "nodeTable" }).appendTo(nodeDiv);

                $(document.createElement("tr"))
					.css({ "font-weight": "bold", "text-align": "center" }).html("<td colspan='2'>Items</td>").appendTo(nodeTable);
                var tr = $(document.createElement("tr")).css("font-weight", "bold").appendTo(nodeTable);
                var titles = ["Item", "Gotten/Total"];
                for (var i = 0; i < titles.length; i++) {
                    var td = $(document.createElement("td")).html(titles[i]).appendTo(tr);
                }
                for (var item in log[tradeskill].Node[node].Items) {
                    var values = [item, log[tradeskill].Node[node].Items[item].Attempts + "/" + log[tradeskill].Node[node].Misc.Attempts + " (" +
								  GetPercent(log[tradeskill].Node[node].Items[item].Attempts, log[tradeskill].Node[node].Misc.Attempts) + "%)"];
                    var tr = $(document.createElement("tr")).css("color", colorDict[log[tradeskill].Node[node].Items[item].Rarity]).appendTo(nodeTable);
                    for (var j = 0; j < values.length; j++) {
                        var td = $(document.createElement("td")).html(values[j]).appendTo(tr);
                    }
                }

                $(document.createElement("tr"))
					.css({ "font-weight": "bold", "text-align": "center" }).html("<td colspan='2'>Rarity</td>").appendTo(nodeTable);
                var tr = $(document.createElement("tr")).css("font-weight", "bold").appendTo(nodeTable);
                var titles = ["Rarity", "Gotten/Total"];
                for (var i = 0; i < titles.length; i++) {
                    var td = $(document.createElement("td")).html(titles[i]).appendTo(tr);
                }
                for (var rarity in log[tradeskill].Node[node].Rarity) {
                    if (log[tradeskill].Node[node].Rarity[rarity]) {
                        var values = [rarity, log[tradeskill].Node[node].Rarity[rarity] + "/" + log[tradeskill].Node[node].Misc.Attempts + " (" +
									  GetPercent(log[tradeskill].Node[node].Rarity[rarity], log[tradeskill].Node[node].Misc.Attempts) + "%)"];
                        var tr = $(document.createElement("tr")).css("color", colorDict[rarity]).appendTo(nodeTable);
                        for (var j = 0; j < values.length; j++) {
                            var td = $(document.createElement("td")).html(values[j]).appendTo(tr);
                        }
                    }
                }
            }
        }
    }
    $(".materialTable").find("td").css("border", "1px solid black");
    $(".multiTable").find("td").css("border", "1px solid black");
    $(".rarityTable").find("td").css("border", "1px solid black");
    $(".nodeTable").find("td").css("border", "1px solid black");
}

function CreateOfflineWorkerPanel(log) {
    var offDiv = $(document.createElement("div")).css({ "border": "1px solid black", "padding": "20px", "margin-bottom": "10px" }).appendTo("#miscDiv");
    $(document.createElement("h1")).html("Offline worker").appendTo(offDiv);
    var off = log.Misc.OfflineWorker;
    var mailList = [];
    for (material in off) {
        Debug("MATERIAL: " + material + " VALUE: " + off[material]);
        var p = $(document.createElemient("p")).appendTo(offDiv);
        //We save the UTC milliseconds in off[material]
        if (off[material] == "done") {
            p.html(material + " --> DONE (Mail sent)");
        }
        else {
            var diff = off[material] - new Date().getTime();
            Debug("MS: " + off[material]);
            if (diff <= 0) {
                p.html(material + " --> DONE (Sending Mail)");
                mailList.push(material);
                off[material] = "done";
                localStorage.setItem("localLog", JSON.stringify(log));
            }
            else if (diff <= 300000) { // Also send mail to items that are done witin 5 minutes
                mailList.push(material);
                off[material] = "done";
                localStorage.setItem("localLog", JSON.stringify(log));
            }
            else {
                var serverOffset = 3; //In hours
                var date = new Date(parseInt(off[material]));
                date.setUTCHours(date.getUTCHours() - serverOffset);
                var d = date.toJSON();
                d = d.replace(/T/, " ");
                d = d.replace(/\..*?$/, "");
                p.html(material + " done at " + d + " (" + ConvertIntoSmallerTimeFormat(diff) + ")");
            }
        }
    }
    if (mailList.length > 0) {
        Info("Sending mail..");
        var mailUrl = 'https://www.drakor.com/mail/create';
        var playerId;

        //Find out player ID..
        $(".bv_top_btn1").each(function (index, obj) {
            if ($(obj).attr("href") === undefined) { return; }
            var id = $(obj).attr("href").match(/profile\/(\d+)/);
            if (id) { playerId = id[1]; }
        });
        if (!playerId) {
            Error("Cannot determine player id!");
            return;
        }
        var form = $(document.createElement("form"));
        var fields = ["sendfrom", "sendto"];
        for (var i = 0; i < fields.length; i++) {
            $(document.createElement("input")).attr({ "type": "text", "name": fields[i], "id": fields[i] }).val(playerId).appendTo(form);
        }
        $(document.createElement("input")).attr({ "type": "text", "name": "subject", "id": "subject" }).val("Offline Worker").appendTo(form);
        var text = "Your offline workers for:<br>";
        for (var j = 0; j < mailList.length; j++) {
            text += "- " + mailList[j] + "<br>";
            log.Misc.OfflineWorker[mailList[j]] = "done";
        }
        localStorage.setItem("localLog", JSON.stringify(log));
        text += "<br>are almost or already done.<br>Head to any Offline worker and collect them.<br><strong>Service provided by Just Statistics.</strong>";
        $(document.createElement("input")).attr({ "type": "text", "name": "mail_message", "id": "mail_message" }).val(text).appendTo(form);
        $.post(mailUrl, $(form).serialize());
    }
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
        output += interval + " year" + (interval < 2 ? " " : "s ");
        seconds -= interval * 31536000;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 0) {
        output += interval + " month" + (interval < 2 ? " " : "s ");
        seconds -= interval * 2592000;
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 0) {
        output += interval + " day" + (interval < 2 ? " " : "s ");
        seconds -= interval * 86400;
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 0) {
        output += interval + " hour" + (interval < 2 ? " " : "s ");
        seconds -= interval * 3600;
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        output += interval + " minute" + (interval < 2 ? " " : "s ");
        seconds -= interval * 60;
    }
    output += Math.floor(seconds) + " seconds";
    return output;
}


/*
seconds => s
minutes => m
hours => h
day => d
week => w
*/
function ConvertStringIntoSeconds(string) {
    var out = 0;
    var second = string.match(/(\d+)\s*?s/i);
    if (second) { out += parseInt(second[1]); }

    var minute = string.match(/(\d+)\s*?m/i);
    if (minute) { out += (parseInt(minute[1]) * 60); }

    var hour = string.match(/(\d+)\s*?h/i);
    if (hour) { out += (parseInt(hour[1]) * 60 * 60); }

    var day = string.match(/(\d+)\s*?d/i);
    if (day) { out += (parseInt(day[1]) * 60 * 60 * 24); }

    var week = string.match(/(\d+)\s*?w/i);
    if (week) { out += (parseInt(day[1]) * 60 * 60 * 24 * 7); }

    return out;
}

function HandleOfflineWorker(command, param) {
    var log = JSON.parse(localStorage.getItem("localLog"));
    if (!log.Misc.OfflineWorker) { Info("Creating Offline-Worker Object"); log.Misc.OfflineWorker = {}; }
    if (command == "delete") {
        Info("Removing '" + param + "' from the list");
        log.Misc.OfflineWorker[param] = undefined;
        localStorage.setItem("localLog", JSON.stringify(log));
        DisplayData(log);
    }
    else if (command == "check") {
        if (!log.Misc.OfflineWorker[param.Material]) {
            HandleOfflineWorker("add", param);
            return;
        }
    }
    else if (command == "add") {
        Info("Adding '" + param.Material + "' to the list with UTC " + param.Time);
        log.Misc.OfflineWorker[param.Material] = param.Time;
    }
    localStorage.setItem("localLog", JSON.stringify(log));
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
    if (parseInt(timeTo) > parseInt(currentDate)) {
        Debug("User entered a date in the future..");
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
    Info("Diffhours: " + diffHours);
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
    var end = indexes.length - 2;
    if (end < 0) { end = 0; }
    if (indexes.length > 1000 && !$("#reverseCheckbox").prop('checked')) {
        start = indexes.length - 1000;
        end = indexes.length;
    }
    else if (indexes.length > 1000 && $("#reverseCheckbox").prop("checked")) {
        start = 0;
        end = 1000;
    }
    Debug("NEW START: " + start + " | NEW END: " + end);
    if ($("#reverseCheckbox").prop('checked')) {
        for (var i = start; i <= end; i++) {
            //text += "R-INDEX: " + indexes[i] + " | ";
            if (log.Misc.Log[indexes[i] - 1]) {
                text += log.Misc.Log[indexes[i] - 1] + '<br/>';
            }
        }
    }
    else {
        for (var j = end; j >= start; j--) {
            //text += "N-INDEX: " + indexes[j] + " | ";
            if (log.Misc.Log[indexes[j]]) {
                text += log.Misc.Log[indexes[j] - 1] + '<br/>';
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
		  '<li><a href ="#graphDiv">Graphs</a></li>' +
		  '<li><a href ="#debugDiv" style="display:' + (debug > 0 ? '' : 'none') + '">Debug</a></li></ul>').appendTo(fragment);
    var materialDiv = $(document.createElement("div")).attr({ "id": "materialDiv", "class": "statisticDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("materialDivText")).appendTo(logDiv);
    // $(document.createElement("div")).attr({"id": "materialDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(materialDiv);
    var multiDiv = $(document.createElement("div")).attr({ "id": "multiDiv", "class": "statisticDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("multiDivText")).appendTo(logDiv);
    // $(document.createElement("label")).attr({"id": "multiDivText"}).css({"text-align":"left", "display": "inherit"}).appendTo(multiDiv);
    var miscDiv = $(document.createElement("div")).attr({ "id": "miscDiv", "class": "statisticDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("miscDivText")).appendTo(logDiv);
    var rarityDiv = $(document.createElement("div")).attr({ "id": "rarityDiv", "class": "statisticDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("rarityDivText")).appendTo(logDiv);
    var nodeDiv = $(document.createElement("div")).attr({ "id": "nodeDiv" }).css({ "text-align": "left", "display": "inherit" }).html(localStorage.getItem("nodeDivText")).appendTo(logDiv);
    var optionsDiv = $(document.createElement("div")).attr({ "id": "optionDiv" }).css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
    var displayArea = $(document.createElement("textarea")).attr({ id: "displayArea", autocomplete: "off", spellcheck: "false" }).css({ "width": "750px", "height": "200px", "display": "none" }).appendTo(optionsDiv);
    var helpDiv = $(document.createElement("div")).attr({ "id": "helpDiv" }).css({ "text-align": "left", "display": "inherit" })
	.html("<h5>Why are there three exclamation marks next to the \"Show Log\" button?</h5>" +
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
    var debugDiv = $(document.createElement("div")).attr("id", "debugDiv").css({ "text-align": "left", "display": "inherit" }).appendTo(logDiv);
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
                        if (parseInt(d.getDate()) - 1 === day && fromToArray[j] === "from") { isCurrent = true; }
                        else if (parseInt(d.getDate()) === day && fromToArray[j] === "to") { isCurrent = true; }
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
            if (parseInt(timeFrom) > parseInt(timeTo)) { alert("Your date range is not correct, check again!"); return; }
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
                Error("Import 2 => " + e.message);
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
    var getNewestCodeButton = $(document.createElement("button")).attr({ id: "codeButton" }).html("Get newest code of this script").css({ "width": "auto", "height": "auto" }).on("click", function () {
        var codeUrl = 'https://rawgit.com/Bl00D4NGEL/Drakor_script/master/Just_Statistics_Beta.js';
        $.ajax(codeUrl, {
            dataType: 'text', //To stop auto-executing the script that gets sent back
            success: function (response) {
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
        if ($(this).html().match(/display/i)) {
            $(this).html("Hide gold history");
            DisplayHistory(log.Misc.GoldIndexes);
        }
        else {
            $(this).html("Display gold history");
            $("#log").html("");
        }
    }).insertBefore(tradeLog);
    var reverseCheckbox = $(document.createElement("input")).attr({ id: "reverseCheckbox", type: "checkbox" }).on("change", function () {
        try {
            var log = JSON.parse(localStorage.getItem("localLog"));
            if ($("#tradeSelect").val() !== "" && $("#materialSelect").val() !== "" && $("#goldButton").html().match(/display/i)) {
                DisplayHistory(log[$("#tradeSelect").val()].Items[$("#materialSelect").val()]);
            }
            else if ($("#tradeSelect").val() !== "" && $("#materialSelect").val() === "" && $("#goldButton").html().match(/display/i)) {
                DisplayHistory(log[$("#tradeSelect").val()]);
            }
            else if ($("#goldButton").html().match(/hide/i)) {
                DisplayHistory(log.Misc.GoldIndexes);
            }
        }
        catch (e) {
            $("#log").html("Something went wrong when trying to invert the current text..<br/>" + e.message);
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

function Error(errorText) {
    Debug(errorText, 2);
}

function Info(infoText, sendAlert) {
    if (sendAlert === undefined) { sendAlert = false; }
    if (sendAlert) { alert(infoText); }
    Debug(infoText, 0);
}

function Dump(variable, other, indent) {
    if (debug < 1) { return; }
    if (other === undefined) { other = ''; }
    if (indent === undefined) { indent = 0; }
    var padding = "<span style='padding-left:" + parseInt(indent * 25) + "px'>";
    var type = typeOf(variable);
    if (type == "string" || type == "number" || type == "boolean") {
        var desc = other;
        var test1 = desc.match(/\{([^\}]+)\}$/);
        var test2 = desc.match(/\[([^\]]+)\]$/);
        if (test1) {
            desc = test1[1];
        }
        else if (test2) {
            desc = test2[1];
        }
        Debug(padding + "'" + desc + "' => '" + variable + "'</span>", 3);
    }
    else if (type == "array") {
        for (var i = variable.length - 1; i >= 0; i--) {
            Dump(variable[i], other + "[" + i + "]", indent + 1);
        }
        Debug(padding + "'" + other + "' =></span>", 3);
    }
    else if (type == "object") {
        for (var thing in variable) {
            Dump(variable[thing], other + "{" + thing + "}", indent + 1);
        }
        Debug(padding + "'" + other + "' =></span>", 3);
    }
    else if (type == "undefined") {
        Error(other + " = undefined");
    }
    else {
        Debug("DUMP => Unkown type '" + type + "'", 2);
    }
}

function DumpHTMLElement(object, other) {
    var out = [];
    var kids = object.children();
    for (var i = kids.length - 1; i >= 0; i--) {
        var id = $(kids[i]).attr("id");
        if (id === undefined) { id = ""; }
        else { id = "#" + id; }
        var eleClass = $(kids[i]).attr("class");
        if (eleClass === undefined) { eleClass = ""; }
        else { eleClass = "(." + eleClass.replace(" ", ".") + ")"; }
        var type = "[" + kids[i].localName + "]";
        //Debug(other + type + "->" + id + eleClass);
        if ($(kids[i]).children().length > 0) {
            out.push(DumpHTMLElement($(kids[i]), other + type + "->" + id + eleClass));
            //out.push(other + type + "->" + id + eleClass);
        }
        else {
            out.push(other + " = " + object.text());
        }
    }
    return out;
}

function typeOf(obj) {
    return {}.toString.call(obj).split(' ')[1].slice(0, -1).toLowerCase();
}

function Debug(text, level, html) {
    try {
        if (debug < 1) { return; }
        if (level === undefined) { level = 1; }
        if (html === undefined) { html = true; }
        if (text === undefined) { text = ""; }
        var font = {
            "0": ["p", { "background-color": "black", "color": "green" }],
            "1": ["p", { "background-color": "black", "color": "white" }],
            "2": ["p", { "background-color": "black", "color": "red" }],
            "3": ["p", { "background-color": "black", "color": "orange", "margin": "0px" }]
        };
        if (font[level] === undefined) {
            level = 1;
        }
        if (html) {
            text = text.replace("\n", "<br>");
            $(document.createElement(font[level][0])).css(font[level][1]).html(text).prependTo($(debugId));
        }
        else {
            console.log("TEXT: \n" + text)
            //text = text.replace(/<\/?br\/?>/g, "\n")
            $(document.createElement(font[level[0]])).css(font[level[1]]).text(text).prependTo($(debugId));
        }
    }
    catch (e) {
        Error(e.message);
    }
}

function ResetStatistics() {
    var localStorageElements = ["materialDivText", "multiDivText", "rarityDivText", "miscDivText"];
    for (var i = 0 ; i < localStorageElements.length; i++) {
        Info("Resetting " + localStorageElements[i]);
        localStorage.setItem(localStorageElements[i], "");
        $("#" + localStorageElements[i].slice(0, -4)).html("");
    }
    localStorage.setItem("localLog", "");
    Create_Log_Object();
    $("#materialSelect").find("option").remove().end().append("<option name='' value=''>Select a material</option>");
    $("#tradeSelect").find("option").remove().end().append("<option name='' value=''>Select a tradeskill</option>");
    $("#log").html("");
    Info("Everything has been re-set", true);
}