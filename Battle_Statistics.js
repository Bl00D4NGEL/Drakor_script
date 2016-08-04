// ==UserScript==
// @name         Battle-statistics
// @version      1.1
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com*
// ==/UserScript==

var showLog = false; //Set this to true to see nerdy-stuff in the console (Just some other information that can be helpful when trying to figure out bugs)
var thenText = "";
var totalCharExpGained = Number(RetrieveVariable("totalCharExpGained", 0, showLog));
var totalItemsGained = Number(RetrieveVariable("totalItemsGained", 0, showLog));
var totalItemsSold = Number(RetrieveVariable("totalItemsSold", 0, showLog));
var battlesWon = Number(RetrieveVariable("battlesWon", 0, showLog));
var battlesLost = Number(RetrieveVariable("battlesLost", 0, showLog));
var totalBattles =  Number(RetrieveVariable("totalBattles", 0, showLog));
var wonBattleWithoutLoot = Number(RetrieveVariable("wonBattleWithoutLoot", 0, showLog));
var totalBattleGold = Number(RetrieveVariable("totalBattleGold", 0, showLog));
var totalLootGold = Number(RetrieveVariable("totalLootGold", 0, showLog));
var expToLevel = Number(RetrieveVariable("expToLevel", 0, showLog));
$(document).ready(function(){
    console.log("Battle Statistics v1.1");
    /*
Timer that loops as long as the "Battle Arena"/ "Explore world" button has no event listener, if it does, it'll terminate the loop
*/
    var exloreWorldTimer = setInterval(function(){
        if(document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure").length > 0){
            //Add Listener to "Explore World"
            document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure")[0].addEventListener("click", function(){
                thenText = "";
            });
            //Add Listener to "Battle Arena"
            document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena")[0].addEventListener("click", function(){
                AddListenerToFindBattle();
                setTimeout(function(){SetupLog();},1000);
            });
            //Add Listener to "Inventory"
            document.getElementsByClassName("navButton gs_topmenu_item")[2].addEventListener("click", function(){
                setTimeout(function(){
                    AddListenerToSellAll();
                    AddSellListener();
                }, 500);
            });
            thenText = "";
            /*
            console.log(document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena")[0]);
            console.log(document.getElementsByClassName("navButton gs_topmenu_item gs_item_adventure")[0]);
            console.log(document.getElementsByClassName("navButton gs_topmenu_item")[2]);
            */
            console.log("Script started...");
            clearInterval(exloreWorldTimer);
        }
    }, 100, exloreWorldTimer);

    /*
Timer that loops as long as the current battle nodes of the location have no event listeners, if they do, the loop will terminate
*/
    var node_Timer = setInterval(function(){
        if(document.getElementsByClassName("locationDesc").length > 0 && document.getElementsByClassName("menuItem menuFighting").length >0){
            var nowText = document.getElementsByClassName("locationDesc")[0].innerText;
            if(nowText !== thenText){
                var combatNodes = document.getElementsByClassName("menuItem menuFighting");
                for(var i=0; i<combatNodes.length; i++){
                    console.log("Adding Listener to Combat node: ");
                    console.log(combatNodes[i]);
                    combatNodes[i].addEventListener("click", function(){
                        AddListenerToStartOfBattle();
                    });
                }
                thenText = nowText;
            }
        }
    }, 100);
});
/*
Basically sets up the statistic log in the Battle Arena
*/
function SetupLog(){
    var arenaDiv = document.getElementsByClassName("arenaContainer");
    var avgExp = Math.round(totalCharExpGained/totalBattles);
    var avgGold = Math.round(totalBattleGold/totalBattles);
    var fightWithoutLootPercent = (wonBattleWithoutLoot / totalBattles * 100).toFixed(1);
    var winLoss = (100*(battlesWon / (battlesWon + battlesLost))).toFixed(1);
    var battlesToNextLevel = 0;
    var resetButton = document.createElement("button");
    var resetButtonText = document.createTextNode("Reset Battle Statistics");
    resetButton.appendChild(resetButtonText);
    resetButton.id = "resetBattleArenaStatistics";
    resetButton.className = "bv_button bv_small_font";
    if(isNaN(avgExp)){avgExp = 0;} //This should only trigger if there was no battle.
    if(isNaN(avgGold)){avgExp = 0;} //This should only trigger if there was no battle.
    if(isNaN(winLoss)){winLoss = 0;} //This should only trigger if there was no battle.
    if(isNaN(fightWithoutLootPercent)){fightWithoutLootPercent = 0;} //This should only trigger if there was no battle.
    if(avgExp > 0){
        battlesToNextLevel = Math.round(Number(RetrieveVariable("expToLevel", 0, showLog))/avgExp);
    }
    var output = "<h4>Battle Statistics</h4><b>Total battles done: " + totalBattles + "</br>Win/Loss: " + battlesWon + "/" + battlesLost + "</br>Win ratio: " + winLoss +
        "%</br>Total combat exp gained: " + totalCharExpGained + "</br>Average combat exp gained: " + avgExp +
        "</br>Total items looted: " + totalItemsGained + "</br>Won battles without loot: " + wonBattleWithoutLoot + "(" + fightWithoutLootPercent + "%)" +
        "</br>Total gold through combat: " + totalBattleGold + "</br>Average gold through combat: " + avgGold + "</br>Total gold through selling loot: " + totalLootGold + "</br>Total items sold: " + totalItemsSold + "</br>Estimated battles to level-up: " + battlesToNextLevel +
        "</b></br></br>";
    arenaDiv[2].innerHTML = output;
    arenaDiv[2].appendChild(resetButton);
    $("#resetBattleArenaStatistics").on("click", function(){
        ResetBattleStatistics();
    });
}
function AddListenerToSellAll(){
    var myTimer = setInterval(function(){
        if(document.getElementById("sellAllBtn") !== null && jQuery._data( $("#sellAllBtn").get(0), "events" ) === undefined){
            console.log("Adding Listener to Sell All Button");
            console.log(document.getElementById("sellAllBtn"));
            $("#sellAllBtn").on("click", function(){
                var mySecondTimer = setInterval(function(){
                    if(document.getElementById("subSellAll") !== null && jQuery._data( $("#subSellAll").get(0), "events" ) === undefined){
                        console.log("Adding Listener to Sub Sell All Button");
                        console.log(document.getElementById("subSellAll"));
                        $("#subSellAll").on("click", function(){
                            var myThirdTimer = setInterval(function(){
                                if(document.getElementsByClassName("bv_error").length === 0 && document.getElementsByClassName("bv_success").length > 0){
                                    var centerText = document.getElementsByClassName("bv_center")[0].innerText;
                                    if(centerText.indexOf("You received a total of") === -1){
                                        centerText = document.getElementsByClassName("bv_center")[1].innerText;
                                    }
                                    var goldGained = centerText.slice(centerText.indexOf("You received a total of")+24, centerText.indexOf("g", centerText.indexOf("You received a total of"))).replace(",","");
                                    var itemsSold = document.getElementsByClassName("drIcon").length;
                                    if(!isNaN(goldGained) && !isNaN(itemsSold) && itemsSold > 0 && goldGained > 0){
                                        totalItemsSold = SetStorageVariable("totalItemsSold", (Number(totalItemsSold) + Number(itemsSold)), showLog);
                                        totalLootGold = SetStorageVariable("totalLootGold", (Number(totalLootGold) + Number(goldGained)), showLog);
                                        console.log("+" + itemsSold + " Item(s) sold and +" + goldGained + " gold gained");
                                        clearInterval(myThirdTimer);
                                    }
                                    else if(itemsSold < 1 || goldGained < 1){
                                        console.log("Gained gold and/or items sold is below 1\nGold: " + goldGained + "\tItems: "+ itemsSold);
                                    }
                                    else{
                                        console.log("Gained gold or items sold is not a number\nGold Text: " + goldGained + "\nItemsText: " + itemsSold);
                                    }
                                }
                                else if(document.getElementsByClassName("bv_error").length >0){
                                    console.log("Something went wrong when trying to sell all, most likely you didn't sell anything, though");
                                    clearInterval(myThirdTimer);
                                }
                            },10,myThirdTimer);
                        });
                        clearInterval(mySecondTimer);
                    }
                    else
                    {
                        console.log("Something went wrong, hold on a bit more");
                    }
                }, 100, mySecondTimer);
            });
            clearInterval(myTimer);
        }
        else if(document.getElementsByClassName("inventoryOptions").length > 0 && document.getElementById("sellAllBtn") === null){
            console.log("No Sell All button available :(");
            clearInterval(myTimer);
        }
    }, 100, myTimer);
}
function AddSellListener(){
    var myTimer = setInterval(function(){
        if(document.getElementsByClassName("inventoryOptions").length > 0){
            for(var i=0;i<document.getElementById("char_inventory").childNodes.length;i++){
                if(document.getElementById("char_inventory").childNodes[i].innerText !== "Empty"){
                    document.getElementById("char_inventory").childNodes[i].addEventListener("click", function(f){
                        var mySecondTimer = setInterval(function(){
                            if(document.getElementsByClassName("linkSell").length > 0){
                                var target = f.target.id;
                                var targetID = target.slice(4);
                                if(document.getElementById("sell-" + targetID) !== null){
                                    var targetText = document.getElementById("card" + targetID).innerHTML;
                                    var goldValue = targetText.slice(targetText.indexOf("Sell Value:") + 15, targetText.indexOf("Gold", targetText.indexOf("Sell Value:"))-1).replace(",","");
                                    if(goldValue.indexOf("/") !== -1){
                                        goldValue = goldValue.slice(0,goldValue.indexOf("/")-1);
                                    }
                                    //console.log("Adding Listener to: ");
                                    //console.log(document.getElementById("sell-" + targetID));
                                    document.getElementById("sell-" + targetID).addEventListener("click",function(){
                                        totalItemsSold = SetStorageVariable("totalItemsSold", (Number(totalItemsSold) + 1), showLog);
                                        totalLootGold = SetStorageVariable("totalLootGold", (Number(totalLootGold) + Number(goldValue)), showLog);
                                        console.log("+1 Item sold and +" + goldValue + " gold gained");
                                        var myTimeout = setTimeout(function(){AddSellListener();},500);
                                    }, goldValue);
                                    clearInterval(mySecondTimer);
                                }

                            }
                        }, 100, mySecondTimer, f);
                    });
                }
            }
            clearInterval(myTimer);
        }
    }, 100, myTimer);
}
/*
Resets the battle statistics and calls the SetupLog function at the end
*/
function ResetBattleStatistics(){
    totalBattleGold = Number(SetStorageVariable("totalBattleGold", 0, showLog));
    totalCharExpGained = Number(SetStorageVariable("totalCharExpGained",0, showLog));
    totalItemsGained = Number(SetStorageVariable("totalItemsGained",0, showLog));
    battlesWon = Number(SetStorageVariable("battlesWon",0, showLog));
    battlesLost = Number(SetStorageVariable("battlesLost",0, showLog));
    attemptedBattles = Number(SetStorageVariable("attemptedBattles",0, showLog));
    totalBattles = Number(SetStorageVariable("totalBattles",0, showLog));
    wonBattleWithoutLoot = Number(SetStorageVariable("wonBattleWithoutLoot",0, showLog));
    totalItemsSold = Number(SetStorageVariable("totalItemsSold",0, showLog));
    totalLootGold = Number(SetStorageVariable("totalLootGold",0, showLog));
    expToLevel = Number(SetStorageVariable("expToLevel",0, showLog));
    console.log("Everything has been re-set!");
    SetupLog();
}

//Start of Chain of event-listener-additions for each state of the Battle Arena (click on the Battle Arena -> finish the battle)
function AddListenerToFinishBattle(){
    var finishElements = document.getElementsByClassName("navButton bv_button bv_xsmall_font");
    if(finishElements.length > 0){
        console.log("Adding Listener to Finish battle..");
        for(var i=0; i<finishElements.length;i++){
            finishElements[i].addEventListener("click", function(){
                GetBattleResults();
            });
            console.log(finishElements[i]);
        }
    }
}

function AddListenerToFindBattle(){
    var battle_Arena_Find_Battle_Timer = setInterval(function(){
        if(document.getElementById("npc") !== null && jQuery._data( $("#npc").get(0), "events" ) === undefined){
            //console.log("Adding Listener to Find Battle");
            AddListenerToFinishBattle();
            $("#npc").on("click", function(){
                AddListenerToStartOfBattle();
            });
            $(document).off("keydown");
            $(document).on("keydown", function(event){
                if(event.keyCode === 32 || event.keyCode === 13){
                    document.getElementsByClassName("createBattle bv_button bv_small_font")[0].click();
                    $(document).off("keydown");
                }
            });
            //SetupLog();
            clearInterval(battle_Arena_Find_Battle_Timer);
        }
        else if(document.getElementsByClassName("arenaContainer").length > 0){
            //SetupLog();
        }
    }, 100, battle_Arena_Find_Battle_Timer);
}

function AddListenerToStartOfBattle(){
    //console.log("Adding Listener to Start of battle..");
    $(document).off("keydown");
    var battleStarted = false;
    var battleStartTimer = setInterval(function(){
        if(document.getElementsByClassName("navButton bv_button").length > 0 && document.getElementsByClassName("navButton bv_button")[0].innerText === "Start Battle!"){
            document.getElementsByClassName("navButton bv_button")[0].innerText = "Start Battle!(Tracking)";
            $(".navButton.bv_button").on("click", function(){
                GetBattleResults();
            });
            $(document).on("keydown", function(event){
                if(event.keyCode === 32 || event.keyCode === 13){
                    $(".navButton.bv_button").click();
                    $(document).off("keydown");
                }
            });
            clearInterval(battleStartTimer);
        }
    }, 100, battleStartTimer);
}

function GetBattleResults(){
    //console.log("Tracking Battle Results..");
    var battleDone = false;
    thenText = "";
    $(document).off("keydown");
    var battleResultTimer = setInterval(function(){
        //Win
        if(document.getElementsByClassName("victoryBox").length > 0 && !battleDone){
            console.log("You won!");
            var expText = document.getElementsByClassName("npcReward")[0].innerText;
            var expHTML = document.getElementsByClassName("npcReward")[0].innerHTML;
            var exp = 0;
            if(expText.indexOf("(+") !== -1){ //double exp
                expText = expHTML.slice(0,expHTML.indexOf('<span class="charName">'));
            }
            if(expText.indexOf("+") === -1){ //normal case
                exp = expText.slice(expText.indexOf("received") + 9, expText.indexOf("EXP")-1);
            }
            else{
                exp = expText.slice(expText.indexOf("received") + 9, expText.indexOf("total")-1);
            }
            var lootText = document.getElementsByClassName("victoryBox")[0].innerText;
            var amountItems = lootText.slice(lootText.indexOf("Loot bag") + 14,lootText.indexOf("Item"));
            if(lootText.indexOf("Loot bag") === -1){
                amountItems = 0;
                wonBattleWithoutLoot++;
            }
            if(isNaN(exp)){
                console.log("This is no number? " + exp);
                console.log("Exptext: " + expText);
                console.log("ExpHTML: " + document.getElementsByClassName("npcReward")[0].innerHTML);
                exp = 0;
            }
            totalCharExpGained += Number(exp);
            totalItemsGained += Number(amountItems);
            battlesWon++;
            if( document.getElementsByClassName("navButton bv_button2 bv_small_font").length > 0 && document.getElementsByClassName("navButton bv_button2 bv_small_font")[0].innerText !== "Back to Adventure"){
                $(".navButton.bv_button2.bv_small_font").on("click", function(){ //Battle Arena
                    AddListenerToFindBattle();
                    setTimeout(function(){SetupLog();},1000);
                });
                $(document).on("keydown", function(event){
                    if(event.keyCode === 32 || event.keyCode === 13){
                        $(".bv_button2").click();
                        $(document).off("keydown");
                    }
                });
            }
            else if(document.getElementsByClassName("menuItem menuFighting").length > 0){ //Node
                var goldText = document.getElementsByClassName("npcReward")[1].innerText;
                var droppedGold = goldText.slice(0, goldText.indexOf("gold")-1).replace(",","");
                if(isNaN(droppedGold)){
                    console.log("This is no number? " + droppedGold);
                    console.log("Golddrop string: " + goldText);
                    droppedGold = 0;
                }
                totalBattleGold += Number(droppedGold);
                SetStorageVariable("totalBattleGold", totalBattleGold, true);
                $(".menuItem.menuFighting").on("click", function(){
                    AddListenerToStartOfBattle();
                });
                $(document).on("keydown", function(event){
                    if(event.keyCode === 32 || event.keyCode === 13){
                        $(".menuItem.menuFighting").click();
                        $(document).off("keydown");
                    }
                });
            }
            battleDone = true;
            clearInterval(battleResultTimer);
        }
        //Lose
        if(document.getElementsByClassName("defeatBox").length > 0 && !battleDone){
            console.log("You lost! :(");
            if(document.getElementsByClassName("navButton bv_button bv_small_font").length > 0){
                document.getElementsByClassName("navButton bv_button bv_small_font")[0].addEventListener("click", function(){ //Battle Arena
                    AddListenerToFindBattle();
                    setTimeout(function(){SetupLog();},1000);
                });
                $(document).on("keydown", function(event){
                    if(event.keyCode === 32 || event.keyCode === 13){
                        $(".navButton.bv_button.bv_small_font").click();
                        $(document).off("keydown");
                    }
                });
            }
            else if(document.getElementsByClassName("menuItem menuFighting").length > 0){ //Node
                document.getElementsByClassName("menuItem menuFighting")[0].addEventListener("click", function(){
                    AddListenerToStartOfBattle();
                });
                $(document).on("keydown", function(event){
                    if(event.keyCode === 32 || event.keyCode === 13){
                        $(".menuItem.menuFighting").click();
                        $(document).off("keydown");
                    }
                });
            }
            battlesLost++;
            battleDone = true;
            clearInterval(battleResultTimer);
        }
        if(battleDone){
            var charExpText = document.getElementById("chalExp").innerText;
            var currExp = charExpText.slice(5, charExpText.indexOf("/")-1).replace(",","");
            if(isNaN(currExp)){
                console.log("Why is [currExp] no number?" + currExp);
                console.log("charExpText: " + charExpText);
                currExp = 0;
            }
            var needExp = charExpText.slice(charExpText.indexOf("/")+1, charExpText.indexOf("k")+1).replace(".","");
            needExp = needExp.replace("k", "00");
            if(isNaN(needExp)){
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
            console.log("Total battles: " + totalBattles + "\nWin / Lose: " + battlesWon + " / " + battlesLost);
        }
    }, 100, battleResultTimer);
}
//End of chain

/*
takes the variable name to look for as an argument, return the value of the variable, if there is one
boolShow: If the function is called and boolShow is true, the console will log the localstorage-loading, if not(false, omitted), it won't
*/
function GetStorageVariable(varName, boolShow){
    var output =  localStorage.getItem(varName);
    if(boolShow=== "true"){
        console.log("local storage -> " + varName + " - Result: " + output);
    }
    return output;
}

/*
Takes the variable name to save as and the value to save with the variable as arguments and writes them to the loca storage
boolShow: If the function is called and boolShow is true, the console will log the localstorage-writing, if not(false, omitted), it won't
*/
function SetStorageVariable(varName, varValue, boolShow){
    localStorage.setItem(varName, varValue);
    if(boolShow === "true"){
        console.log(varName  + " -> local storage - Value: " + varValue);
    }
    return varValue;
}

/*
varName = variable name to look for in localstorage
createValueIfNotExist = variable value to save in the loca storage
boolShow = Show the loading/ saving in the console.
*/
function RetrieveVariable(varName, createValueIfNotExist, boolShow){
    if(Boolean(GetStorageVariable(varName))){
        varName = GetStorageVariable(varName, boolShow);
    }
    else{
        varName = SetStorageVariable(varName, createValueIfNotExist, boolShow);
    }
    return varName;
}
