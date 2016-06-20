// ==UserScript==
// @name         Battle-statistics
// @version      1.0
// @description  Tracks statistics of battles (Arena and Node)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://www.drakor.com/
// ==/UserScript==

var showLog = false; //Set this to true to see nerdy-stuff in the console (Just some other information that can be helpful when trying to figure out bugs)
var thenText = "";
var totalCharExpGained = Number(RetrieveVariable("totalCharExpGained", 0, showLog));
var totalItemsGained = Number(RetrieveVariable("totalItemsGained", 0, showLog));
var battlesWon = Number(RetrieveVariable("battlesWon", 0, showLog));
var battlesLost = Number(RetrieveVariable("battlesLost", 0, showLog));
var totalBattles =  Number(RetrieveVariable("totalBattles", 0, showLog));
var wonBattleWithoutLoot = Number(RetrieveVariable("wonBattleWithoutLoot", 0, showLog));

/*
Timer that loops as long as the "Battle Arena" button has no event listener, if it does, it'll terminate the loop
*/
var battle_Arena_Timer = setInterval(function(){
    if(document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena").length > 0){
        document.getElementsByClassName("navButton gs_topmenu_item gs_item_arena")[0].addEventListener("click", function(){
            AddListenerToFindBattle();
        });
        clearInterval(battle_Arena_Timer);
    }
}, 100, battle_Arena_Timer);

/*
Timer that loops as long as the current battle nodes of the location have no event listeners, if they do, the loop will terminate
*/
var node_Timer = setInterval(function(){
    var nowText = document.getElementsByClassName("locationDesc");
    if(nowText != thenText){
        var combatNodes = document.getElementsByClassName("menuItem menuFighting");
        for(var i=0; i<combatNodes.length; i++){
            combatNodes[i].addEventListener("click", function(){
                AddListenerToStartOfBattle();
            });
        }
        thenText = nowText;
    }
}, 100, node_Timer);
/*
Basically sets up the statistic log in the Battle Arena
*/
function SetupLog(){
    var arenaDiv = document.getElementsByClassName("arenaContainer");
    var avgExp = Math.round(totalCharExpGained/totalBattles);
    var winLoss = 100*(battlesWon / (battlesWon + battlesLost));
    var resetButton = document.createElement("button");
    var resetButtonText = document.createTextNode("Reset Battle Statistics");
    resetButton.appendChild(resetButtonText);
    resetButton.id = "resetBattleArenaStatistics";
    resetButton.className = "bv_button bv_small_font";
    if(isNaN(avgExp)){avgExp = 0;} //This should only trigger if there was no battle.
    if(isNaN(winLoss)){winLoss = 0;} //This should only trigger if there was no battle.
    var output = "<h4>Battle Statistics</h4><b>Total battles done: " + totalBattles + "</br>Win/Loss: " + battlesWon + "/" + battlesLost + "</br>Win ratio: " + winLoss +
        "%</br>Total combat exp gained: " + totalCharExpGained + "</br>Average combat exp gained: " + avgExp +
        "</br>Total items looted: " + totalItemsGained + "</br>Won battles without loot: " + wonBattleWithoutLoot + "</b></br></br>";
    arenaDiv[2].innerHTML = output;
    arenaDiv[2].appendChild(resetButton);
    resetButton.addEventListener("click", function(){
        ResetBattleStatistics();
    });
}

/*
Resets the battle statistics and calls the SetupLog function at the end
*/
function ResetBattleStatistics(){
    totalCharExpGained = Number(SetStorageVariable("totalCharExpGained",0, showLog));
    totalItemsGained = Number(SetStorageVariable("totalItemsGained",0, showLog));
    battlesWon = Number(SetStorageVariable("battlesWon",0, showLog));
    battlesLost = Number(SetStorageVariable("battlesLost",0, showLog));
    attemptedBattles = Number(SetStorageVariable("attemptedBattles",0, showLog));
    totalBattles = Number(SetStorageVariable("totalBattles",0, showLog));
    wonBattleWithoutLoot = Number(SetStorageVariable("wonBattleWithoutLoot",0, showLog));
    SetupLog();
}

//Start of Chain of event-listener-additions for each state of the Battle Arena (click on the Battle Arena -> finish the battle)
function AddListenerToFinishBattle(){
    var finishElements = document.getElementsByClassName("navButton bv_button bv_xsmall_font");
    for(var i=0; i<finishElements.length;i++){
        finishElements[i].addEventListener("click", function(){
            GetBattleResults();
        });
    }
}

function AddListenerToFindBattle(){
    var foundBattle = false;
    var battle_Arena_Find_Battle_Timer = setInterval(function(){
        if(document.getElementsByClassName("createBattle bv_button bv_small_font").length > 0 && !foundBattle){
            AddListenerToFinishBattle();
            SetupLog();
            document.getElementsByClassName("createBattle bv_button bv_small_font")[0].addEventListener("click", function(){
                AddListenerToStartOfBattle();
            });
            foundBattle = true;
            clearInterval(battle_Arena_Find_Battle_Timer);
        }
    }, 100, battle_Arena_Find_Battle_Timer);
}

function AddListenerToStartOfBattle(){
    var battleStarted = false;
    var battleStartTimer = setInterval(function(){
        if(document.getElementsByClassName("navButton bv_button").length === 1 && !battleStarted){
            document.getElementsByClassName("navButton bv_button")[0].addEventListener("click", function(){
                GetBattleResults();
            });
            battleStarted = true;
            clearInterval(battleStartTimer);
        }
    }, 100, battleStartTimer);
}

function GetBattleResults(){
    var battleDone = false;
    var battleResultTimer = setInterval(function(){
        if(document.getElementsByClassName("victoryBox").length > 0 && !battleDone){
            var expText = document.getElementsByClassName("npcReward")[0].innerText;
            var exp = expText.slice(expText.indexOf("received") + 9, expText.indexOf("EXP"));
            var lootText = document.getElementsByClassName("victoryBox")[0].innerText;
            var amountItems = lootText.slice(lootText.indexOf("Loot bag") + 14,lootText.indexOf("Item"));
            if(lootText.indexOf("Loot bag") === -1){
                amountItems = 0;
                wonBattleWithoutLoot++;
            }
            totalCharExpGained += Number(exp);
            totalItemsGained += Number(amountItems);
            battlesWon++;
            if( document.getElementsByClassName("navButton bv_button2 bv_small_font").length > 0){
                document.getElementsByClassName("navButton bv_button2 bv_small_font")[0].addEventListener("click", function(){
                    AddListenerToFindBattle();
                });
            }
            else if(document.getElementsByClassName("menuItem menuFighting").length > 0){
                document.getElementsByClassName("menuItem menuFighting")[0].addEventListener("click", function(){
                    AddListenerToStartOfBattle();
                });
            }
            battleDone = true;
            clearInterval(battleResultTimer);
        }
        if(document.getElementsByClassName("defeatBox").length > 0 && !battleDone){
            if(document.getElementsByClassName("navButton bv_button bv_small_font").length > 0){
                document.getElementsByClassName("navButton bv_button bv_small_font")[0].addEventListener("click", function(){
                    AddListenerToFindBattle();
                });
            }
            else if(document.getElementsByClassName("menuItem menuFighting").length > 0){
                document.getElementsByClassName("menuItem menuFighting")[0].addEventListener("click", function(){
                    AddListenerToStartOfBattle();
                });
            }
            battlesLost++;
            battleDone = true;
            clearInterval(battleResultTimer);
        }
        totalBattles = battlesWon + battlesLost;
        SetStorageVariable("totalCharExpGained", totalCharExpGained, showLog);
        SetStorageVariable("totalItemsGained", totalItemsGained, showLog);
        SetStorageVariable("wonBattleWithoutLoot", wonBattleWithoutLoot, showLog);
        SetStorageVariable("battlesWon", battlesWon, showLog);
        SetStorageVariable("battlesLost", battlesLost, showLog);
        SetStorageVariable("totalBattles", totalBattles, showLog);
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
