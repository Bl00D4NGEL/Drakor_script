// ==UserScript==
// @name         Battle-statistics v1.71
// @version      1.71
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==

var outputAsCSV = false;
// CSV OUTPUT IS AS FOLLOWS:
// Win/ Lose;Round fight ended;Difficulty;Experience;Gold;LootedItems

/*
Armory function
drap/drop? enchants to specific equipment for quick overview of what enchants are needed
mark them in the inventory if dragged?

Add comparison between augments x equipped augments

log{
Augment => { }
ConsolationLoot => Integer
CurrentLoot => Integer
Easy => {
Common => Integer
ConsolationLoot => Integer
Durability Scroll => {}
Enchant => {}
Epic => Integer
Equipment => {}
Experience => Integer
Food => {}
Gold => Integer
Item Augment => {}
Legendary => Integer
Loot => Integer
Lost => Integer
Rare => Integer
Spell => {}
Superior => Integer
Won => Integer
WonWithoutLoot => Integer
}
Elite => {}
Enchant => {}
Experience => Integer
Gold => Integer
Hard => {}
ItemsSold => Integer
LootGold => Integer
Lost => Integer
Medium => {}
Spell => {}
TotalLoot => Integer
Won => Integer
WonWithoutLoot => Integer
dialog-bottom => String
dialog-height => String
dialog-left => String
dialog-right => String
dialog-top => String
dialog-width => String
}
*/
var debug = 0;
var disableDoubleClickSelling = 0;
var LOG;
var debugId = "LiveLog";
$(document).ready(function () {
    var version = "v1.71";
    SetupLiveLog(); //Live-log-div
    LiveLog("You're currently using Battle Statistics version " + version);
    CheckInventory(); //To load the durability data into the livelog
    if (!localStorage.getItem("battleLog")) {
        LiveLog("Log not found, creating a new one");
        LOG = Create_Log_Object();
        localStorage.setItem("battleLog", JSON.stringify(LOG));
    }
    else {
        LOG = JSON.parse(localStorage.getItem("battleLog"));
        console.log("LOG OBJECT: ", LOG);
        LiveLog("Battle Statistics Log succesfully loaded");
    }
    AddEnterShortcut($(".menuFighting")); // Add Enter-Shortcut to loaded nodes on screen
    $(".menuFighting").on("click", function () {
        CheckInventory();
    });
    if (debug > 0) {
        LiveLog("D: Current Loot (Drakor) is " + $("#load-openloot").html().match(/(\d+)/)[1] + " and log.CurrentLoot is " + LOG.CurrentLoot);
    }
    if (LOG.CurrentLoot > 0 && $("#load-openloot").html().match(/(\d+)/)[1] !== "0") {
        //LiveLog("Set 'Actual Loot' to " + LOG.CurrentLoot);
        var lootbagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
        $("#load-openloot").html(lootbagText + "(" + LOG.CurrentLoot + ")");
    }
    else if ($("#load-openloot").html().match(/(\d+)/)[1] === "0" && LOG.CurrentLoot !== 0) {
        LOG.CurrentLoot = 0;
        localStorage.setItem("battleLog", JSON.stringify(LOG));
        LiveLog("Setting 'Actual Loot' to 0 because the loot bag got opened without notice");
    }
    else { }

    for (var keys in LOG) {
        if (keys.match(/^(stats|history)/)) {
            LOG[keys] = undefined;
        }
    }
    CheckForDepletedNode();
    localStorage.setItem("battleLog", JSON.stringify(LOG)); //Overwrite localstorage
    $(document).ajaxComplete(function (event, xhr, settings) {
        if (settings.url === "/arena") {
            SetupLog();
            CheckInventory();
            AddEnterShortcut($(".createBattle"));
        }
        else if (settings.url === "/adventure" || settings.url.match(/travel/)) {
            AddEnterShortcut($(".menuFighting"));
            $(".menuFighting").on("click", function () {
                CheckInventory();
            });
            CheckForDepletedNode();
        }
        else if (settings.url.match(/\/battle-round\/attack.*/)) {
            /*
			the url is /battle-round/attack/1759737/2767313
			whereis the number after attack is a UNIQUE number (the id of the battle) so I can map the history id to that one.
			*/
            try {
                var battleId = settings.url.match(/(\d+)/)[1];
                var difficulty = $("#drakorWorld").find(".battleDiff").html().match(/:\s(\w+).*/)[1];
                GenerateHistory(LOG, battleId, xhr.responseText);
                AnalyseStats(LOG, $(".challengerProfile"), $(".opponentProfile"), battleId);
                if (xhr.responseText.match(/victory/)) {
                    console.log("RESPONSETEXT:\n" + xhr.responseText);
                    // difficulty = xhr.responseText.match(/<h4>(\w+).*?<\/h4>/i)[1];
                    //Generates the "history" of the battle and returns the log object
                    console.log("DIFFICULTY: ", difficulty);
                    var exp = xhr.responseText.match(/([0-9,]+)\s?\w*\s?exp/i);
                    LOG.Experience += parseInt(exp[1].replace(",", ""));
                    LOG[difficulty].Experience += parseInt(exp[1].replace(",", ""));
                    var gold = xhr.responseText.match(/>([0-9,]+)\sgold/i);
                    if (gold) {
                        LOG.Gold += parseInt(gold[1].replace(",", ""));
                        LOG[difficulty].Gold += parseInt(gold[1].replace(",", ""));
                    }
					else{ gold = 0; }
                    var enemyLevel = $(".opponentProfile").find(".avatarLevel").text().match(/Level (\d+)/)[1];
                    LOG.Won++;
                    LOG[difficulty].Won++;
                    var loot = xhr.responseText.match(/modLoot\((\d)\)/);
                    if (loot) { //Got loot
                        var realLoot = xhr.responseText.match(/with\s(\d+)\sitem/i);
                        if (realLoot) {
                            var round = $($(".roundResult").get(0)).html().match(/(#\d+)/);
                            if (round) {
                                round = round[1];
                            }
                            else {
                                round = "#?";
                            }
                            var logMessage = "Victory (" + round + ") - Looted " + realLoot[1] + " item" + (parseInt(realLoot[1]) > 1 ? 's' : '') +
                            " as well as " + (gold > 0 ? gold + " gold and " : "") + parseInt(exp[1].replace(",", ""))  +
							" experience <span class='showHistory' id='span-history-" + battleId + "' style='text-decoration: underline;'>History</span><br><div  style='display:none' id='div-history-" + battleId + "'></div>";
                            if(outputAsCSV){
                                logMessage = "Win;" + round + ";" + difficulty + ";" + parseInt(exp[1].replace(",", "")) + ";" + gold + ";" + realLoot[1] + "<br>";
                            }
                            LiveLog(logMessage, false);
                            LOG.TotalLoot += parseInt(realLoot[1]);
                            LOG.CurrentLoot += parseInt(realLoot[1]);
                            LOG[difficulty].Loot += parseInt(realLoot[1]);
                            var lootbagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
                            var itemsInLootbag = lootbagText.match(/(\d+)/);
                            if (itemsInLootbag[1] === "1") {
                                //LiveLog("Loot bag has been opened");
                                LOG.CurrentLoot = parseInt(realLoot[1]);
                            }
                            $("#load-openloot").html(lootbagText + "(" + LOG.CurrentLoot + ")");
                        }
                    }
                    else {
                        var round = $($(".roundResult").get(0)).html().match(/(#\d+)/);
                        if (round) {
                            round = round[1];
                        }
                        else {
                            round = "#?";
                        }
                        var logMessage = "Victory (" + round + ") - Looted 0 items" +
                        " as well as " + (gold > 0 ? gold + " gold and " : "") + parseInt(exp[1].replace(",", ""))  +
						" experience <span class='showHistory' id='span-history-" + battleId +
						"' style='text-decoration: underline;'>History</span><br><div  style='display:none' id='div-history-" + battleId + "'></div>";
                        if(outputAsCSV){
                            logMessage = "Win;" + round + ";" + difficulty + ";" + parseInt(exp[1].replace(",", "")) + ";" + gold + ";0<br>";
                        }
                        LiveLog(logMessage, false);
                        LOG.WonWithoutLoot++;
                        LOG[difficulty].WonWithoutLoot++;
                    }
                    if ($(".menuFighting").length) {
                        AddEnterShortcut($(".menuFighting"));
                        $(".menuFighting").on("click", function () {
                            CheckInventory();
                        });
                    }
                    else {
                        AddEnterShortcut($("#load-arena"));
                    }
                }
                else if (xhr.responseText.match(/defeated/) && !xhr.responseText.match(/victory/)) {
                    var round = $($(".roundResult").get(0)).html().match(/(#\d+)/);
                    if (round) {
                        round = round[1];
                    }
                    else {
                        round = "#?";
                    }
                    LOG.Lost++;
                    LOG[difficulty].Lost++;

                    var gotConsolationLoot = false;
                    if (xhr.responseText.match(/modloot/i)) {
                        LOG.ConsolationLoot++;
                        LOG[difficulty].ConsolationLoot++;
                        LOG.CurrentLoot++;
                        var bagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
                        var itemsInBag = bagText.match(/(\d+)/);
                        if (itemsInBag[1] === "1") {
                            //LiveLog("Loot bag has been opened");
                            LOG.CurrentLoot = 1;
                        }
                        gotConsolationLoot = true;
                        $("#load-openloot").html(bagText + "(" + LOG.CurrentLoot + ")");

                    }
                    var logMessage = "Defeat (" + round + ") " + "<span class='showHistory' id='span-history-" +
                    battleId + "' style='text-decoration: underline;'>History</span><br><div  style='display:none' id='div-history-" + battleId + "'></div>";
                    if(outputAsCSV){
                        logMessage = "Lose;" + round + ";" + difficulty + ";0;0;" + (gotConsolationLoot ? 1 : 0) + "<br>";
                    }
                    LiveLog(logMessage, false);

                    AddEnterToSpecificClass("navButton", "Back to Adventure");
                    AddEnterToSpecificClass("navButton", "Back to Arena");
                }

                localStorage.setItem("battleLog", JSON.stringify(LOG));
            }
            catch (e) {
                LiveLog("Oh that's not good..<br/>ERROR: '" + e.message + "'");
                console.log("ERROR", e);
            }
        }
        else if (settings.url.match(/\/battle-create\/.*/)) {
            AddEnterToSpecificClass("navButton", "Start Battle!");
            //This should add enter to go to the world map once the node is depleted -- not sure if this is the right place -- gotta check
            // XXX TODO
            AddEnterToSpecificClass("navButton", "Back to Adventure");
        }
        else if (settings.url === "/sell/sellall") {
            if (xhr.responseText.match(/areaname\">([0-9,]+)\sg/i)) {
                var goldEarned = xhr.responseText.match(/areaname\">([0-9,]+)\sg/i)[1].replace(/,/g, "");
                var itemsSold = $("#drakorWorld").find(".drIcon").length;
                LiveLog("Sell all: Sold " + itemsSold + " items for " + goldEarned + " gold.");
                LOG.LootGold += parseInt(goldEarned);
                LOG.ItemsSold += parseInt(itemsSold);
                localStorage.setItem("battleLog", JSON.stringify(LOG));
            }
        }
        else if (settings.url.match(/openloot\/open\/all/i)) {
            LOG.CurrentLoot = 0;
            var lootItems = 0;
            var lootbags = xhr.responseText.match(/<h3>(.*?)<script>/g);
            for (var i = 0; i < lootbags.length; i++) {
                try {
                    var lootbag = lootbags[i];
                    var diff = lootbag.match(/\((\w+)\)/);
                    if (diff) {
                        diff = diff[1];
                    }
                    else {
                        LiveLog("Skipping consolation item..");
                        lootItems++;
                        continue;
                    }
                    var items = lootbag.match(/<div class="cardContainer.*?<\/b>\s*<\/div>\s*<\/div>/g);
                    for (var j = 0; j < items.length; j++) {
                        var rarity, image, type, rarity;
                        try {
                            lootItems++;
                            var item = items[j];
                            rarity = item.match(/cardquality\">(\w+)</i)[1];
                            LOG[diff][rarity]++;
                            image = item.match(/<img.*?\/images\/(\w+)\/[\d\w]+\.png/);
                            type = item.match(/<span class=\"cardType\">([\w\s\d:?]+)</i);
                            if (type) {
                                type = type[1];
                            }
                            else {
                                LiveLog("Cannot determine type of item: " + item);
                                continue;
                            }
                            type = type.replace("Item : ", "Equipment : ");
                            type = type.replace("Battle", "Spell");
                            if (type === "Weapon") {
                                type = "Equipment : Weapon";
                            }
                        }
                        catch (ex) {
                            LiveLog("Cannot process item because: " + ex.message + " | ITEM: " + items[j]);
                        }
                        /*
					Food
					Enchant
					Item
					Battle
					Augment
					Durability Scroll
					=======> Extra objects
					*/
                        try {
                            var otherItem = type.match(/(spell|equipment|food|enchant) \: ([\w\s\d]+)/i);
                            if (type === "Item Augment" || type === "Durability Scroll") {
                                try {
                                    console.log("LOOT: " + diff + " => " + type + " => " + type + " => " + rarity);
                                    LOG[diff][type][type][rarity] = LOG[diff][type][type][rarity] + 1 || 1;
                                }
                                catch (ex) {
                                    //older versions did not have this -> add it now
                                    try { //try again
                                        console.log("NEW LOOT: " + diff + " => " + type + " => " + type + " => " + rarity);
                                        LOG[diff][type] = {};
                                        LOG[diff][type][type] = {};
                                        LOG[diff][type][type][rarity] = 1;
                                    }
                                    catch (ex) {
                                        console.log("Come on..");
                                    }
                                }
                            }
                            else if (otherItem && otherItem[1] !== '' && otherItem[2] !== '') {
                                try {
                                    console.log("LOOT: " + diff + " => " + otherItem[1] + " => " + otherItem[2] + " => " + rarity);
                                    LOG[diff][otherItem[1]] = LOG[diff][otherItem[1]] || {};
                                    LOG[diff][otherItem[1]][otherItem[2]] = LOG[diff][otherItem[1]][otherItem[2]] || {};
                                    LOG[diff][otherItem[1]][otherItem[2]][rarity] = LOG[diff][otherItem[1]][otherItem[2]][rarity] + 1 || 1;
                                }
                                catch (ex) {
                                    LiveLog("Cannot add loot with the following attribute: " + diff + " => " + otherItem[1] + " => " + otherItem[2] + " => " + rarity + " because: " + ex.message);
                                }
                            }
                            else {
                                if (otherItem) {
                                    LiveLog("Something went wrong when trying to access variable otherItem. Dump: ");
                                    Dump(otherItem, "otherItem");
                                }
                                else {
                                    LiveLog("Cannot determine type..<br>TYPE: '" + type + "'");
                                }
                            }
                        }
                        catch (ex) {
                            LiveLog("When trying to get the type for the dropped items something went wrong...<br>Message: " + ex.message + "<br>TYPE: " + type);
                        }
                    }
                }
                catch (ex) {
                    LiveLog("When trying to process a loot item this happened: " + ex.message + "<br>Lootbag:" + lootbags[i]);
                }
            }
            //Okay let's try something here, shall we?
            var secondLootItems = $("#drakorWorld").find(".cardContainer").length;
            if (secondLootItems !== lootItems) {
                LiveLog("I don't know what happened, but Drakor tells me you looted " + secondLootItems + " items but my script got " + lootItems + " items... please tell Blood about this, okay?!");
            }
            LiveLog("Opened " + lootbags.length + " Loot bags with " + lootItems + " looted items");
            localStorage.setItem("battleLog", JSON.stringify(LOG));
        }
        else if (settings.url.match(/inventory/)) {
            $(".drIcon").on("dblclick", function (e) {
                if (e.currentTarget.id) {
                    var plainId = e.currentTarget.id.slice(4);
                    // Only sell Dura Scrolls / Runes if their durability is 0, otherwise warn the user and cancel this operation
                    if ($("#" + e.currentTarget.id).find(".iconTitle").text().match(/(Durability|Rune)/i)) {
                        if (!$("#" + e.currentTarget.id).attr("title").match(/: 0$/)) {
                            HandleSpellRepair(plainId);
                            return;
                        }
                        //Otherwise sell the item
                    }
                    setTimeout(TrackSelling(plainId), 1000); // We need a timeout here because the card actually needs to load.
                }
            });
            $(".drIcon").on("click", function (e) {
                var myTimer = setInterval(function () {
                    try {
                        if (!$("#card" + e.currentTarget.id.slice(4)).text().match(/loading/i)) {
                            var plainId = e.currentTarget.id.slice(4);
                            var cardId = "card" + plainId;
                            //<div id="sell-3102918" class="cardButton linkSell">Sell</div>
                            $("#sell-" + plainId).on("click", function (e) {
                                TrackSelling(e.currentTarget.id.slice(5), false);
                            });
                            // Base Stats button
                            if ($("#card" + plainId).find(".cardType")[0].innerHTML.match(/(item :|weapon)/i)) {
                                if ($("#base-" + plainId).length === 0) {
                                    var baseButton = $(document.createElement("div")).attr({ 'id': 'base-' + plainId, 'class': 'cardButton' }).html("Show Base");
                                    var toInsert = $("#card" + plainId).find(".cardMenu").children();
                                    baseButton.insertBefore($(toInsert.get(toInsert.length - 1)));
                                    baseButton.on("click", function (e) {
                                        var id = e.currentTarget.id.slice(5);
                                        console.log("CHECKING HTML FOR $(\"#base-" + id + "\").html()");
                                        if ($("#base-" + id).html() == "Show Base") {
                                            console.log("Getting base stats..");
                                            GetBaseStats(id);
                                            $("#base-" + id).html("Show Total");
                                        }
                                        else {
                                            console.log("setting default..");
                                            $.ajax("/show/viewcard/" + id).success(function (data) {
                                                var details = data.match(/<div class="cardDetail">(.*?)<\/div>/i)[1];
                                                $("#card" + id).find(".cardDetail")[0].innerHTML = details;
                                            });
                                            $("#base-" + id).html("Show Base");
                                        }
                                    });
                                }
                                else {
                                    console.log("This item has been clicked already.. still want to add the base button?");
                                }
                            }
                            clearInterval(myTimer);
                        }
                    }
                    catch (ex) {
                        clearInterval(myTimer);
                    }
                }, 100, e);
            });
            var counter = {};
            $(".drIcon").each(function (index, obj) {
                var enchType = $(obj).find(".iconTitle").html().match(/En\: <\/small>(\w+)/);
                if (enchType) {
                    counter[enchType[1]] = 1;
                    $(obj).find(".iconTitle").toggleClass("en-" + enchType[1]);
                }
            });
            var output = '';
            for (var type in counter) {
                if ($(".en-" + type).length > 1) {
                    output += "There are " + $(".en-" + type).length + " " + type + " Enchants in your inventory<br>";
                    $(".en-" + type).css("background-color", "blue");
                }
                $("#enchantDiv").html(output);
            }
        }
        else if (settings.url.match(/\/world\/disenchanting/i)) { DisenchantSetup(); } //Setup of the selects
        else if (settings.url.match(/\/world\/action_disenchanting/i)) { LiveLog("You disenchanted an item"); SelectItemToDisenchant(); } //Auto de on enter press
        else if (settings.url.match(/\/use\/\d+/i) && xhr.responseText.match(/<select id="inv_card" name="inv_card">/i)) {
            // Repairing an item with a scroll (rune?)
            // Add 1-9 as a selector for the spells
            AddEnterToSpecificClass("navButton", "Refill Item's Durability");
            $(document).on("keydown", function (e) {
                if ((e.keyCode > 47 && e.keyCode < 58) || (e.keyCode > 95 && e.keyCode < 106)) {
                    // Normal 1-9 // Numpad 1-9
                    var keyValue = e.keyCode % 48;
                    var select = $("#inv_card");
                    // Pressed number higher than options -> Skip
                    if (select.children().length < keyValue) { return; }
                    $("#inv_card").val($($("#inv_card").children()[keyValue]).val());
                }
            });
        }
        else if (settings.url.match(/\/use\/\d+\/confirm/i) && xhr.responseText.match(/durability/i && xhr.responseText.match(/rune|scroll/i))) {
            LiveLog("You repaired an item with a Durability Scroll/ Rune");
        }
        else if (settings.url.match(/gen_action\/shuffleitem\/\d+\/confirm/)) {
            LiveLog("You tinkered an item");
        }
        else if (settings.url.match(/(chat|sell|battle)/i)) { }

        else {
            if (debug > 0) {
                console.log("settings\n");
                console.log(settings);
                console.log("event\n");
                console.log(event);
                console.log("xhr\n");
                console.log(xhr);
            }
        }

    });
});

function HandleSpellRepair(plainId) {
    var myTimer = setInterval(function () {
        try {
            var cardId = "div#card" + plainId;
            var cardText = $(cardId).html();
            var cardValue = 0;
            if (!cardText.match(/loading/) && cardText !== '') {
                if ($("#load-use-" + plainId).length > 0) {
                    $.ajax("/use/" + plainId).done(function (data) { $("#drakorWorld").html(data); });
                }
                else {
                    LiveLog("It looks like this scroll doesn't have a use option?");
                }
                clearInterval(myTimer);
            }
            else {//wait...
            }
        }
        catch (ex) {
            console.log("OOOOOH!\n" + ex.message);
            clearInterval(myTimer);
        }
    }, 100);
}

function SubstractBaseStats(data, base_stats) {
    try {
        var details = data.match(/<div class="cardDetail">(.*?)<\/div>/i)[1];
        var stats = details.match(/\+\d+[\w\s]+</ig);
        for (var i = 0; i < stats.length; i++) {
            var val = stats[i].match(/\+(\d+)/)[1];
            var stat = stats[i].match(/\+\d+ ([\s\w]+) /)[1];
            stat = stat.replace(/\s$/, "");
            base_stats[stat] -= parseInt(val);
        }
        return base_stats;
    }
    catch (ex) {
        LiveLog("Something went wrong when trying to calcuate the base stats for that item.");
    }
}

function GetBaseStats(itemId) {
    var BASEURL = "/show/viewcard/";
    $.ajax(BASEURL + itemId).success(function (data) {
        //Get Augment Id
        var enchOK = false;
        var augOK = false;
        var augmentId = data.match(/<div id="aug-(\d+)"/);
        //Get Enchant Id
        var enchantId = data.match(/div id="enc-(\d+)"/);
        var order = [];

        var base_stats = {};

        //Analyse Stats of base item
        var details = data.match(/<div class="cardDetail">(.*?)<\/div>/i)[1];
        var stats = details.match(/\+\d+[\w\s]+</ig);
        for (var i = 0; i < stats.length; i++) {
            var val = stats[i].match(/\+(\d+)/)[1];
            var stat = stats[i].match(/\+\d+ ([\s\w]+) /)[1];
            stat = stat.replace(/\s$/, "");
            base_stats[stat] = parseInt(val);
            order.push(stat);
        }
        if (augmentId) {
            //Base stats = check, let's go for the augment.
            $.ajax(BASEURL + augmentId[1]).success(function (data) {
                base_stats = SubstractBaseStats(data, base_stats);
                augOK = true;
            });
        }
        else {
            augOK = true;
        }
        //augment stats = check, let's go for the enchant.
        if (enchantId) {
            $.ajax(BASEURL + enchantId[1]).success(function (data) {
                base_stats = SubstractBaseStats(data, base_stats);
                enchOK = true;
            });
        }
        else {
            enchOK = true;
        }

        var myTimer = setInterval(function () {
            if (enchOK && augOK) {
                //Generating new HTML for the item
                var output = "";
                for (var i = 0; i < order.length; i++) {
                    if (base_stats[order[i]] > 0) {
                        output += "+" + base_stats[order[i]] + " " + order[i] + "<br>";
                    }
                }
                $("#card" + itemId).find(".cardDetail")[0].innerHTML = output;
                clearInterval(myTimer);
            }
        }, 100, enchOK, augOK, base_stats);
    });

}

function TrackSelling(Id, makeAjax) {
    if (makeAjax === undefined) { makeAjax = true; }
    if (debug > 1) { LiveLog("Debug > 1 => Not selling this item!"); makeAjax = false; }
    if (disableDoubleClickSelling === 1) { LiveLog("Preventing to sell this item via double-click!"); makeAjax = false; }
    var myTimer = setInterval(function () {
        try {
            var cardId = "div#card" + Id;
            var cardText = $(cardId).html();
            var cardValue = 0;
            if (!cardText.match(/loading/) && cardText !== '') {
                cardMatch = cardText.match(/([0-9,]+)\sgold/i);
                if (!cardMatch) {
                    console.log("Could not get value for card with id '" + Id + "'\nText:" + cardText);
                }
                else {
                    cardValue = cardMatch[1].replace(",", "");
                }
                var scroll = cardText.match(/([0-9,]+)\s?\/\s?[0-9,]+\sgold/i);
                if (scroll) { //Scroll has two values, use the first one.
                    cardValue = scroll[1].replace(",", "");
                }
                if (cardText.match(/Un-Lock/)) {
                    LiveLog("Why do you try to double-click sell a locked item? You fool this will not work!");
                }
                else {
                    LOG.LootGold += parseInt(cardValue);
                    LOG.ItemsSold++;
                    localStorage.setItem("battleLog", JSON.stringify(LOG));
                    LiveLog("Sold an item for  " + cardValue + " gold.");
                    //Manual ajax call
                    if (makeAjax) {
                        $.ajax("/sell/" + Id).done(function (data) { $("#drakorWorld").html(data); });
                    }
                }
                clearInterval(myTimer);
            }
            else {//wait...
            }
        }
        catch (ex) {
            console.log("OOOOOH!\n" + ex.message);
            clearInterval(myTimer);
        }
    }, 100);
}

function GenerateHistory(LOG, battleId, text) {
    try {
        var challMatch = text.match(/\$\('#chall_hp'\)\.html\('[^|]+?'\);/g);
        var enemyMatch = text.match(/\$\('#opp_hp'\)\.html\('[^|]+?'\);/g);
        for (var i = 0; i < challMatch.length; i++) {
            var tr = $(document.createElement("tr"));
            if (!LOG['history-' + battleId]) {
                LOG['history-' + battleId] = [1];
            }
            else {
                LOG['history-' + battleId][0]++;
            }
            $(document.createElement("td")).html("Round " + LOG['history-' + battleId][0]).appendTo(tr);
            var yourHP = challMatch[i].match(/(\d+)\s?\/\s?(\d+)/);
            yourHP = yourHP[1] + " / " + yourHP[2];
            var enemyHP = enemyMatch[i].match(/(\d+)\s?\/\s?(\d+)/);
            enemyHP = enemyHP[1] + " / " + enemyHP[2];
            $(document.createElement("td")).html(yourHP).appendTo(tr);
            $(document.createElement("td")).html(enemyHP).appendTo(tr);
            if (!LOG['history-' + battleId]) {
                LOG['history-' + battleId].push($(tr).html());
            }
            else {
                LOG['history-' + battleId].push($(tr).html());
            }
        }
        localStorage.setItem("battleLog", JSON.stringify(LOG));
    }
    catch (ex) {
        console.log("!!!!\nGenerateHistory caused an issue.\nTEXT: " + text);
    }
}

function AnalyseStats(LOG, playerObject, enemyObject, battleId) {
    try {
        var stats = ['HP', 'Combat', 'Magic', 'Heal', 'Regen', 'DEF', 'statValue'];
        var player = {};
        var enemy = {};
        var statsMatch = $(playerObject).find(".statRow").get(3).innerHTML.match(/\d+/g);
        for (var j = 0; j < statsMatch.length; j++) {
            player[stats[j + 1]] = statsMatch[j];
        }
        var statsMatch = $(enemyObject).find(".statRow").get(2).innerHTML.match(/\d+/g);
        for (var j = 0; j < statsMatch.length; j++) {
            enemy[stats[j + 1]] = statsMatch[j];
        }
        player.HP = $(playerObject).find("#chall_hp").html().match(/\d+ \/ (\d+)/)[1];
        enemy.HP = $(enemyObject).find("#opp_hp").html().match(/\d+ \/ (\d+)/)[1];
        player.statValue = parseInt(player.HP) + Number(player.Combat * 7.5) + Number(player.Magic * 7.5) + Number(player.Heal * 5) + Number(player.Regen * 15) + Number(player.DEF * 2.5);
        enemy.statValue = parseInt(enemy.HP) + Number(enemy.Combat * 7.5) + Number(enemy.Magic * 7.5) + Number(enemy.Heal * 5) + Number(enemy.Regen * 15) + Number(enemy.DEF * 2.5);

        //Analyzing done, create table
        var table = $(document.createElement("table"));
        var leftRow = ['Who', 'Player', 'Enemy'];
        for (var column = 0; column < leftRow.length; column++) {
            var tr = $(document.createElement("tr"));
            var td = $(document.createElement("td")).html(leftRow[column]).appendTo(tr);
            for (var k = 0; k < stats.length; k++) {
                var td = $(document.createElement("td"));
                if (column === 0) {
                    td.html(stats[k]);
                }
                else if (column === 1) {
                    td.html(player[stats[k]]);
                }
                else if (column === 2) {
                    td.html(enemy[stats[k]]);
                }
                td.appendTo(tr);
            }
            tr.appendTo(table);
        }
        LOG['stats-' + battleId] = table.html();
        localStorage.setItem("battleLog", JSON.stringify(LOG));
    }
    catch (ex) {
        LiveLog("AnalyseStats had an error..\n" + ex.message);
    }
}

function DisplayHistory(spanObject) {
    var id = $(spanObject).attr('id');
    var historyId = id.match(/span-(.*?)$/)[1];
    var realId = historyId.match(/(\d+)/)[1];
    if ($("#div-" + historyId).css('display') === "none") {
        $("#div-" + historyId).css("display", "block");
        if ($("#div-" + historyId).html() !== "") {
            console.log("Div seems to be filled with text already, just displaying it instead of re-creating...");
            return;
        }
        else {
            var table = $(document.createElement("table"));
            var tr = $(document.createElement("tr"));
            $(document.createElement("td")).html("Round #").appendTo(tr);
            $(document.createElement("td")).html("Your HP").appendTo(tr);
            $(document.createElement("td")).html("Enemy HP").appendTo(tr);
            $(tr).appendTo(table);
            for (var i = 1; i < LOG[historyId].length; i++) {
                var tr = $(document.createElement("tr"));
                $(tr).appendTo(table);
                $(tr).html(LOG[historyId][i]);
            }
            $("#div-" + historyId).html("<table>" + LOG['stats-' + realId] + "</table><br><br><table>" + $(table).html() + "</table>");
            var stylingObject = { "border": "1px solid black", "text-align": "center", "padding": "10px" };
            $("#div-" + historyId).find("td").css(stylingObject);
        }
    }
    else {
        $("#div-" + historyId).css("display", "none");
    }
}

function SetupLiveLog() {
    var fragment = document.createDocumentFragment();
    var div = $(document.createElement("div"));
    var baseDiv = $(div).attr({ id: "battleLogDialog", title: "Battle Log" })
	.css({ "font-size": "14px", "background-color": "lightgrey", "display": "none", 'text-align': 'left' })
	.on("mouseenter", function () {
	    $(".showHistory").on("click", function () {
	        DisplayHistory(this);
	    });
	})
	.on("mouseleave", function () {
	    $(".showHistory").off("click");
	})
	.on("dialogdragstop", function () {
	    var vals = ['left', 'top', 'right', 'bottom'];
	    for (var i = 0; i < vals.length; i++) {
	        //console.log(vals[i] + ": OLD: " + LOG["diaLOG-" + vals[i]] + " | NEW: " + $($(this).parents().get(0)).css(vals[i]));
	        LOG["dialog-" + vals[i]] = $($(this).parents().get(0)).css(vals[i]);
	    }
	    localStorage.setItem("battleLog", JSON.stringify(LOG));
	})
	.on("dialogresizestop", function () {
	    var vals = ['width', 'height'];
	    for (var i = 0; i < vals.length; i++) {
	        //console.log(vals[i] + ": OLD: " + LOG["diaLOG-" + vals[i]] + " | NEW: " + $($(this).parents().get(0)).css(vals[i]));
	        LOG["dialog-" + vals[i]] = $($(this).parents().get(0)).css(vals[i]);
	    }
	    localStorage.setItem("battleLog", JSON.stringify(LOG));
	})
	.appendTo(fragment);
    baseDiv.dialog({
        autoOpen: false,
        show: {
            effect: "blind",
            duration: 500
        },
        close: {
            effect: "slide",
            duration: 500
        }
    });

    var duraDiv = $(document.createElement("div")).clone()
	.attr({ id: 'durabilityDisplay' })
	.css({ 'background-color': 'orange', 'text-align': 'center', 'width': '100%' }).appendTo(baseDiv);
    //, 'display': 'table-cell'
    var enchantDiv = $(document.createElement("div")).clone()
	.attr({ id: 'enchantDiv' })
	.css({ 'background-color': 'cyan', 'text-align': 'center', 'width': '100%' })
	.appendTo(baseDiv);
    var logDiv = $(div).clone().attr({ 'id': 'LiveLog' }).css('text-align', 'left').appendTo(baseDiv);
    $(fragment).appendTo("#gs_topmenu");
    var showLog = $(document.createElement("a")).attr({ id: "liveLogButton", class: "gs_topmenu_item" })
	.text("Battle Log")
	.on("click", function () {
	    if ($("#battleLogDialog").dialog("isOpen")) {
	        $("#battleLogDialog").dialog("close");
	    }
	    else {
	        setTimeout(function () { // We need a timeout here since we need to wait for the diaLOG to appear to be able to modify it
	            var vals = ['left', 'top', 'right', 'bottom', 'width', 'height'];
	            for (var i = 0; i < vals.length; i++) {
	                $($("#battleLogDialog").parents().get(0)).css(vals[i], LOG['dialog-' + vals[i]]);
	            }
	            $("#battleLogDialog").css("height", (parseInt(LOG['dialog-height'].replace("px", "")) - 50) + "px");
	        }, 600);
	        $(baseDiv).dialog("open");
	    }
	})
	.appendTo("#gs_topmenu");

}

function LiveLog(logText, addBR) {
    if (addBR === undefined || addBR === true) {
        logText += "<br>";
    }
    else {
        //console.log("addBR is not true..");
    }
    var logDiv = $("#LiveLog");
    var date = new Date();
    date.setTime(date.getTime() + (-3 + date.getTimezoneOffset() / 60) * 60 * 60 * 1000);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    $(logDiv).html((hours < 10 ? '0' : '') + hours + ":" + (minutes < 10 ? '0' : '') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds + " " + logText + $(logDiv).html());
    console.log((hours < 10 ? '0' : '') + hours + ":" + (minutes < 10 ? '0' : '') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds + " " + logText + $(logDiv).html());
}

function AddCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function AddEnterShortcut(object) {
    $(document).off("keydown");
    $(document).on("keydown", function (e) {

        if (e.keyCode === 13) {
            if (!$("#chatMsg").is(":focus")) { //Only click it if you are not in the window
                if ($("#npcTimer").text().match(/[1-9]0?%/) || $("#skill-timer").text().match(/[1-9]0?%/)) {
                    e.preventDefault();
                    return;
                }
                object.click();
            }
        }
    });
}

function AddEnterToSpecificClass(className, textToLookFor) {
    var classes = $("." + className);
    for (var i = 0; i < classes.length; i++) {
        // console.log("Index: " + i + "\nMessage: " + classes[i].innerText);
        if (classes[i].innerText === textToLookFor) {
            AddEnterShortcut(classes[i]);
        }
    }
}

function CheckInventory() {
    $.ajax("/inventory").success(function (data) {
        var spellArea = data.match(/dcontainer\s*charbattledeck\s*\">.*?(<div id=\"icon.*?)<div\sid=\"char_inventory\"/i)[1];
        if (spellArea.match(/nodurability/i)) {
            alert("One or more spells do not have enough durability");
        }
        //Because sometimes the loot counter doesn't update let's do it here again
        if ($("#load-openloot").html().match(/(\d+)/)[1] === "0" && LOG.CurrentLoot > 0) {
            LOG.CurrentLoot = 0;
            localStorage.setItem("battleLog", JSON.stringify(LOG));
        }
        var duras = spellArea.match(/remaining durability\: (\d+)/gi);
        var output = '| ';
        for (var i = 0; i < duras.length; i++) {
            var dura = duras[i].match(/(\d+)/)[1];
            if (dura < 10) { dura = "<span style='color: red'><b>0" + dura + "</b></span>"; }
            output += dura + " | ";
        }
        var attemptsToLevel = GetAttemptsToNextLevel(data);
        output += "<br/>Average fights left to level up: " + attemptsToLevel;
        console.log("Updated durability div to " + output);
        $("#durabilityDisplay").html(output);
    });
}

function CheckForDepletedNode() {
    try {
        var nodes = $(".menuFighting");
        if (nodes.length === 0) {
            return;
        }
        else {
            for (var i = 0; i < nodes.length; i++) {
                if ($(nodes[i]).html().match(/depleted/i)) {
                    var date = new Date();
                    date.setTime(date.getTime() + (-3 + date.getTimezoneOffset() / 60) * 60 * 60 * 1000);
                    var html = $(nodes[i]).html();
                    var waitTime = 0;
                    var minutes = html.match(/(\d+)\s*m/i);
                    if (minutes) {
                        date.setMinutes(date.getMinutes() + parseInt(minutes[1]));
                        waitTime += (parseInt(minutes[1]) * 60);
                    }
                    var seconds = html.match(/(\d+)\s*s/i);
                    if (seconds) {
                        date.setSeconds(date.getSeconds() + parseInt(seconds[1]));
                        waitTime += parseInt(seconds[1]);
                    }
                    waitTime = waitTime * 1000 + 1000; //Wait 1 second longer to reset
                    var resultDate = date.toJSON();
                    resultDate = resultDate.replace(/T/, " ");
                    resultDate = resultDate.replace(/\..*?$/, "");
                    var location = $($(".locationTitle").get(0)).html();
                    location.replace(/<div.*?>.*?<\/div>/g, "");
                    var locMatch = location.match(/([\w\s]+)$/);
                    if (locMatch) {
                        location = locMatch[1];
                    }
                    LiveLog("Node '" + location + "' will respawn at " + resultDate);
                }
            }
        }
    }
    catch (ex) {
        if (debug > 0) {
            LiveLog("D: Something went wrong when trying to check for a depleted node..<br>Error: " + ex.message);
        }
    }
}

function Create_Log_Object() {
    var LOGBefore;
    var LOGLoaded = false;
    try {
        LOGBefore = JSON.parse(localStorage.getItem("battleLog"));
        if (LOGBefore) {
            LOGLoaded = true;
        }
    }
    catch (ex) { }
    var LOG = {};
    LOG.Won = 0;
    LOG.Lost = 0;
    LOG.Gold = 0;
    LOG.TotalLoot = 0;
    LOG.CurrentLoot = 0;
    LOG.ConsolationLoot = 0;
    LOG.LootGold = 0;
    LOG.ItemsSold = 0;
    LOG.WonWithoutLoot = 0;
    LOG.Experience = 0;
    LOG.Spell = {};
    LOG.Augment = {};
    LOG.Enchant = {};
    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    for (var j = 0; i < rarities.length; j++) {
        LOG.Spell[rarities[j]] = false;
        LOG.Augment[rarities[j]] = false;
        LOG.Enchant[rarities[j]] = false;
    }
    var diffArray = ["Elite", "Hard", "Medium", "Easy"];
    var dropArray = { 'Durability Scroll': {}, 'Spell': {}, 'Equipment': {}, 'Item Augment': {}, 'Enchant': {}, 'Food': {} };
    var keyArray = ["Gold", "Experience", "Won", "Lost", "Loot", "ConsolationLoot", "WonWithoutLoot", "Common", "Superior", "Rare", "Epic", "Legendary"];
    for (var i = 0; i < diffArray.length; i++) {
        LOG[diffArray[i]] = {};
        for (var j = 0; j < keyArray.length; j++) {
            LOG[diffArray[i]][keyArray[j]] = 0;
        }
        for (var keys in dropArray) {
            LOG[diffArray[i]][keys] = dropArray[keys];
        }
    }
    localStorage.setItem("battleLog", JSON.stringify(LOG));
    return LOG;
}

function GetAttemptsToNextLevel(invText) {
    var totalFights = parseInt(LOG.Lost) + Number(LOG.Won);
    var averageExperience = Math.floor(LOG.Experience / totalFights);
    var currentExp = parseInt(invText.match(/statexp\".*?>([0-9,]+)/i)[1].replace(",", ""));
    var currentLevel = parseInt(invText.match(/<div class="avatarLevel">Level (\d+)/i)[1]);
    var neededExp = currentLevel * currentLevel * 100;
    var neededAttempts = Math.round((neededExp - currentExp) / averageExperience);
    return neededAttempts;
}

function SetupLog() {
    var totalFights = LOG.Lost + LOG.Won;
    var averageGold = Math.floor(LOG.Gold / totalFights);
    var averageExperience = Math.floor(LOG.Experience / totalFights);
    var averageItems = (LOG.TotalLoot / totalFights).toFixed(2);
    var divHTML = "You fought a total of " + totalFights + " total battles.<br/>You gained " + LOG.TotalLoot + " items (" +
		averageItems + " on average) and sold " + LOG.ItemsSold + " items which brought you a total of " +
		LOG.LootGold + " gold.<br/>You did not receive loot for a won battle " + LOG.WonWithoutLoot +
		" times. (" + (LOG.WonWithoutLoot / LOG.Won * 100).toFixed(2) + " %)<br/>You made a total of " + LOG.Experience + " Experience (" + averageExperience +
		" on average) and made a total of " + LOG.Gold + " gold ( " + averageGold +
		" on average)<br/>You won " + parseInt(LOG.Won) + " times (" + (LOG.Won / totalFights * 100).toFixed(2) +
		"%) and lost " + parseInt(LOG.Lost) + " times (" + (LOG.Lost / totalFights * 100).toFixed(2) + "%).<br/>";
    divHTML = AddCommas(divHTML);
    var displayDiv = $(".arenaContainer").get(2);
    displayDiv.innerHTML = divHTML;
    var resetButton = $(document.createElement("button")).text("Reset Statistics").attr({ class: "bv_button bv_small_font" }).css({ width: "auto", height: "auto" }).on("click", function () {
        LOG = Create_Log_Object();
        SetupLog();
    }).appendTo(displayDiv);
    var detailDiv = $($(".arenaContainer").get(3));
    detailDiv.html("");
    var h3 = $(document.createElement("h3")).html("Select a difficulty to get more details").appendTo(detailDiv);
    var select = $(document.createElement("select")).attr({ 'id': 'diffSelect' }).appendTo(detailDiv);
    var tableDiv = $(document.createElement("div")).attr({ 'id': 'tableDiv' }).appendTo(detailDiv);
    var detailHTML = "<h3>Select a difficulty to get more details</h3><select id='diffSelect'>";
    var diffArray = ["Easy", "Medium", "Hard", "Elite"];
    for (var i = 0; i < diffArray.length; i++) {
        var option = $(document.createElement("option")).attr({ 'value': diffArray[i] }).text(diffArray[i]).appendTo(select);
    }
    $("#diffSelect").on("change", function () {
        DisplayStatistics($(this).val());
        localStorage.setItem("BS_select", $(this).val());
    });
    var diff = localStorage.getItem("BS_select") || "Easy";
    $("#diffSelect").val(diff);
    DisplayStatistics(diff);
}

function DisplayStatistics(difficulty) {
    try {
        $("#tableDiv").html("");
        if (LOG[difficulty]) {
            var totalFights = parseInt(LOG[difficulty].Won) + Number(LOG[difficulty].Lost);
            var fightLootKeys = ["WonWithoutLoot", "Common", "Superior", "Rare", "Epic", "Legendary"];
            var fightAverageKeys = ['Gold', 'Experience', 'Loot'];
            var fightTotalPercentage = ["Won", "Lost"];
            var table = $(document.createElement("table")).css({ "border": "1px solid white", "width": "100%" });
            var LOGObj = LOG[difficulty];
            keys = Object.keys(LOGObj);
            len = keys.length;

            keys.sort();
            var newObj = {};
            for (i = 0; i < len; i++) {
                k = keys[i];
                newObj[k] = LOGObj[k];
            }
            LOGObj = newObj;
            console.log("LOGOBJ", LOGObj);
            if (difficulty === "Hard") {
                LOG.Hard.Loot += LOG.Elite.Loot;
            }
            for (var j = 0; j < fightTotalPercentage.length; j++) {
                var tr = CreateTableRow([
					fightTotalPercentage[j],
					LOGObj[fightTotalPercentage[j]] + " (" + (LOGObj[fightTotalPercentage[j]] / totalFights * 100).toFixed(2) + " %)"
                ]);
                tr.appendTo(table);
            }
            for (var k = 0; k < fightAverageKeys.length; k++) {
                var tr = CreateTableRow([
					fightAverageKeys[k],
					LOGObj[fightAverageKeys[k]] + " (" + (LOGObj[fightAverageKeys[k]] / totalFights).toFixed(2) + " on average)"
                ]);
                tr.appendTo(table);
            }
            for (var i = 0; i < fightLootKeys.length; i++) {
                if (LOGObj[fightLootKeys[i]] === 0 || LOGObj[fightLootKeys[i]] === undefined) { continue; } //Item Augments/ Dura Scrolls can have this.
                var tr = CreateTableRow([
					fightLootKeys[i],
					LOGObj[fightLootKeys[i]] + " (" + (LOGObj[fightLootKeys[i]] / LOGObj.Loot * 100).toFixed(2) + " %)"
                ]);
                tr.appendTo(table);
            }
            for (var keys in LOGObj) {
                if (keys === "Spell" || keys === "Equipment" || keys === "Food" || keys === "Enchant" || keys === "Item Augment" || keys === "Durability Scroll") {
                    //These keys all have subitems.
                    var totalCounter = 0;
                    var subtable = $(document.createElement("table")).css({ "display": "none", "width": "100%" }).attr({ 'id': 'subtable-' + keys.replace(" ", "_") });
                    var rarities = ['Common', 'Superior', 'Rare', 'Epic', 'Legendary'];
                    var shortRarities = ['C', 'S', 'R', 'E', 'L'];
                    var tr = CreateTableRow(["Type", "Total", shortRarities]);
                    tr.appendTo(subtable);
                    for (var subkeys in LOGObj[keys]) {
                        var counter = 0;
                        var tempArray = []; //Save the rarities in this temp array
                        for (var l = 0; l < rarities.length; l++) {
                            if (LOGObj[keys][subkeys][rarities[l]]) {
                                tempArray.push(LOGObj[keys][subkeys][rarities[l]]);
                                counter += parseInt(LOGObj[keys][subkeys][rarities[l]]);
                            }
                            else {
                                tempArray.push("0");
                            }
                        }
                        var tr = CreateTableRow([
							subkeys,
							counter,
							tempArray
                        ]);
                        tr.appendTo(subtable);
                        totalCounter += counter;
                    }
                    if (totalCounter > 0) {
                        subtable.appendTo($("#tableDiv"));
                        subtable.find("td").css("width", "14%");
                        var tr = CreateTableRow([
							keys,
							totalCounter + " (" + (totalCounter / LOGObj.Loot * 100).toFixed(2) + " %)"
                        ]);
                        tr.attr({ 'id': 'tr-subtable-' + keys.replace(" ", "_") });
                        tr.appendTo(table);
                    }
                }
            }

            table.html(AddCommas(table.html()));
            console.log(table);
            table.appendTo($("#tableDiv"));
            $("#tableDiv").find("td").css("border", "1px grey solid");
            $(document).uitooltip({ //this will fail if bootstrap and jQuery UI are used at the same time.. :(
                items: "tr",
                content: function () {
                    var element = $(this);
                    if (element.attr('id')) {
                        if (element.attr('id').match(/^tr-subtable/)) {
                            return "<table>" + $("#subtable-" + element.attr('id').match(/^tr-subtable-(\w+)/)[1]).html() + "</table>";
                        }
                    }
                    else { }
                }
            });
        }
    }
    catch (ex) {
        LiveLog("When trying to display the statistics something really bad happened...<br>" + ex.message);
        console.log("EXCEPTION:");
        console.log(ex);
    }
}

function CreateTableRow(tds) {
    var tr = $(document.createElement("tr"));
    for (var i = 0; i < tds.length; i++) {
        if (typeof tds[i] === "object") {
            for (var j = 0; j < tds[i].length; j++) {
                var td = $(document.createElement("td")).html(tds[i][j]).appendTo(tr);
            }
        }
        else {
            var td = $(document.createElement("td")).html(tds[i]).appendTo(tr);
        }
    }
    return tr;
}

function DisenchantSetup() {
    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    var selects = ["Augment", "Enchant", "Spell"];
    var table = $(document.createElement("table")).attr({ id: 'disenchantingTable' });
    for (var i = 0; i < selects.length; i++) {
        if (LOG[selects[i]] === undefined) { LOG[selects[i]] = {}; } // For older version compatibility
        var row = $(document.createElement("tr")).attr({ 'class': 'disenchantingSelect' }).appendTo(table);
        var info = $(document.createElement("td")).html("Disenchant " + selects[i] + " up to x rarity");
        $(info).appendTo(row);
        var td = $(document.createElement("td"));

        for (var j = 0; j < rarities.length; j++) {
            if (LOG[selects[i]][rarities[j]] === undefined) { LOG[selects[i]][rarities[j]] = false; } // for older version compatibility
            var checkbox = $(document.createElement("input")).attr({ 'id': selects[i] + "-" + rarities[j], 'type': 'checkbox' }).on("change", function () {
                var temp = $(this).attr('id').split("-");
                var type = temp[0];
                var rarity = temp[1];
                if ($(this).prop('checked')) {
                    if (debug > 0) {
                        LiveLog("D: Set type '" + type + "' with Rarity '" + rarity + "' to 1");
                    }
                    LOG[type][rarity] = true;
                }
                else {
                    if (debug > 0) {
                        LiveLog("D: Set type '" + type + "' with Rarity '" + rarity + "' to 0");
                    }
                    LOG[type][rarity] = false;
                }
                localStorage.setItem("battleLog", JSON.stringify(LOG));
            }).prop("checked", LOG[selects[i]][rarities[j]]).appendTo(td);
            var span = $(document.createElement("span")).html(rarities[j].match(/(^\w)/)[1]).appendTo(td);
        }
        $(td).appendTo(row);
    }
    if (debug > 0) {
        LiveLog("D: Showing selects: " + LOG.ShowDeingSelects);
    }
    var hideRow = $(document.createElement("td")).attr({ 'colspan': '2' }).css('text-align', 'center').html("Hide Drop-Downs").on("click", function () {
        LiveLog("D: Showing options is currently: " + LOG.ShowDeingSelects);
        if ($(this).html().match(/hide/i)) {
            $(".disenchantingSelect").css("display", "none");
            $(this).html("Show Drop-Downs");
            LOG.ShowDeingSelects = false;
        }
        else {
            $(".disenchantingSelect").css("display", "table-row");
            $(this).html("Hide Drop-Downs");
            LOG.ShowDeingSelects = true;
        }
        if (debug > 0) {
            LiveLog("D: Showing options is now: " + LOG.ShowDeingSelects);
        }
        localStorage.setItem("battleLog", JSON.stringify(LOG));
    }).appendTo(table);
    $(table).insertAfter("#exp-disenchanting");
    $("td").css("vertical-align", "middle");
    if (LOG.ShowDeingSelects !== true) {
        LOG.ShowDeingSelects = false; //Backwards compatibility
        $(hideRow).html("Show Drop-Downs");
        $(".disenchantingSelect").css("display", "none");
    }
    localStorage.setItem("battleLog", JSON.stringify(LOG));
}

function SelectItemToDisenchant() {
    var LOG = JSON.parse(localStorage.getItem("battleLog"));
    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    var possibleItems = $(".roundResult.areaName").find(".cLink");
    var itemToDE;
    for (var i = 0; i < possibleItems.length; i++) {
        console.log("POSSIBLE ITEM: ", $(possibleItems[i]));
        var id = $(possibleItems[i]).attr("id").match(/(\d+)/)[1];
        console.log("ID: " + id);
        var item = possibleItems[i];
        var type = item.innerText.match(/(battle|enchant|augment)/i)[1];
        if (type === "Battle") { type = "Spell"; } //Remapping
        var rarity = item.className.match(/card(\w+)/i)[1];
        if ($("#" + type + "-" + rarity).prop('checked')) { //New change
            itemToDE = item;
            i = possibleItems.length;
        }
    }

    $(".roundResult.areaName").each(function (index, obj) {
        var deingLink = $($(obj).children().get(0));
        if (deingLink.attr("id") === undefined) { return; }
        var id = deingLink.attr("id").match(/load-world-disenchanting-(\d+)/i);
        if (id) { id = id[1]; }
        else { return; }
    });

    var span = $(document.createElement("span")).insertAfter($("#disenchantingTable"));
    if (itemToDE === undefined) {
        $(span).html("<br/>There is no item to be disenchanted");
    }
    else {
        AddEnterShortcut($(itemToDE).parents().children().get(0));
        $(span).html("<br>This is will be disenchanted: ");
        $(itemToDE).clone().appendTo(span);
    }
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

function DumpHTMLElement(object, other) { //Experimental
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
            console.log("TEXT: \n" + text);
            //text = text.replace(/<\/?br\/?>/g, "\n")
            //$(document.createElement(font[level[0]])).css(font[level[1]]).text(text).prependTo($(debugId));
        }
    }
    catch (e) {
        Error(e.message);
    }
}