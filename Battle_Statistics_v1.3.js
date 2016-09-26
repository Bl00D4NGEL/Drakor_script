// ==UserScript==
// @name         Battle-statistics v1.3
// @version      1.3
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// ==/UserScript==

var showLog = false; //Set this to true to see nerdy-stuff in the console (Just some other information that can be helpful when trying to figure out bugs)
var thenText = "";
var debug = 0;
var totalCharExpGained = Number(RetrieveVariable("totalCharExpGained", 0, showLog));
var totalItemsGained = Number(RetrieveVariable("totalItemsGained", 0, showLog));
var totalItemsSold = Number(RetrieveVariable("totalItemsSold", 0, showLog));
var battlesWon = Number(RetrieveVariable("battlesWon", 0, showLog));
var battlesLost = Number(RetrieveVariable("battlesLost", 0, showLog));
var totalBattles = Number(RetrieveVariable("totalBattles", 0, showLog));
var wonBattleWithoutLoot = Number(RetrieveVariable("wonBattleWithoutLoot", 0, showLog));
var totalBattleGold = Number(RetrieveVariable("totalBattleGold", 0, showLog));
var totalLootGold = Number(RetrieveVariable("totalLootGold", 0, showLog));
var expToLevel = Number(RetrieveVariable("expToLevel", 0, showLog));
var tempLoot = Number(RetrieveVariable("tempLoot", "0", showLog));
$(document).ready(function () {
    console.log("Battle Statistics v1.3");
    /*
Timer that loops as long as the "Battle Arena"/ "Explore world" button has no event listener, if it does, it'll terminate the loop
*/
    var exloreWorldTimer = setInterval(function () {
        if (document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure").length > 0) {
            //Add Listener to "Explore World"
            document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure")[0].addEventListener("click", function () {
                thenText = "";
                $(document).off("keydown");
                AddShortcuts();
            });
            //Add Listener to "Battle Arena"
            document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena")[0].addEventListener("click", function () {
                AddListenerToFindBattle();
                $(document).off("keydown");
                AddShortcuts();
                var myTimer = setInterval(function () {
                    if (document.getElementsByClassName("arenaContainer").length > 0) {
                        SetupLog();
                        clearInterval(myTimer);
                    }
                }, 1000);
            });
            //Add Listener to "Inventory"
            document.getElementsByClassName("navButton gs_topmenu_item")[2].addEventListener("click", function () {
                var myTimer = setInterval(function () {
                    if (document.getElementById("sellAllBtn")) {
                        AddListenerToSellAll();
                        AddSellListener();
                        AddShortcuts();
                        clearInterval(myTimer);
                    }
                }, 500);
                $(document).off("keydown");
            });
            document.getElementsByClassName("navButton gs_topmenu_item")[4].addEventListener("click", function () {
                $(document).off("keydown");
                AddListenerToLootBag();
            });
            thenText = "";
            var tempLoot;
            if (document.getElementsByClassName("packs nopacks").length === 1) {
                tempLoot = Number(SetStorageVariable("tempLoot", "0"));
            }
            else {
                tempLoot = Number(RetrieveVariable("tempLoot", "0"));
            }
            if (document.getElementsByClassName("packs").length > 0) {
                document.getElementsByClassName("packs")[0].innerText += "(" + tempLoot + ")";
            }
            AddShortcuts();
            /*
            console.log(document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena")[0]);
            console.log(document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure")[0]);
            console.log(document.getElementsByClassName("navButton gs_topmenu_item")[2]);
            */
            clearInterval(exloreWorldTimer);
        }
    }, 100, exloreWorldTimer);

    /*
Timer that loops as long as the current battle nodes of the location have no event listeners, if they do, the loop will terminate
*/
    var node_Timer = setInterval(function () {
        if (document.getElementsByClassName("locationDesc").length > 0 && document.getElementsByClassName("menuItem menuFighting").length > 0) {
            var nowText = document.getElementsByClassName("locationDesc")[0].innerText;
            if (nowText !== thenText) {
                var combatNodes = document.getElementsByClassName("menuItem menuFighting");
                for (var i = 0; i < combatNodes.length; i++) {
                    if (debug === 1) {
                        console.log("Adding Listener to Combat node: ");
                        console.log(combatNodes[i]);
                    }
                    combatNodes[i].addEventListener("click", function () {
                        AddListenerToStartOfBattle();
                    });
                    $(document).on("keydown", function (event) {
                        if (event.keyCode === 32 || event.keyCode === 13) {
                            if (document.getElementsByClassName("menuItem menuFighting").length > 0) {
                                document.getElementsByClassName("menuItem menuFighting")[0].click();
                                $(document).off("keydown");
                            }
                        }
                    });
                    thenText = nowText;
                }
            }
        }
    }, 100);
});

function AddShortcuts() {

    //inventory -> alt i
    $(document).on("keydown", function (event) {
        //inventory alt i
        if (event.keyCode === 73 && event.altKey) {
            document.getElementsByClassName("navButton gs_topmenu_item")[2].click();
        }
            //Battle Arena alt b
        else if (event.keyCode === 66 && event.altKey) {
            document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena")[0].click();
        }
            //explore alt e OR alt w
        else if (event.keyCode === 69 && event.altKey || event.keyCode === 87 && event.altKey) {
            document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure")[0].click();
        }
            //loot alt l
        else if (event.keyCode === 76 && event.altKey || event.keyCode === 87 && event.altKey) {
            document.getElementsByClassName("navButton gs_topmenu_item")[4].click();
        }
    });
}
function AddListenerToLootBag() {
    if (debug === 1) {
        console.log("Adding Shortcut to the loot bag thingie");
    }
    var myTimer = setInterval(function () {
        if (document.getElementById("load-openloot-open-all") !== null) {
            if (debug === 1) {
                console.log("Adding Shortcut to the Open All Loot Bags button");
            }
            $(document).on("keydown", function (event) {
                if (event.keyCode === 13 || event.keyCode === 32) {
                    $("#load-openloot-open-all").click();
                    AddShortcuts();
                }
            });
            clearInterval(myTimer);
        }
    }, 100);
}
/*
Basically sets up the statistic log in the Battle Arena
*/
function SetupLog() {
    var arenaDiv = document.getElementsByClassName("arenaContainer");
    var avgExp = Math.round(totalCharExpGained / totalBattles);
    var avgGold = Math.round(totalBattleGold / totalBattles);
    var fightWithoutLootPercent = (wonBattleWithoutLoot / totalBattles * 100).toFixed(1);
    var winLoss = (100 * (battlesWon / (battlesWon + battlesLost))).toFixed(1);
    var battlesToNextLevel = 0;
    var resetButton = document.createElement("button");
    var resetButtonText = document.createTextNode("Reset Battle Statistics");
    resetButton.appendChild(resetButtonText);
    resetButton.id = "resetBattleArenaStatistics";
    resetButton.className = "bv_button bv_small_font";
    if (isNaN(avgExp)) { avgExp = 0; } //This should only trigger if there was no battle.
    if (isNaN(avgGold)) { avgExp = 0; } //This should only trigger if there was no battle.
    if (isNaN(winLoss)) { winLoss = 0; } //This should only trigger if there was no battle.
    if (isNaN(fightWithoutLootPercent)) { fightWithoutLootPercent = 0; } //This should only trigger if there was no battle.
    if (avgExp > 0) {
        battlesToNextLevel = Math.round(Number(RetrieveVariable("expToLevel", 0, showLog)) / avgExp);
    }
    var output = "<h4>Battle Statistics</h4><b>Total battles done: " + totalBattles + "</br>Win/Loss: " + battlesWon + "/" + battlesLost + "</br>Win ratio: " + winLoss +
        "%</br>Total combat exp gained: " + totalCharExpGained + "</br>Average combat exp gained: " + avgExp +
        "</br>Total items looted: " + totalItemsGained + "</br>Won battles without loot: " + wonBattleWithoutLoot + "(" + fightWithoutLootPercent + "%)" +
        "</br>Total gold through combat: " + totalBattleGold + "</br>Average gold through combat: " + avgGold + "</br>Total gold through selling loot: " + totalLootGold + "</br>Total items sold: " + totalItemsSold + "</br>Estimated battles to level-up: " + battlesToNextLevel +
        "</b></br></br>";
    arenaDiv[2].innerHTML = output;
    arenaDiv[2].appendChild(resetButton);
    $("#resetBattleArenaStatistics").on("click", function () {
        ResetBattleStatistics();
    });
}
function AddListenerToSellAll() {
    var myTimer = setInterval(function () {
        if (document.getElementById("sellAllBtn") !== null && jQuery._data($("#sellAllBtn").get(0), "events") === undefined) {
            if (debug === 1) {
                console.log("Adding Listener to Sell All Button");
                console.log(document.getElementById("sellAllBtn"));
            }
            $(document).off("keydown");
            AddShortcuts();
            document.getElementById("sellAllBtn").innerText += "(T)";
            $("#sellAllBtn").on("click", function () {
                var mySecondTimer = setInterval(function () {
                    if (document.getElementById("subSellAll") !== null && jQuery._data($("#subSellAll").get(0), "events") === undefined) {
                        if (debug === 1) {
                            console.log("Adding Listener to Sub Sell All Button");
                            console.log(document.getElementById("subSellAll"));
                        }
                        document.getElementById("subSellAll").innerText += "(T)";
                        $("#subSellAll").on("click", function () {
                            var myThirdTimer = setInterval(function () {
                                if (document.getElementsByClassName("bv_error").length === 0 && document.getElementsByClassName("bv_success").length > 0) {
                                    var centerText = document.getElementsByClassName("bv_center")[0].innerText;
                                    if (centerText.indexOf("You received a total of") === -1) {
                                        centerText = document.getElementsByClassName("bv_center")[1].innerText;
                                    }
                                    var goldGained = centerText.slice(centerText.indexOf("You received a total of") + 24, centerText.indexOf("g", centerText.indexOf("You received a total of"))).replace(",", "");
                                    var itemsSold = document.getElementsByClassName("drIcon").length;
                                    if (!isNaN(goldGained) && !isNaN(itemsSold) && itemsSold > 0 && goldGained > 0) {
                                        totalItemsSold = SetStorageVariable("totalItemsSold", (Number(totalItemsSold) + Number(itemsSold)), showLog);
                                        totalLootGold = SetStorageVariable("totalLootGold", (Number(totalLootGold) + Number(goldGained)), showLog);
                                        if (debug === 1) {
                                            console.log("+" + itemsSold + " Item(s) sold and +" + goldGained + " gold gained");
                                        }
                                        clearInterval(myThirdTimer);
                                    }
                                    else if (itemsSold < 1 || goldGained < 1) {
                                        if (debug === 1) {
                                            console.log("Gained gold and/or items sold is below 1\nGold: " + goldGained + "\tItems: " + itemsSold);
                                        }
                                    }
                                    else {
                                        if (debug === 1) {
                                            console.log("Gained gold or items sold is not a number\nGold Text: " + goldGained + "\nItemsText: " + itemsSold);
                                        }
                                    }
                                }
                                else if (document.getElementsByClassName("bv_error").length > 0) {
                                    if (debug === 1) {
                                        console.log("Something went wrong when trying to sell all, most likely you didn't sell anything, though");
                                    }
                                    clearInterval(myThirdTimer);
                                }
                            }, 10, myThirdTimer);
                        });
                        $(document).on("keydown", function (event) {
                            if (document.getElementById("quality_max") !== null) {
                                var key;
                                if (event.keyCode > 48 && event.keyCode < 54) { //1-9 on normal keyboard
                                    key = Number(event.keyCode) - 49;
                                }
                                else if (event.keyCode > 96 && event.keyCode < 102) { //Numpad 1-9
                                    key = Number(event.keyCode) - 97;
                                }
                                else if (event.altKey && event.keyCode === 83) {
                                    $("#subSellAll").click();
                                }
                                if (key >= 0 && key <= 5) {
                                    document.getElementById("quality_max").options[key].selected = true;
                                }
                            }
                        });
                        clearInterval(mySecondTimer);
                    }
                    else {
                        if (debug === 1) {
                            console.log("Something went wrong, hold on a bit more");
                        }
                    }
                }, 100, mySecondTimer);
            });
            $(document).on("keydown", function (event) {
                if (event.altKey && event.keyCode === 83) {
                    $(document).off("keydown");
                    AddShortcuts();
                    $("#sellAllBtn").click();
                }
            });
            clearInterval(myTimer);
        }
        else if (document.getElementsByClassName("inventoryOptions").length > 0 && document.getElementById("sellAllBtn") === null) {
            if (debug === 1) {
                console.log("No Sell All button available :(");
            }
            clearInterval(myTimer);
        }
    }, 100, myTimer);
}
function AddSellListener() {
    var myTimer = setInterval(function () {
        if (document.getElementById("char_inventory")) {
            if (debug === 1) {
                console.log("Length of child nodes is " + document.getElementById("char_inventory").childNodes.length);
            }
            for (var i = 0; i < document.getElementById("char_inventory").childNodes.length; i++) {
                if (document.getElementById("char_inventory").childNodes[i].innerText !== "Empty") {
                    document.getElementById("char_inventory").childNodes[i].addEventListener("click", function (f) {
                        if (debug === 1) {
                            console.log("Clicked an item in the inventory with an event listener");
                        }
                        var target = f.target.id;
                        var targetID = target.slice(4);
                        var mySecondTimer = setInterval(function () {
                            if (document.getElementById("card" + f.target.id.slice(4)) && document.getElementById("card" + targetID).childNodes.length > 1) {
                                if (document.getElementById("card" + targetID).childNodes[1].childNodes[0].getElementsByClassName("linkDisenchant").length > 0) {
                                    if (debug === 1) {
                                        console.log("Found something to Disenchant");
                                    }
                                    document.getElementById("card" + targetID).childNodes[1].childNodes[0].getElementsByClassName("linkDisenchant")[0].addEventListener("click", function () {
                                        setTimeout(function () {
                                            DisenchantEverything();
                                        }, 1000);
                                    });
                                }
                                if (document.getElementById("sell-" + targetID)) {
                                    var targetText = document.getElementById("card" + targetID).innerHTML;
                                    var type = document.getElementById("card" + targetID).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardImage")[0].getElementsByClassName("cardType")[0].innerHTML;
                                    if (type.indexOf("Enchant") !== -1 || type.indexOf("Augment") !== -1) {
                                        console.log(DoStuff(targetID));
                                    }
                                    var goldValue = targetText.slice(targetText.indexOf("Sell Value:") + 15, targetText.indexOf("Gold", targetText.indexOf("Sell Value:")) - 1).replace(",", "");
                                    if (goldValue.indexOf("/") !== -1) {
                                        goldValue = goldValue.slice(0, goldValue.indexOf("/") - 1);
                                    }
                                    if (debug === 1) {
                                        console.log("Adding Listener to: ");
                                        console.log(document.getElementById("sell-" + targetID));
                                    }
                                    document.getElementById("sell-" + targetID).addEventListener("click", function () {
                                        AddListenerToSellAll();
                                        totalItemsSold = SetStorageVariable("totalItemsSold", (Number(totalItemsSold) + 1), showLog);
                                        totalLootGold = SetStorageVariable("totalLootGold", (Number(totalLootGold) + Number(goldValue)), showLog);
                                        if (debug === 1) {
                                            console.log("+1 Item sold and +" + goldValue + " gold gained");
                                        }
                                        var myTimeout = setTimeout(function () { AddSellListener(); }, 500);
                                    }, goldValue);
                                    document.getElementById("sell-" + targetID).innerText += "(T)";
                                    clearInterval(mySecondTimer);
                                }

                            }
                        }, 100, mySecondTimer, f);
                    });
                }
            }
            clearInterval(myTimer);
        }
        else {
            if (debug === 1) {
                console.log("The 'char_inventory' is not existing aka null");
            }
        }
    }, 100, myTimer);
}
/*
Resets the battle statistics and calls the SetupLog function at the end
*/
function ResetBattleStatistics() {
    totalBattleGold = Number(SetStorageVariable("totalBattleGold", 0, showLog));
    totalCharExpGained = Number(SetStorageVariable("totalCharExpGained", 0, showLog));
    totalItemsGained = Number(SetStorageVariable("totalItemsGained", 0, showLog));
    battlesWon = Number(SetStorageVariable("battlesWon", 0, showLog));
    battlesLost = Number(SetStorageVariable("battlesLost", 0, showLog));
    attemptedBattles = Number(SetStorageVariable("attemptedBattles", 0, showLog));
    totalBattles = Number(SetStorageVariable("totalBattles", 0, showLog));
    wonBattleWithoutLoot = Number(SetStorageVariable("wonBattleWithoutLoot", 0, showLog));
    totalItemsSold = Number(SetStorageVariable("totalItemsSold", 0, showLog));
    totalLootGold = Number(SetStorageVariable("totalLootGold", 0, showLog));
    expToLevel = Number(SetStorageVariable("expToLevel", 0, showLog));
    tempLoot = Number(SetStorageVariable("tempLoot", "0", showLog));
    console.log("Everything has been re-set!");
    SetupLog();
}

//Start of Chain of event-listener-additions for each state of the Battle Arena (click on the Battle Arena -> finish the battle)
function AddListenerToFinishBattle() {
    var finishElements = document.getElementsByClassName("navButton bv_button bv_xsmall_font");
    if (finishElements.length > 0) {
        if (debug === 1) {
            console.log("Adding Listener to Finish battle..");
        }
        for (var i = 0; i < finishElements.length; i++) {
            finishElements[i].addEventListener("click", function () {
                GetBattleResults();
            });
            console.log(finishElements[i]);
        }
    }
}

function AddListenerToFindBattle() {
    var battle_Arena_Find_Battle_Timer = setInterval(function () {
        if (document.getElementById("npc") !== null && jQuery._data($("#npc").get(0), "events") === undefined) {
            //console.log("Adding Listener to Find Battle");
            AddListenerToFinishBattle();
            $("#npc").on("click", function () {
                AddListenerToStartOfBattle();
            });
            $(document).off("keydown");
            AddShortcuts();
            $(document).on("keydown", function (event) {
                if (event.keyCode === 32 || event.keyCode === 13) {
                    document.getElementsByClassName("createBattle bv_button bv_small_font")[0].click();
                    $(document).off("keydown");
                    AddShortcuts();
                }
            });
            //SetupLog();
            clearInterval(battle_Arena_Find_Battle_Timer);
        }
        else if (document.getElementsByClassName("arenaContainer").length > 0) {
            //SetupLog();
        }
    }, 100, battle_Arena_Find_Battle_Timer);
}

function AddListenerToStartOfBattle() {
    //console.log("Adding Listener to Start of battle..");
    $(document).off("keydown");
    AddShortcuts();
    var battleStarted = false;
    var battleStartTimer = setInterval(function () {
        if (document.getElementsByClassName("navButton bv_button").length > 0 && document.getElementsByClassName("navButton bv_button")[0].innerText === "Start Battle!") {
            document.getElementsByClassName("navButton bv_button")[0].innerText = "Start Battle!(Tracking)";
            $(".navButton.bv_button").on("click", function () {
                GetBattleResults();
            });
            $(document).on("keydown", function (event) {
                if (event.keyCode === 32 || event.keyCode === 13) {
                    $(".navButton.bv_button").click();
                    $(document).off("keydown");
                    AddShortcuts();
                }
            });
            clearInterval(battleStartTimer);
        }
    }, 100, battleStartTimer);
}

function GetBattleResults() {
    //console.log("Tracking Battle Results..");
    var battleDone = false;
    var tempLoot;
    if(!lootbagText.match(/\d+/)){ //Lootbag is empty
                tempLoot = SetStorageVariable("tempLoot", 0);
                tempLoot = 0; //Better safe than sorry
    }
    if(localStorage.getItem("tempLoot")){tempLoot = localStorage.getItem("tempLoot");}
    else {tempLoot = 0; localStorage.setItem("tempLoot", 0);}
    thenText = "";
    $(document).off("keydown");
    var battleResultTimer = setInterval(function () {
        //Win
        if (document.getElementsByClassName("victoryBox").length > 0 && !battleDone) {
            if (debug === 1) {
                console.log("You won!");
            }
            var expText = document.getElementsByClassName("npcReward")[0].innerText;
            var expHTML = document.getElementsByClassName("npcReward")[0].innerHTML;
            var exp = 0;
            if (expText.indexOf("(+") !== -1) { //double exp
                expText = expHTML.slice(0, expHTML.indexOf('<span class="charName">'));
            }
            if (expText.indexOf("+") === -1) { //normal case
                exp = expText.slice(expText.indexOf("received") + 9, expText.indexOf("EXP") - 1);
            }
            else {
                exp = expText.slice(expText.indexOf("received") + 9, expText.indexOf("total") - 1);
            }
            var lootText = document.getElementsByClassName("victoryBox")[0].innerText;
            var amountItems = Number(lootText.slice(lootText.indexOf("Loot bag") + 14, lootText.indexOf("Item")));
            var lootbagText = $("#open-lootbag").html();

            if (lootText.indexOf("Loot bag") === -1) {
                amountItems = 0;
                wonBattleWithoutLoot++;
            }
            else {
                tempLoot = SetStorageVariable("tempLoot", (tempLoot + amountItems));
                document.getElementsByClassName("packs")[0].innerText += "(" + tempLoot + ")";
            }
            if (isNaN(exp)) {
                console.log("This is no number? " + exp);
                console.log("Exptext: " + expText);
                console.log("ExpHTML: " + document.getElementsByClassName("npcReward")[0].innerHTML);
                exp = 0;
            }
            totalCharExpGained += Number(exp);
            totalItemsGained += Number(amountItems);
            battlesWon++;
            if (document.getElementsByClassName("navButton bv_button2 bv_small_font").length > 0 && document.getElementsByClassName("navButton bv_button2 bv_small_font")[0].innerText !== "Back to Adventure") {
                $(".navButton.bv_button2.bv_small_font").on("click", function () { //Battle Arena
                    AddListenerToFindBattle();
                    setTimeout(function () { SetupLog(); }, 1000);
                });
                $(document).on("keydown", function (event) {
                    if (event.keyCode === 32 || event.keyCode === 13) {
                        $(".bv_button2").click();
                        $(document).off("keydown");
                        AddShortcuts();
                    }
                });
            }
            else if (document.getElementsByClassName("menuItem menuFighting").length > 0) { //Node
                var goldText = document.getElementsByClassName("npcReward")[1].innerText;
                var droppedGold = goldText.slice(0, goldText.indexOf("gold") - 1).replace(",", "");
                if (isNaN(droppedGold)) {
                    console.log("This is no number? " + droppedGold);
                    console.log("Golddrop string: " + goldText);
                    droppedGold = 0;
                }
                totalBattleGold += Number(droppedGold);
                SetStorageVariable("totalBattleGold", totalBattleGold, true);
                $(".menuItem.menuFighting").on("click", function () {
                    AddListenerToStartOfBattle();
                });
                $(document).on("keydown", function (event) {
                    if (event.keyCode === 32 || event.keyCode === 13) {
                        $(".menuItem.menuFighting").click();
                        $(document).off("keydown");
                        AddShortcuts();
                    }
                });
            }
            battleDone = true;
            clearInterval(battleResultTimer);
        }
        //Lose
        if (document.getElementsByClassName("defeatBox").length > 0 && !battleDone) {
            if (debug === 1) {
                console.log("You lost! :(");
            }
            if (document.getElementsByClassName("navButton bv_button bv_small_font").length > 0) {
                document.getElementsByClassName("navButton bv_button bv_small_font")[0].addEventListener("click", function () { //Battle Arena
                    AddListenerToFindBattle();
                    setTimeout(function () { SetupLog(); }, 1000);
                });
                $(document).on("keydown", function (event) {
                    if (event.keyCode === 32 || event.keyCode === 13) {
                        $(".navButton.bv_button.bv_small_font").click();
                        $(document).off("keydown");
                    }
                });
            }
            else if (document.getElementsByClassName("menuItem menuFighting").length > 0) { //Node
                document.getElementsByClassName("menuItem menuFighting")[0].addEventListener("click", function () {
                    AddListenerToStartOfBattle();
                });
                $(document).on("keydown", function (event) {
                    if (event.keyCode === 32 || event.keyCode === 13) {
                        $(".menuItem.menuFighting").click();
                        $(document).off("keydown");
                    }
                });
            }
            battlesLost++;
            battleDone = true;
            clearInterval(battleResultTimer);
        }
        if (battleDone) {
            var charExpText = document.getElementById("chalExp").innerText;
            var currExp = charExpText.slice(5, charExpText.indexOf("/") - 1).replace(",", "");
            if (isNaN(currExp)) {
                console.log("Why is [currExp] no number?" + currExp);
                console.log("charExpText: " + charExpText);
                currExp = 0;
            }
            var needExp = charExpText.slice(charExpText.indexOf("/") + 1, charExpText.indexOf("k") + 1).replace(".", "");
            needExp = needExp.replace("k", "00");
            if (isNaN(needExp)) {
                console.log("Why is [needExp] no number?" + needExp);
                console.log("charExpText: " + charExpText);
                needExp = 1;
            }
            var expToLevel = needExp - currExp;
            totalBattles = battlesWon + battlesLost;
            SetStorageVariable("totalCharExpGained", totalCharExpGained, showLog);
            SetStorageVariable("totalItemsGained", totalItemsGained, showLog);
            SetStorageVariable("wonBattleWithoutLoot", wonBattleWithoutLoot, showLog);
            SetStorageVariable("battlesWon", battlesWon, showLog);
            SetStorageVariable("battlesLost", battlesLost, showLog);
            SetStorageVariable("totalBattles", totalBattles, showLog);
            SetStorageVariable("expToLevel", expToLevel, showLog);
            if (debug === 1) {
                console.log("Total battles: " + totalBattles + "\nWin / Lose: " + battlesWon + " / " + battlesLost);
            }
        }
    }, 100, battleResultTimer);
}
//End of chain

/*
takes the variable name to look for as an argument, return the value of the variable, if there is one
boolShow: If the function is called and boolShow is true, the console will log the localstorage-loading, if not(false, omitted), it won't
*/
function GetStorageVariable(varName, boolShow) {
    var output = localStorage.getItem(varName);
    if (boolShow === "true") {
        console.log("local storage -> " + varName + " - Result: " + output);
    }
    return output;
}

/*
Takes the variable name to save as and the value to save with the variable as arguments and writes them to the loca storage
boolShow: If the function is called and boolShow is true, the console will log the localstorage-writing, if not(false, omitted), it won't
*/
function SetStorageVariable(varName, varValue, boolShow) {
    localStorage.setItem(varName, varValue);
    if (boolShow === "true") {
        console.log(varName + " -> local storage - Value: " + varValue);
    }
    return varValue;
}

/*
varName = variable name to look for in localstorage
createValueIfNotExist = variable value to save in the loca storage
boolShow = Show the loading/ saving in the console.
*/
function RetrieveVariable(varName, createValueIfNotExist, boolShow) {
    if (Boolean(GetStorageVariable(varName))) {
        varName = GetStorageVariable(varName, boolShow);
    }
    else {
        varName = SetStorageVariable(varName, createValueIfNotExist, boolShow);
    }
    return varName;
}
function DoStuff(augmentId) {
    var statNameArray = ["Hit Points", "Defense", "Heal", "Combat", "Magic", "Regen"];
    var statArray = [0, 0, 0, 0, 0, 0];
    var multi = [1, 2.5, 5, 7.5, 7.5, 12.5];
    // HP, Def, Heal, Combat, Magic, Regen
    var augmentText = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cardDetail")[0].innerText;
    var augmentRarity = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cardQuality")[0].innerText;
    var augmentDrop = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cDetailType")[0].innerText;
    var augmentType = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardImage")[0].getElementsByClassName("cardType")[0].innerText;
    var augmentSellValue = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardValue")[0].innerText;
    if (augmentType.indexOf(":") !== -1) {
        augmentType = augmentType.slice(augmentType.indexOf(":") + 1) + ";";
    }
    else {
        augmentType = "";
    }
    if (augmentDrop.indexOf("World") !== -1) {
        augmentDrop = "Yes;World";
    }
    else if (augmentDrop.indexOf("Arena") !== -1) {
        augmentDrop = "Yes;Arena";
    }
    else {
        augmentDrop = "No;-";
    }
    var augmentLevel = document.getElementById("card" + augmentId).getElementsByClassName("cardContainer")[0].getElementsByClassName("cardInfo")[0].getElementsByClassName("cardLevel")[0].innerText;
    augmentLevel = augmentLevel.slice(augmentLevel.indexOf(":") + 2);
    var reg = /\s*(\d*,*\d+)\s/;
    var valueData = augmentSellValue.match(reg);
    var value = valueData[1].replace(",", "");
    var augmentStats = augmentText.split("+");
    var augmentValue = 0;
    for (var k = 0; k < augmentStats.length - 1; k++) {
        var stat = augmentStats[k + 1].slice(augmentStats[k + 1].indexOf(" ") + 1, -2);
        var statValue = augmentStats[k + 1].slice(0, augmentStats[k + 1].indexOf(" "));
        var statIndex = statNameArray.indexOf(stat);
        statArray[statIndex] = statValue;
        augmentValue += statArray[statIndex] * multi[statIndex];
    }
    while (augmentValue % 2.5 !== 0) {
        augmentValue += 0.5;
    }
    var myOutput = augmentLevel + ";" + augmentRarity + ";" + statArray.join(";") + ";" + augmentType + augmentDrop + ";Battle Statistics Script;" + augmentValue + ";" + value + "\n";
    return myOutput;
}

function DisenchantEverything() {
    var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    if (localStorage.getItem("selectEnchant") === null || localStorage.getItem("selectAugment") === null || localStorage.getItem("selectSpell") === null) {
        localStorage.setItem("selectEnchant", "Common");
        localStorage.setItem("selectAugment", "Common");
        localStorage.setItem("selectSpell", "Common");
        console.log("Set Localstorage variables");
    }
    var results = document.getElementsByClassName("roundResult");
    if (document.getElementsByClassName("skillBox")[0].innerHTML.indexOf("Augment") === -1) {
        var fragment = document.createElement("fragment");
        var selectEnchant = document.createElement("select");
        var selectAugment = document.createElement("select");
        var selectSpell = document.createElement("select");
        var spanEnchant = document.createElement("span");
        var spanAugment = document.createElement("span");
        var spanSpell = document.createElement("span");
        var spanBreak = document.createElement("span");
        var spanInfo = document.createElement("span");
        spanInfo.innerHTML = "<br />You are an awesome person";
        spanBreak.innerHTML = "<br />";
        var spanBreak2 = document.createElement("span");
        spanBreak2.innerHTML = "<br />";
        spanEnchant.innerHTML = "Disenchant Enchant up to x rarity:";
        spanAugment.innerHTML = "Disenchant Augments up to x rarity:";
        spanSpell.innerHTML = "Disenchant Spell up to x rarity:";
        selectEnchant.style.fontSize = "10px";
        selectAugment.style.fontSize = "10px";
        selectSpell.style.fontSize = "10px";
        selectSpell.id = "selectSpell";
        selectAugment.id = "selectAugment";
        selectEnchant.id = "selectEnchant";
        for (var j = 0; j < rarities.length; j++) {
            var newOption = document.createElement("option");
            newOption.text = rarities[j];
            newOption.value = rarities[j];
            selectSpell.add(newOption);
            var newOption2 = document.createElement("option");
            newOption2.text = rarities[j];
            newOption2.value = rarities[j];
            selectAugment.add(newOption2);
            var newOption3 = document.createElement("option");
            newOption3.text = rarities[j];
            newOption3.value = rarities[j];
            selectEnchant.add(newOption3);
        }
        fragment.appendChild(spanEnchant);
        fragment.appendChild(selectEnchant);
        fragment.appendChild(spanBreak);
        fragment.appendChild(spanAugment);
        fragment.appendChild(selectAugment);
        fragment.appendChild(spanBreak2);
        fragment.appendChild(spanSpell);
        fragment.appendChild(selectSpell);
        fragment.appendChild(spanInfo);
        document.getElementsByClassName("skillBox")[0].appendChild(fragment);
        if (localStorage.getItem("selectEnchant") !== null || localStorage.getItem("selectAugment") !== null || localStorage.getItem("selectSpell") !== null) {
            document.getElementById("selectEnchant").options[rarities.indexOf(localStorage.getItem("selectEnchant"))].selected = true;
            document.getElementById("selectAugment").options[rarities.indexOf(localStorage.getItem("selectAugment"))].selected = true;
            document.getElementById("selectSpell").options[rarities.indexOf(localStorage.getItem("selectSpell"))].selected = true;
        }
        else {
            localStorage.setItem("selectEnchant", "Common");
            localStorage.setItem("selectAugment", "Common");
            localStorage.setItem("selectSpell", "Common");
            console.log("Set Localstorage variables even though they should already be set!");
        }
        selectSpell.addEventListener("change", function () {
            SetStorageVariable("selectSpell", selectSpell.value);
        });
        selectAugment.addEventListener("change", function () {
            SetStorageVariable("selectAugment", selectAugment.value);
        });
        selectEnchant.addEventListener("change", function () {
            SetStorageVariable("selectEnchant", selectEnchant.value);
        });
    }
    var myTimer = setInterval(function () {
        if (document.getElementsByClassName("nLink").length > 1) {
            if (debug === 2) {
                alert("DE Item");
            }
            var lastNode;
            for (var i = 0; i < results.length; i++) {
                if (results[i].childNodes.length === 3 && results[i].childNodes[2].id !== undefined) {
                    var type = results[i].childNodes[2].childNodes[1].innerText;
                    if (type.indexOf("Enchant") !== -1) {
                        type = "Enchant";
                    }
                    else if (type.indexOf("Augment") !== -1) {
                        type = "Augment";
                    }
                    else if (type.indexOf("Battle") !== -1) {
                        type = "Spell";
                    }
                    var rarity = results[i].childNodes[2].className.slice(4, results[i].childNodes[2].className.indexOf(" "));
                    if (rarities.indexOf(rarity) <= rarities.indexOf(localStorage.getItem(("select" + type)))) {
                        lastNode = results[i].childNodes[0];
                        if (debug === 1) {
                            console.log(lastNode);
                        }
                        if (debug === 2) {
                            alert("Found an item to DE");
                        }
                        spanInfo.innerHTML = "<br />Item to be disenchanted: <br />" + results[i].innerHTML.slice(results[i].innerHTML.indexOf("</div>"));
                        break;
                    }
                    else {
                        lastNode = "";
                    }
                }
            }
            if (lastNode !== "") {
                if (debug === 2) {
                    alert("Added Listener to the DE Item");
                    console.log(lastNode);
                }
                $(document).on("keydown", function (event) {
                    if (debug === 1) {
                        console.log("Pressed a key");
                    }
                    if (event.keyCode === 13 || event.keyCode === 32) {
                        if (debug === 1) {
                            console.log("Pressed Enter or Space");
                        }
                        $(document).off("keydown");
                        lastNode.click();
                        setTimeout(function () {
                            DisenchantEverything();
                        }, 1000);
                    }
                });
            }
            else {
                spanInfo.innerHTML = "There is not item to be disenchanted";
            }
            clearInterval(myTimer);
        }
    }, 1000);
}
