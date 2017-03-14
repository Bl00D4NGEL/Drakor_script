// ==UserScript==
// @name         Battle-statistics v1.612
// @version      1.612
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// @match        https://*.drakor.com*
// ==/UserScript==



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
LockedItems => {}
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
var debug = 1;
var disableDoubleClickSelling = 0;
$(document).ready(function () {
    var version = "v1.612";
    SetupLiveLog(); //Live-log-div setup under chat
    LiveLog("You're currently using Battle Statistics version " + version);
    CheckInventory(); //To load the durability data into the livelog
    if (!localStorage.getItem("battleLog")) {
        LiveLog("Log not found, creating a new one");
        log = Create_Log_Object();
    }
    else {
        log = JSON.parse(localStorage.getItem("battleLog"));
        console.log(log);
        LiveLog("Battle Statistics Log succesfully loaded");
    }
    AddEnterShortcut($(".menuFighting"));
    $(".menuFighting").on("click", function () {
        CheckInventory();
    });
    if (debug > 0) {
        LiveLog("D: Current Loot (Drakor) is " + $("#load-openloot").html().match(/(\d+)/)[1] + " and log.CurrentLoot is " + log.CurrentLoot);
    }
    if (log.CurrentLoot > 0 && $("#load-openloot").html().match(/(\d+)/)[1] !== "0") {
        //LiveLog("Set 'Actual Loot' to " + log.CurrentLoot);
        var lootbagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
        $("#load-openloot").html(lootbagText + "(" + log.CurrentLoot + ")");
    }
    else if ($("#load-openloot").html().match(/(\d+)/)[1] === "0" && log.CurrentLoot !== 0) {
        log.CurrentLoot = 0;
        localStorage.setItem("battleLog", JSON.stringify(log));
        LiveLog("Setting 'Actual Loot' to 0 because the loot bag got opened without notice");
    }
    else { }

    for (var keys in log) {
        if (keys.match(/^(stats|history)/)) {
            log[keys] = undefined;
        }
    }
    CheckForDepletedNode();
    localStorage.setItem("battleLog", JSON.stringify(log)); //Overwrite localstorage
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
                var difficulty = $(".battleDiff").html().match(/:\s(\w+).*/)[1];
                log = JSON.parse(localStorage.getItem("battleLog"));
                GenerateHistory(log, battleId, xhr.responseText);
                AnalyseStats(log, $(".challengerProfile"), $(".opponentProfile"), battleId);
                if (xhr.responseText.match(/victory/)) {
                    // difficulty = xhr.responseText.match(/<h4>(\w+).*?<\/h4>/i)[1];
                    //Generates the "history" of the battle and returns the log object
                    console.log(difficulty);
                    log.Won++;
                    log[difficulty].Won++;
                    var loot = xhr.responseText.match(/modLoot\((\d)\)/);
                    if (loot) { //Got loot
                        var realLoot = xhr.responseText.match(/with\s(\d+)\sitem/i);
                        LiveLog("Victory (" + $($(".roundResult").get(0)).html().match(/(#\d+)/)[1] + ") - Looted " + realLoot[1] + " item" + (Number(realLoot[1]) > 1 ? 's' : '') +
								" <span class='showHistory' id='span-history-" + battleId + "' style='text-decoration: underline;'>History</span><br><div  style='display:none' id='div-history-" + battleId + "'></div>", false);
                        log.TotalLoot += Number(realLoot[1]);
                        log.CurrentLoot += Number(realLoot[1]);
                        log[difficulty].Loot += Number(realLoot[1]);
                        var lootbagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
                        var itemsInLootbag = lootbagText.match(/(\d+)/);
                        if (itemsInLootbag[1] === "1") {
                            //LiveLog("Loot bag has been opened");
                            log.CurrentLoot = Number(realLoot[1]);
                        }
                        $("#load-openloot").html(lootbagText + "(" + log.CurrentLoot + ")");
                    }
                    else {
                        LiveLog("Victory (" + $($(".roundResult").get(0)).html().match(/(#\d+)/)[1] + ") - Looted 0 items! " +
								"<span class='showHistory' id='span-history-" + battleId + "' style='text-decoration: underline;'>History</span><br><div  style='display:none' id='div-history-" + battleId + "'></div>", false);
                        log.WonWithoutLoot++;
                        log[difficulty].WonWithoutLoot++;
                    }
                    var exp = xhr.responseText.match(/([0-9,]+)\s?\w*\s?exp/i);
                    log.Experience += Number(exp[1].replace(",", ""));
                    log[difficulty].Experience += Number(exp[1].replace(",", ""));
                    var gold = xhr.responseText.match(/>([0-9,]+)\sgold/i);
                    if (gold) {
                        log.Gold += Number(gold[1].replace(",", ""));
                        log[difficulty].Gold += Number(gold[1].replace(",", ""));
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
                    LiveLog("Defeat (" + $($(".roundResult").get(0)).html().match(/(#\d+)/)[1] + ") " +
							"<span class='showHistory' id='span-history-" + battleId + "' style='text-decoration: underline;'>History</span><br><div  style='display:none' id='div-history-" + battleId + "'></div>", false);
                    log.Lost++;
                    log[difficulty].Lost++;

                    if (xhr.responseText.match(/modloot/i)) {
                        log.ConsolationLoot++;
                        log[difficulty].ConsolationLoot++;
                        log.CurrentLoot++;
                        var bagText = $("#load-openloot").html().match(/(.*\d+).*/)[1];
                        var itemsInBag = bagText.match(/(\d+)/);
                        if (itemsInBag[1] === "1") {
                            //LiveLog("Loot bag has been opened");
                            log.CurrentLoot = 1;
                        }
                        $("#load-openloot").html(bagText + "(" + log.CurrentLoot + ")");

                    }

                    AddEnterToSpecificClass("navButton", "Back to Adventure");
                    AddEnterToSpecificClass("navButton", "Back to Arena");
                }

                localStorage.setItem("battleLog", JSON.stringify(log));
            }
            catch (e) {
                LiveLog("Oh that's not good..<br/>" + e.message);
            }
        }
        else if (settings.url.match(/\/battle-create\/.*/)) {
            AddEnterToSpecificClass("navButton", "Start Battle!");
        }
        else if (settings.url === "/sell/sellall") {
            if (xhr.responseText.match(/areaname\">([0-9,]+)\sg/i)) {
                log = JSON.parse(localStorage.getItem("battleLog"));
                var goldEarned = xhr.responseText.match(/areaname\">([0-9,]+)\sg/i)[1].replace(",", "");
                var itemsSold = $("#drakorWorld").find(".drIcon").length;
                LiveLog("Sell all: Sold " + itemsSold + " items for " + goldEarned + " gold.");
                log.LootGold += Number(goldEarned);
                log.ItemsSold += Number(itemsSold);
                localStorage.setItem("battleLog", JSON.stringify(log));
            }
        }
        else if (settings.url.match(/openloot\/open\/all/i)) {
            log = JSON.parse(localStorage.getItem("battleLog"));
            log.CurrentLoot = 0;
            var lootItems = 0;
            var lootbags = xhr.responseText.match(/<h3>(.*?)<script>/g);
            for (var i = 0; i < lootbags.length; i++) {
                try {
                    var lootbag = lootbags[i];
                    var diff = lootbag.match(/\((\w+)\)/)[1];
                    var items = lootbag.match(/<div class="cardContainer.*?<\/b>\s*<\/div>\s*<\/div>/g);
                    for (var j = 0; j < items.length; j++) {
                        lootItems++;
                        var item = items[j];
                        var rarity = item.match(/cardquality\">(\w+)</i)[1];
                        log[diff][rarity]++;
                        var image = item.match(/<img.*?\/images\/(\w+)\/[\d\w]+\.png/);
                        var type = item.match(/<span class=\"cardType\">([\w\s\d:?]+)</i)[1];
                        type = type.replace("Item : ", "Equipment : ");
                        type = type.replace("Battle", "Spell");
                        if (type === "Weapon") {
                            type = "Equipment : Weapon";
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
                                    if (!log[diff][type][type][rarity]) {
                                        log[diff][type][type][rarity] = 1;
                                    }
                                    else {
                                        log[diff][type][type][rarity]++;
                                    }
                                    console.log("Added something to log->" + diff + "->" + type + "->" + type + "->" + rarity + " .. okay?");
                                }
                                catch (ex) {
                                    //older versions did not have this -> add it now
                                    try { //try again
                                        log[diff][type] = {};
                                        log[diff][type][type] = {};
                                        log[diff][type][type][rarity] = 1;
                                        console.log("NEW: Added something to log->" + diff + "->" + type + "->" + type + "->" + rarity + " .. okay?");
                                    }
                                    catch (ex) {
                                        console.log("Come on..");
                                    }
                                }
                            }
                            else if (otherItem) {
                                if (!log[diff][otherItem[1]]) { log[diff][otherItem[1]] = {}; }
                                if (!log[diff][otherItem[1]][otherItem[2]]) {
                                    log[diff][otherItem[1]][otherItem[2]] = {};
                                    log[diff][otherItem[1]][otherItem[2]][rarity] = 1;
                                }
                                else {
                                    log[diff][otherItem[1]][otherItem[2]][rarity]++;
                                }
                                localStorage.setItem("battleLog", JSON.stringify(log));
                                if (debug > 0) {
                                    console.log("Added something to log->" + diff + "->" + otherItem[1] + "->" + otherItem[2] + "->" + rarity + " .. okay?");
                                }
                            }
                            else {
                                LiveLog("Cannot determine type..<br>TYPE: '" + type + "'");
                            }
                        }
                        catch (ex) {
                            LiveLog("When trying to get the type for the dropped items something went wrong...<br>Message: " + ex.message + "<br>TYPE: " + type);
                        }
                    }
                }
                catch (ex) {
                    LiveLog("When trying to process a loot item this happened: " + ex.message);
                }
            }
            //Okay let's try something here, shall we?
            var secondLootItems = $("#drakorWorld").find(".cardContainer").length;
            if (secondLootItems !== lootItems) {
                LiveLog("I don't know what happened, but Drakor tells me you looted " + secondLootItems + " items but my script got " + lootItems + " items... please tell Blood about this, okay?!");
            }
            LiveLog("Opened " + lootbags.length + " Loot bags with " + lootItems + " looted items");
            localStorage.setItem("battleLog", JSON.stringify(log));
        }
        else if (settings.url.match(/inventory/)) {
            $(".drIcon").on("dblclick", function (e) {
                if (e.currentTarget.id) {
                    var plainId = e.currentTarget.id.slice(4);
                    var log = JSON.parse(localStorage.getItem("battleLog"));
                    if (!log.LockedItems) { log.LockedItems = {}; } //Backwards compatbility
                    if (log.LockedItems[plainId]) {
                        alert("This item has been locked by you. Please unlock it in order to be able to double-click sell it.");
                        return;
                    }

                    setTimeout(TrackSelling(plainId), 1000); // We need a timeout here because the card actually needs to load.
                    //$.ajax("/sell/" + plainId).done(function(data){$("#drakorWorld").html(data);});
                }
            });
            $(".drIcon").on("click", function (e) {
                var myTimer = setInterval(function () {
                    if (!$("#card" + e.currentTarget.id.slice(4)).text().match(/loading/i)) {
                        var plainId = e.currentTarget.id.slice(4);
                        var cardId = "card" + plainId;
                        //<div id="sell-3102918" class="cardButton linkSell">Sell</div>
                        $("#sell-" + plainId).on("click", function (e) {
                            TrackSelling(e.currentTarget.id.slice(5), false);
                        });
                        if ($("#lock-" + plainId).length === 0) {
                            //Create new "lock" button.
                            var lockButton = $(document.createElement("div")).attr({ 'id': 'lock-' + plainId, 'class': 'cardButton' }).html("Lock");
                            var toInsert = $("#card" + plainId).find(".cardMenu").children();
                            lockButton.insertBefore($(toInsert.get(toInsert.length - 1)));
                            //lockButton.insertBefore($($("#card" + plainId).find(".cardMenu").children().get(3)));
                            var log = JSON.parse(localStorage.getItem("battleLog"));
                            if (!log.LockedItems) { //Backwards compatibility
                                log.LockedItems = {};
                            }
                            if (log.LockedItems[plainId]) {
                                lockButton.html("Un-Lock");
                            }
                            localStorage.setItem("battleLog", JSON.stringify(log));
                            lockButton.on("click", function (e) {
                                if (e.currentTarget.id) {
                                    var log = JSON.parse(localStorage.getItem("battleLog"));
                                    var plainId = e.currentTarget.id.slice(5);
                                    if (!log.LockedItems) { log.LockedItems = {}; } //Backwards compatbility
                                    if (log.LockedItems[plainId]) {
                                        log.LockedItems[plainId] = false;
                                        $("#icon" + plainId).find(".iconLevel").css("background-color", "black");
                                        $("#lock-" + plainId).html("Lock");
                                    }
                                    else {
                                        log.LockedItems[plainId] = true;
                                        $("#icon" + plainId).find(".iconLevel").css("background-color", "green");
                                        $("#lock-" + plainId).html("Un-Lock");
                                    }
                                    localStorage.setItem("battleLog", JSON.stringify(log));
                                }
                            });
                        }
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
                        }
                        else {
                            console.log("This item has been clicked already.. still want to add the base button?");
                        }
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
                var log = JSON.parse(localStorage.getItem("battleLog"));
                if (!log.LockedItems) { log.LockedItems = {}; } //Backwards compatbility
                var id = $(obj).attr('id');
                if (id && id.match(/icon/)) {
                    if (log.LockedItems[id.match(/icon(\d+)/)[1]]) {
                        $(obj).find(".iconLevel").css("background-color", "green");
                    }
                }
            });
            var output = '';
            for (var type in counter) {
                console.log("TYPE: " + type + " CLASS LENGTH: " + $(".en-" + type).length);
                if ($(".en-" + type).length > 1) {
                    output += "There are " + $(".en-" + type).length + " " + type + " Enchants in your inventory<br>";
                    $(".en-" + type).css("background-color", "blue");
                }
                $("#enchantDiv").html(output);
            }
        }
        else if (settings.url.match(/\/world\/disenchanting/i)) { DisenchantSetup(); } //Setup of the selects
        else if (settings.url.match(/\/world\/action_disenchanting/i)) { LiveLog("You disenchanted an item"); SelectItemToDisenchant(); } //Auto de on enter press
        else if (settings.url.match(/\/use\/\d+\/confirm/i) && xhr.responseText.match(/durability/i && xhr.responseText.match(/rune|scroll/i))) { LiveLog("You repaired an item with a Durability Scroll/ Rune"); }
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

function SubstractBaseStats(data, base_stats) {
    try {
        var details = data.match(/<div class="cardDetail">(.*?)<\/div>/i)[1];
        var stats = details.match(/\+\d+[\w\s]+</ig);
        for (var i = 0; i < stats.length; i++) {
            var val = stats[i].match(/\+(\d+)/)[1];
            var stat = stats[i].match(/\+\d+ ([\s\w]+) /)[1];
            stat = stat.replace(/\s$/, "");
            base_stats[stat] -= Number(val);
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
            base_stats[stat] = Number(val);
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
            var cardText = $(cardId).text();
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
                var log = JSON.parse(localStorage.getItem("battleLog"));
                log.LootGold += Number(cardValue);
                log.ItemsSold++;
                localStorage.setItem("battleLog", JSON.stringify(log));
                LiveLog("Sold an item for  " + cardValue + " gold.");
                //Manual ajax call
                if (makeAjax) {
                    $.ajax("/sell/" + Id).done(function (data) { $("#drakorWorld").html(data); });
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

function GenerateHistory(log, battleId, text) {
    try {
        var challMatch = text.match(/\$\('#chall_hp'\)\.html\('[^|]+?'\);/g);
        var enemyMatch = text.match(/\$\('#opp_hp'\)\.html\('[^|]+?'\);/g);
        for (var i = 0; i < challMatch.length; i++) {
            var tr = $(document.createElement("tr"));
            if (!log['history-' + battleId]) {
                log['history-' + battleId] = [1];
            }
            else {
                log['history-' + battleId][0]++;
            }
            $(document.createElement("td")).html("Round " + log['history-' + battleId][0]).appendTo(tr);
            var yourHP = challMatch[i].match(/(\d+)\s?\/\s?(\d+)/);
            yourHP = yourHP[1] + " / " + yourHP[2];
            var enemyHP = enemyMatch[i].match(/(\d+)\s?\/\s?(\d+)/);
            enemyHP = enemyHP[1] + " / " + enemyHP[2];
            $(document.createElement("td")).html(yourHP).appendTo(tr);
            $(document.createElement("td")).html(enemyHP).appendTo(tr);
            if (!log['history-' + battleId]) {
                log['history-' + battleId].push($(tr).html());
            }
            else {
                log['history-' + battleId].push($(tr).html());
            }
        }
        localStorage.setItem("battleLog", JSON.stringify(log));
    }
    catch (ex) {
        console.log("!!!!\nGenerateHistory caused an issue.\nTEXT: " + text);
    }
}

function AnalyseStats(log, playerObject, enemyObject, battleId) {
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
    player.statValue = Number(player.HP) + Number(player.Combat * 7.5) + Number(player.Magic * 7.5) + Number(player.Heal * 5) + Number(player.Regen * 15) + Number(player.DEF * 2.5);
    enemy.statValue = Number(enemy.HP) + Number(enemy.Combat * 7.5) + Number(enemy.Magic * 7.5) + Number(enemy.Heal * 5) + Number(enemy.Regen * 15) + Number(enemy.DEF * 2.5);

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
    log['stats-' + battleId] = table.html();
    localStorage.setItem("battleLog", JSON.stringify(log));
}

function DisplayHistory(spanObject) {
    var log = JSON.parse(localStorage.getItem("battleLog"));
    var id = $(spanObject).attr('id');
    var historyId = id.match(/span-(.*?)$/)[1];
    var realId = historyId.match(/(\d+)/)[1];
    //if($("#" + historyId).html() !== undefined){
    //	console.log("DIV HTML: " + $("#" + historyId).html());
    //	$("#" + historyId).remove();
    //	return;
    //}
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
            for (var i = 1; i < log[historyId].length; i++) {
                var tr = $(document.createElement("tr"));
                $(tr).appendTo(table);
                $(tr).html(log[historyId][i]);
            }
            $("#div-" + historyId).html("<table>" + log['stats-' + realId] + "</table><br><br><table>" + $(table).html() + "</table>");
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
	    var log = JSON.parse(localStorage.getItem("battleLog"));
	    var vals = ['left', 'top', 'right', 'bottom'];
	    for (var i = 0; i < vals.length; i++) {
	        //console.log(vals[i] + ": OLD: " + log["dialog-" + vals[i]] + " | NEW: " + $($(this).parents().get(0)).css(vals[i]));
	        log["dialog-" + vals[i]] = $($(this).parents().get(0)).css(vals[i]);
	    }
	    localStorage.setItem("battleLog", JSON.stringify(log));
	})
	.on("dialogresizestop", function () {
	    var log = JSON.parse(localStorage.getItem("battleLog"));
	    var vals = ['width', 'height'];
	    for (var i = 0; i < vals.length; i++) {
	        //console.log(vals[i] + ": OLD: " + log["dialog-" + vals[i]] + " | NEW: " + $($(this).parents().get(0)).css(vals[i]));
	        log["dialog-" + vals[i]] = $($(this).parents().get(0)).css(vals[i]);
	    }
	    localStorage.setItem("battleLog", JSON.stringify(log));
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
	        setTimeout(function () { // We need a timeout here since we need to wait for the dialog to appear to be able to modify it
	            var log = JSON.parse(localStorage.getItem("battleLog"));
	            var vals = ['left', 'top', 'right', 'bottom', 'width', 'height'];
	            for (var i = 0; i < vals.length; i++) {
	                //log['dialog-' + vals[i]] = log['dialog-' + vals[i]].replace("px", "");
	                //console.log("SETTING " + vals[i] + " -> " + log['dialog-' + vals[i]]);
	                //.dialog( "option", "width", 500 );
	                $($("#battleLogDialog").parents().get(0)).css(vals[i], log['dialog-' + vals[i]]);
	            }
	            $("#battleLogDialog").css("height", (Number(log['dialog-height'].replace("px", "")) - 50) + "px");
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
        var inventorySpaces = Number(data.match(/<div\sid=\"char_inventory".*?><div.*?b>([0-9,]+).*?<\/b>/)[1].replace(",", ""));
        var log = JSON.parse(localStorage.getItem("battleLog"));
        if (debug > 0) {
            console.log("Inventory-spaces: " + inventorySpaces + "\nlog.CurrentLoot: " + log.CurrentLoot);
        }
        //Because sometimes the loot counter doesn't update let's do it here again
        if ($("#load-openloot").html().match(/(\d+)/)[1] === "0" && log.CurrentLoot > 0) {
            log.CurrentLoot = 0;
            localStorage.setItem("battleLog", JSON.stringify(log));
        }
        if (inventorySpaces <= 0) {
            alert("Not enough inventory space");
        }
        var duras = spellArea.match(/remaining durability\: (\d+)/gi);
        var output = '| ';
        for (var i = 0; i < duras.length; i++) {
            var dura = duras[i].match(/(\d+)/)[1];
            if (dura < 10) { dura = "<span style='color: red'><b>0" + dura + "</b></span>"; }
            output += dura + " | ";
        }
        output += '<br/>Inventory spaces left: ' + inventorySpaces;
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
                    date.setTime(date.getTime() + (-2 + date.getTimezoneOffset() / 60) * 60 * 60 * 1000);
                    var html = $(nodes[i]).html();
                    var waitTime = 0;
                    var minutes = html.match(/(\d+)\s*m/i);
                    if (minutes) {
                        date.setMinutes(date.getMinutes() + Number(minutes[1]));
                        waitTime += (Number(minutes[1]) * 60);
                    }
                    var seconds = html.match(/(\d+)\s*s/i);
                    if (seconds) {
                        date.setSeconds(date.getSeconds() + Number(seconds[1]));
                        waitTime += Number(seconds[1]);
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
    var logBefore;
    var logLoaded = false;
    try {
        logBefore = JSON.parse(localStorage.getItem("battleLog"));
        if (logBefore) {
            logLoaded = true;
        }
    }
    catch (ex) { }
    var log = {};
    log.Won = 0;
    log.Lost = 0;
    log.Gold = 0;
    log.TotalLoot = 0;
    log.CurrentLoot = 0;
    log.ConsolationLoot = 0;
    log.LootGold = 0;
    log.ItemsSold = 0;
    log.WonWithoutLoot = 0;
    log.Experience = 0;
    log.Spell = {};
    log.Augment = {};
    log.Enchant = {};
    if (logLoaded) {
        log.LockedItems = logBefore.LockedItems; //Please do NOT overwrite my precious locks :(
    }
    else {
        log.LockedItems = {};
    }
    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    for (var j = 0; i < rarities.length; j++) {
        log.Spell[rarities[j]] = false;
        log.Augment[rarities[j]] = false;
        log.Enchant[rarities[j]] = false;
    }
    var diffArray = ["Elite", "Hard", "Medium", "Easy"];
    var dropArray = { 'Durability Scroll': {}, 'Spell': {}, 'Equipment': {}, 'Item Augment': {}, 'Enchant': {}, 'Food': {} };
    var keyArray = ["Gold", "Experience", "Won", "Lost", "Loot", "ConsolationLoot", "WonWithoutLoot", "Common", "Superior", "Rare", "Epic", "Legendary"];
    for (var i = 0; i < diffArray.length; i++) {
        log[diffArray[i]] = {};
        for (var j = 0; j < keyArray.length; j++) {
            log[diffArray[i]][keyArray[j]] = 0;
        }
        for (var keys in dropArray) {
            log[diffArray[i]][keys] = dropArray[keys];
        }
    }
    localStorage.setItem("battleLog", JSON.stringify(log));
    return log;
}

function GetAttemptsToNextLevel(invText) {
    var log = JSON.parse(localStorage.getItem("battleLog"));
    var totalFights = Number(log.Lost) + Number(log.Won);
    var averageExperience = Math.floor(log.Experience / totalFights);
    var currentExp = Number(invText.match(/statexp\".*?>([0-9,]+)/i)[1].replace(",", ""));
    var currentLevel = Number(invText.match(/<div class="avatarLevel">Level (\d+)/i)[1]);
    var neededExp = currentLevel * currentLevel * 100;
    var neededAttempts = Math.round((neededExp - currentExp) / averageExperience);
    return neededAttempts;
}

function SetupLog() {
    var log = JSON.parse(localStorage.getItem("battleLog"));
    var totalFights = log.Lost + log.Won;
    var averageGold = Math.floor(log.Gold / totalFights);
    var averageExperience = Math.floor(log.Experience / totalFights);
    var averageItems = (log.TotalLoot / totalFights).toFixed(2);
    var divHTML = "You fought a total of " + totalFights + " total battles.<br/>You gained " + log.TotalLoot + " items (" +
		averageItems + " on average) and sold " + log.ItemsSold + " items which brought you a total of " +
		log.LootGold + " gold.<br/>You did not receive loot for a won battle " + log.WonWithoutLoot +
		" times. (" + (log.WonWithoutLoot / log.Won * 100).toFixed(2) + " %)<br/>You made a total of " + log.Experience + " Experience (" + averageExperience +
		" on average) and made a total of " + log.Gold + " gold ( " + averageGold +
		" on average)<br/>You won " + Number(log.Won) + " times (" + (log.Won / totalFights * 100).toFixed(2) +
		"%) and lost " + Number(log.Lost) + " times (" + (log.Lost / totalFights * 100).toFixed(2) + "%).<br/>";
    divHTML = AddCommas(divHTML);
    var displayDiv = $(".arenaContainer").get(2);
    displayDiv.innerHTML = divHTML;
    var resetButton = $(document.createElement("button")).text("Reset Statistics").attr({ class: "bv_button bv_small_font" }).css({ width: "auto", height: "auto" }).on("click", function () {
        Create_Log_Object();
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
    $("#diffSelect").val(localStorage.getItem("BS_select"));
    DisplayStatistics(localStorage.getItem("BS_select"));
}

function DisplayStatistics(difficulty) {
    try {
        $("#tableDiv").html("");
        var log = JSON.parse(localStorage.getItem("battleLog"));
        var totalFights = Number(log[difficulty].Won) + Number(log[difficulty].Lost);
        var fightLootKeys = ["WonWithoutLoot", "Common", "Superior", "Rare", "Epic", "Legendary"];
        var fightAverageKeys = ['Gold', 'Experience', 'Loot'];
        var fightTotalPercentage = ["Won", "Lost"];
        var table = $(document.createElement("table")).css({ "border": "1px solid white", "width": "100%" });
        var logObj = log[difficulty];
        keys = Object.keys(logObj);
        len = keys.length;

        keys.sort();
        var newObj = {};
        for (i = 0; i < len; i++) {
            k = keys[i];
            newObj[k] = logObj[k];
        }
        logObj = newObj;

        if (difficulty === "Hard") {
            log.Hard.Loot += log.Elite.Loot;
        }
        for (var j = 0; j < fightTotalPercentage.length; j++) {
            var tr = CreateTableRow([
                fightTotalPercentage[j],
                logObj[fightTotalPercentage[j]] + " (" + (logObj[fightTotalPercentage[j]] / totalFights * 100).toFixed(2) + " %)"
            ]);
            tr.appendTo(table);
        }
        for (var k = 0; k < fightAverageKeys.length; k++) {
            var tr = CreateTableRow([
                fightAverageKeys[k],
                logObj[fightAverageKeys[k]] + " (" + (logObj[fightAverageKeys[k]] / totalFights).toFixed(2) + " on average)"
            ]);
            tr.appendTo(table);
        }
        for (var i = 0; i < fightLootKeys.length; i++) {
            if (logObj[fightLootKeys[i]] === 0 || logObj[fightLootKeys[i]] === undefined) { continue; } //Item Augments/ Dura Scrolls can have this.
            var tr = CreateTableRow([
                fightLootKeys[i],
                logObj[fightLootKeys[i]] + " (" + (logObj[fightLootKeys[i]] / logObj.Loot * 100).toFixed(2) + " %)"
            ]);
            tr.appendTo(table);
        }
        for (var keys in logObj) {
            if (keys === "Spell" || keys === "Equipment" || keys === "Food" || keys === "Enchant" || keys === "Item Augment" || keys === "Durability Scroll") {
                //These keys all have subitems.
                var totalCounter = 0;
                var subtable = $(document.createElement("table")).css({ "display": "none", "width": "100%" }).attr({ 'id': 'subtable-' + keys.replace(" ", "_") });
                var rarities = ['Common', 'Superior', 'Rare', 'Epic', 'Legendary'];
                var shortRarities = ['C', 'S', 'R', 'E', 'L'];
                var tr = CreateTableRow(["Type", "Total", shortRarities]);
                tr.appendTo(subtable);
                for (var subkeys in logObj[keys]) {
                    var counter = 0;
                    var tempArray = []; //Save the rarities in this temp array
                    for (var l = 0; l < rarities.length; l++) {
                        if (logObj[keys][subkeys][rarities[l]]) {
                            tempArray.push(logObj[keys][subkeys][rarities[l]]);
                            counter += Number(logObj[keys][subkeys][rarities[l]]);
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
                        totalCounter + " (" + (totalCounter / logObj.Loot * 100).toFixed(2) + " %)"
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
        /* TEMPORARY DISABLED!!!!
        $(document).tooltip({ //this will fail if bootstrap and jQuery UI are used at the same time.. :(
            items: "tr",
            content: function() {
                var element = $( this );
                if ( element.attr('id')){
                    if(element.attr('id').match(/^tr-subtable/)){
                        return "<table>" + $("#subtable-" + element.attr('id').match(/^tr-subtable-(\w+)/)[1]).html() + "</table>";
                    }
                }
                else{}
            }
        });
        */
    }
    catch (ex) {
        LiveLog("When trying to display the statistics something really bad happened...<br>" + ex.message);
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
    var log = JSON.parse(localStorage.getItem("battleLog"));
    var table = $(document.createElement("table")).attr({ id: 'disenchantingTable' });
    for (var i = 0; i < selects.length; i++) {
        if (log[selects[i]] === undefined) { log[selects[i]] = {}; } // For older version compatibility
        var row = $(document.createElement("tr")).attr({ 'class': 'disenchantingSelect' }).appendTo(table);
        var info = $(document.createElement("td")).html("Disenchant " + selects[i] + " up to x rarity");
        $(info).appendTo(row);
        var td = $(document.createElement("td"));

        for (var j = 0; j < rarities.length; j++) {
            if (log[selects[i]][rarities[j]] === undefined) { log[selects[i]][rarities[j]] = false; } // for older version compatibility
            var checkbox = $(document.createElement("input")).attr({ 'id': selects[i] + "-" + rarities[j], 'type': 'checkbox' }).on("change", function () {
                var log = JSON.parse(localStorage.getItem("battleLog"));
                var temp = $(this).attr('id').split("-");
                var type = temp[0];
                var rarity = temp[1];
                if ($(this).prop('checked')) {
                    if (debug > 0) {
                        LiveLog("D: Set type '" + type + "' with Rarity '" + rarity + "' to 1");
                    }
                    log[type][rarity] = true;
                }
                else {
                    if (debug > 0) {
                        LiveLog("D: Set type '" + type + "' with Rarity '" + rarity + "' to 0");
                    }
                    log[type][rarity] = false;
                }
                localStorage.setItem("battleLog", JSON.stringify(log));
            }).prop("checked", log[selects[i]][rarities[j]]).appendTo(td);
            var span = $(document.createElement("span")).html(rarities[j].match(/(^\w)/)[1]).appendTo(td);
        }
        $(td).appendTo(row);
    }
    if (debug > 0)
        LiveLog("D: Showing selects: " + log.ShowDeingSelects);
    var hideRow = $(document.createElement("td")).attr({ 'colspan': '2' }).css('text-align', 'center').html("Hide Drop-Downs").on("click", function () {
        var log = JSON.parse(localStorage.getItem("battleLog"));
        LiveLog("D: Showing options is currently: " + log.ShowDeingSelects);
        if ($(this).html().match(/hide/i)) {
            $(".disenchantingSelect").css("display", "none");
            $(this).html("Show Drop-Downs");
            log.ShowDeingSelects = false;
        }
        else {
            $(".disenchantingSelect").css("display", "table-row");
            $(this).html("Hide Drop-Downs");
            log.ShowDeingSelects = true;
        }
        LiveLog("D: Showing options is now: " + log.ShowDeingSelects);
        localStorage.setItem("battleLog", JSON.stringify(log));
    }).appendTo(table);
    $(table).insertAfter("#slots-remaining");
    $("td").css("vertical-align", "middle");
    if (log.ShowDeingSelects !== true) {
        log.ShowDeingSelects = false; //Backwards compatibility
        $(hideRow).html("Show Drop-Downs");
        $(".disenchantingSelect").css("display", "none");
    }
    localStorage.setItem("battleLog", JSON.stringify(log));
}

function SelectItemToDisenchant() {
    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    var possibleItems = $(".roundResult.areaName").find(".cLink");
    var itemToDE = undefined; // Set variable to undefined to reset the item this var contains
    for (var i = 0; i < possibleItems.length; i++) {
        var item = possibleItems[i];
        var type = item.innerText.match(/(battle|enchant|augment)/i)[1];
        if (type === "Battle") { type = "Spell"; } //Remapping
        var rarity = item.className.match(/card(\w+)/i)[1];
        if ($("#" + type + "-" + rarity).prop('checked')) { //New change
            console.log("Item can be DE'd..");
            console.log($(item));
            itemToDE = item;
            i = possibleItems.length;
        }
    }

    AddEnterShortcut($(itemToDE).parents().children().get(0));
    var span = $(document.createElement("span")).insertAfter($("#disenchantingTable"));
    if (itemToDE === undefined) {
        $(span).html("<br/>There is no item to be disenchanted");
    }
    else {
        $(span).html("<br>This is will be disenchanted: ");
        $(itemToDE).clone().appendTo(span);
    }
}