// ==UserScript==
// @name         Mastery-Scanner
// @version      1.1
// @description  Click on all items in the mastery page and finally print out the result in the console
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://*.drakor.com/masteries
// ==/UserScript==

var tradeskills = [document.getElementsByClassName("tradeMat TreasureHunting"),
                   document.getElementsByClassName("tradeMat Mining"),
                   document.getElementsByClassName("tradeMat Fishing"),
                   document.getElementsByClassName("tradeMat Gathering"),
                   document.getElementsByClassName("tradeMat AncientResearch"),
                   document.getElementsByClassName("tradeMat Disenchanting"),
                   document.getElementsByClassName("tradeMat Logging")];
var tradeIds = [[],[],[],[],[],[],[]]; //2d array for ids of each tradeskill
var tradeIdIndex = 0;
var displayArray = ["Treasure Hunting","Mining","Fishing","Gathering","Ancient Research", "Disenchanting", "Logging"];
var speedMulti = 100; //The lower this amount the faster it goes (200-500 is alright)
var output = "";
var totalAttempts = "";
var totalTradeItems = 0;

function ClickAllItems(tradeskill, sleepTime){
    var i=0;
    setTimeout(function(){
        var myInterval = setInterval(function(){
            if(tradeskill.length > i && tradeskill[i].id !== ""){
                var id = tradeskill[i].id.slice(4);
                tradeIds[tradeIdIndex].push(id);
                tradeskill[i].click();
            }
            else{
                tradeIdIndex++;
                clearInterval(myInterval);
            }
            i++;
        }, speedMulti);
    }, sleepTime);

}

/*I know this is ugly as heck, but I currently don't see any other way to avoid clicking items in the wrong order in any other way*/
ClickAllItems(tradeskills[0],speedMulti); //100
ClickAllItems(tradeskills[1], (tradeskills[0].length +10) * speedMulti);
ClickAllItems(tradeskills[2], (tradeskills[0].length + tradeskills[1].length + 20) * speedMulti);
ClickAllItems(tradeskills[3], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + 30) * speedMulti);
ClickAllItems(tradeskills[4], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length + 40) * speedMulti);
ClickAllItems(tradeskills[5], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length + tradeskills[4].length + 50) * speedMulti);
ClickAllItems(tradeskills[6], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length + tradeskills[4].length + tradeskills[5].length + 60) * speedMulti);
var totalTradeItems = tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length + tradeskills[4].length + tradeskills[5].length + tradeskills[6].length;


setTimeout(function(){
    for(var i=0;i<tradeIds.length;i++){
        var totalMastery = 0;
        output += "\n\n\n***TRADE:" + displayArray[i].toUpperCase() + "***\n\n";
        for(var j=0;j<tradeIds[i].length;j++){
            var materialId = "mat-" + tradeIds[i][j];
            var material = document.getElementById(materialId).innerText;
            var masteryId = "mat" + tradeIds[i][j];
            var mastery = document.getElementById(masteryId).getElementsByClassName("matPopupContainer")[0].getElementsByClassName("bv_success")[0].getElementsByClassName("masteryBox")[0].getElementsByClassName("masteryBar")[0].innerText;
            var attempts = Number(mastery.slice(0,mastery.indexOf("/")-1).replace(",",""));
            totalMastery += attempts;
            output += "\n" + material.slice(1, material.indexOf("]")) + "\t - \t" +  mastery.slice(0, mastery.indexOf("("));
        }
        totalAttempts += "\n\nTrade:\t" + displayArray[i] + "\nTotal attempts:\t" + totalMastery + "\n";
    }
    console.log(output, totalAttempts);
}, (totalTradeItems  + 70) * speedMulti);



