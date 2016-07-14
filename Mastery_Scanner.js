// ==UserScript==
// @name         Mastery-Scanner
// @version      1.0
// @description  Click on all items in the mastery page and finally print out the result in the console
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://www.drakor.com/masteries
// ==/UserScript==

var tradeskills = [document.getElementsByClassName("tradeMat Logging"),
                   document.getElementsByClassName("tradeMat Mining"),
                   document.getElementsByClassName("tradeMat Fishing"),
                   document.getElementsByClassName("tradeMat Gathering"),
                   document.getElementsByClassName("tradeMat AncientResearch"),
                   document.getElementsByClassName("tradeMat Disenchanting")];
var displayArray = ["Logging","Mining","Fishing","Gathering","Ancient Research", "Disenchanting"];
var masteryBar = document.getElementsByClassName("masteryBar");
var speedMulti = 100; //The lower this amount the faster it goes (200-500 is alright)
function ClickAllItems(tradeskill, i, sleepTime){
    setTimeout(function(){
        myInterval = setInterval(function(){
            if(i<tradeskill.length){
                tradeskill[i].click();
            }
            else{
                clearInterval(myInterval);
            }
            i++;
        }, speedMulti);
    }, sleepTime);

}
var output = "";
var totalAttempts = "";

function PrintMasteryScore(tradeskill, displayTrade, index, dummy){
        var totalMastery = 0;
        for(var j=0;j<(tradeskill.length-1);j++){
            if(tradeskill[j].innerText.valueOf("x") !== -1){
                output += "\n" + tradeskill[j].innerText.slice(0,-1)+ " - Mastery score: " + masteryBar[(index+j-dummy)].innerText;
                totalMastery += Number(masteryBar[(index+j-dummy)].innerText.slice(1,masteryBar[(index+j-dummy)].innerText.indexOf("/")).replace(",",""));
            }
        }
        totalAttempts +=  "\n" +"Total attempts done in " + displayTrade + ": " + totalMastery;
}
/*I know this is ugly as heck, but I currently don't see any other way to avoid clicking items in the wrong order in any other way */
ClickAllItems(tradeskills[0],0,speedMulti);
ClickAllItems(tradeskills[1],0, tradeskills[0].length * speedMulti + speedMulti * 10);
ClickAllItems(tradeskills[2],0, (tradeskills[0].length + tradeskills[1].length) * speedMulti+speedMulti*20);
ClickAllItems(tradeskills[3],0, (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length) * speedMulti+speedMulti*30);
ClickAllItems(tradeskills[4],0, (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length) * speedMulti+speedMulti*40);
ClickAllItems(tradeskills[5],0, (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length + tradeskills[4].length) * speedMulti+speedMulti*50);


/*I know this is ugly as heck, but I currently don't see any other way to avoid displaying the wrong masteries for the wrong skill in any other way */
setTimeout(function(){
PrintMasteryScore(tradeskills[0], displayArray[0],0,0);
PrintMasteryScore(tradeskills[1], displayArray[1], tradeskills[0].length,1);
PrintMasteryScore(tradeskills[2], displayArray[2], (tradeskills[0].length + tradeskills[1].length),2);
PrintMasteryScore(tradeskills[3], displayArray[3], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length),3);
PrintMasteryScore(tradeskills[4], displayArray[4], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length),4);
PrintMasteryScore(tradeskills[5], displayArray[5], (tradeskills[0].length + tradeskills[1].length + tradeskills[2].length + tradeskills[3].length + tradeskills[4].length),5);
console.log(output, totalAttempts);
}, speedMulti * 250);
