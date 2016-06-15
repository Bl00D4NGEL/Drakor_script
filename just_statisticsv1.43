// ==UserScript==
// @name         Just statistics v1.43
// @version      1.43
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://www.drakor.com
// ==/UserScript==

/*
Variable declaration
*/

var totalExp = 0;
var avgExp = 0;
var thenLength = 0;			//This is to prevent the interval to loop over the drop more than once
var totalLength = 1;		//Same as "thenLength" variable, just that this is for a total statistic reference
var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
var raritiesCollected = [0,0,0,0,0];	//Array of 0's for the rarity-meter
var amountNothing = 0;		//Used for the "Nothing x" output
var amountMaterials = [];	//Array for how much of the item that dropped/ has been created was dropped/made exactly
var gainedMaterials = [];	//Same as "amountMaterials" just for the name storage (I might change this to a dictionary at some point)
var multiCollections = [];
var totalStatistics = false;
if(!Boolean(GetStorageVariable("totalStatistics"))){
    totalStatisitics = GetStorageVariable("totalStatistics");
}
var avgMaterials = 0;
var materialDic = {};
var multiDic = {};

SetupLog();
/*
Let's keep this for the being as I might need this later

function GetRightTiming(){
    var timeVar = 0;
    var finalTime = 0;
    var dividerVar = 0;
    console.log("Starting to find ideal interval...");
    var dummyTime = 5;
    var myTimer = setInterval(function(){
        timerText = document.getElementById("skill-timer").innerText;
        if(timerText.indexOf((dummyTime+"%")) !== -1 && dummyTime <= 99){
            dividerVar += 0.5;
            timeVar += Number(timerText.slice(timerText.indexOf("(")+1, timerText.indexOf(")")));
            dummyTime += 10;
        }
        if(timerText.indexOf("100%") !== -1){
            finalTime = Math.floor(timeVar / dividerVar);
            console.log("What about.. " + finalTime + " seconds?");
            clearInterval(myTimer);
            MainLoop((finalTime * 1000));
        }
    }, 100);
}
*/

/*
Function to get the right timer when to refresh data
*/
function GetRightTiming(){
    var numberOne;
    var numberTwo;
    console.log("Starting to find ideal interval...");
    var myTimer = setInterval(function(){
        timerText = document.getElementById("skill-timer").innerText;
        if(timerText.indexOf("25%") !== -1){
            dateVar = new Date();
            numberOne = dateVar.getSeconds();
        }
        if(timerText.indexOf("50%") !== -1){
            dateVar = new Date();
            numberTwo = dateVar.getSeconds();
        }
        if(timerText.indexOf("99%") !== -1){
            if((numberOne - numberTwo) > 30){
                numberTwo = 60-numberTwo;
            }
            var result =((numberTwo - numberOne)*4);
            console.log("What about.. " + result + " seconds?");
            if(isNaN(result)){
                console.log("Oh wait.. this is wrong");
                GetRightTiming();
            }
            else{
            clearInterval(myTimer);
            MainLoop((result * 1000));
            }
        }
    }, 500);
}

/*
takes the variable name to look for as an argument, return the value of the variable, if there is one
boolShow: If the function is called and boolShow is true, the console will log the localstorage-loading, if not(false, omitted), it won't
*/
function GetStorageVariable(varName, boolShow){
    var output =  localStorage.getItem(varName);
    if(boolShow){
        console.log(varName + " has been loaded out of local storage. Value: " + output);
    }
    return output;
}

/*
Takes the variable name to save as and the value to save with the variable as arguments and writes them to the loca storage
boolShow: If the function is called and boolShow is true, the console will log the localstorage-writing, if not(false, omitted), it won't
*/
function SetStorageVariable(varName, varValue, boolShow){
    localStorage.setItem(varName, varValue);
    if(boolShow){
        console.log(varName  + " now has been saved to the local storage. Value: " + varValue);
    }
}

/*
This function updates the log under the rarity-bar whenever the select has changed it's object
The printed log gets built up in the interval each time something is collected
The function itself takes the select value(var = value) and the dictionary entry(var = logText)
*/
function UpdateHistory(){
    if(document.getElementById("materialLog") !== null){
        document.getElementById("logDiv").removeChild(document.getElementById("materialLog"));
    }
    var filterArray = [materialDic[document.getElementById("selectLogMaterial").value], multiDic[document.getElementById("selectLogMulti").value]];
    var materialLog = document.createElement("small");
    materialLog.innerHTML = "";
    materialLog.id = "materialLog";
    materialLog.style.fontSize = "14px";
    for(var i=0;i<filterArray.length;i++){
        if( filterArray[i] !== "---Select a material---"  &&  filterArray[i] !== "---Select a multi---" && filterArray[i] !== undefined){
            materialLog.innerHTML += filterArray[i];
        }
    }
    document.getElementById("logDiv").appendChild(materialLog);
}

/*
Simple and self-explaining function:
Adds an option to the select, option = thing to add to the select, select = select to add to, gets called if the collected material/multi hasn't been added yet
*/
function AddOption(option, select){
    var newOption = document.createElement("option");
    newOption.text= option;
    newOption.value = option;
    select.add(newOption);
}

/*
This configueres whether the button will append a "help-text" to the end of the div if clicked or
remove the text if the button is clicked again
The Helptext itself is a Work in Progress!
*/
function HelpButtonAction(){

    if(document.getElementsByClassName("skillBox")[0].lastChild.id !== "helpDiv"){
        var helpDiv = document.createElement("div");
        helpDiv.id = "helpDiv";
        helpDiv.style.backgroundColor = "lightgrey";
        helpDiv.style.fontSize = "14px";
        helpDiv.style.color = "black";
        helpDiv.style.padding = "2px";
        helpDiv.style.margin = "4px";
        helpDiv.innerHTML = "This is just a </br>simple help file!(Work in progress)";
        document.getElementsByClassName("skillBox")[0].appendChild(helpDiv);
    }
    else{
        document.getElementsByClassName("skillBox")[0].removeChild(document.getElementsByClassName("skillBox")[0].lastChild);
    }
}

/*
This sets up the collection log("rarity-bar", checkBox to keep totalStatistics or, the reset button and anything else)
*/
function SetupLog(){
    var setupInterval = setInterval(function(){
        if(document.getElementsByClassName("skillBox").length > 0){ //If the titleHeader class has a length of above 0, create the graphical log part
            if(document.getElementById("logDiv") === null){
                var checkBoxTotalStatistics = document.createElement("input");
                var checkBoxTotalStatisticsText = document.createElement("small");
                var emptyLine = document.createElement("small");
                var buttonResetStatistics = document.createElement("button");
                var buttonHelp = document.createElement("button");
                var buttonHelpText = document.createTextNode("Help!?");
                buttonHelp.appendChild(buttonHelpText);
                var buttonResetStatisticsText = document.createTextNode("Reset Statistics");
                var selectLogMaterial = document.createElement("select");
                var selectLogMulti = document.createElement("select");
                var logDiv = document.createElement("div");
                logDiv.style.maxHeight = "400px";
                logDiv.style.overflowX = "hidden";
                logDiv.style.overflowY = "scroll";
                logDiv.style.fontSize = "14px";
                logDiv.id = "logDiv";
                var fragment = document.createDocumentFragment();
                buttonResetStatistics.appendChild(buttonResetStatisticsText);
                checkBoxTotalStatisticsText.innerHTML = "Track total statistics? </br>";
                emptyLine.innerHTML = "</br>";
                selectLogMulti.style.padding = "4px";
                selectLogMaterial.style.padding = "4px";
                checkBoxTotalStatistics.type = "checkbox";
                checkBoxTotalStatistics.id = "checkBoxTotalStatistics";
                selectLogMaterial.id = "selectLogMaterial";
                selectLogMulti.id = "selectLogMulti";
                buttonResetStatistics.id = "buttonResetStatistics";
                if(totalStatistics === "true" || totalStatistics === true){
                    checkBoxTotalStatistics.checked = true;
                }
                else{
                    checkBoxTotalStatistics.checked = false;
                }
                fragment.appendChild(checkBoxTotalStatistics);
                fragment.appendChild(checkBoxTotalStatisticsText);
                fragment.appendChild(selectLogMaterial);
                fragment.appendChild(emptyLine);
                fragment.appendChild(selectLogMulti);
                fragment.appendChild(emptyLine);
                fragment.appendChild(buttonResetStatistics);
                fragment.appendChild(buttonHelp);
                document.getElementsByClassName("skillBox")[0].appendChild(fragment);
                document.getElementsByClassName("skillResultsHeader")[0].innerHTML = "";
                document.getElementsByClassName("skillResultsHeader")[0].appendChild(logDiv);
                AddOption("---Select a material---",  document.getElementById("selectLogMaterial"));
                AddOption("---Select a multi---",  document.getElementById("selectLogMulti"));
                checkBoxTotalStatistics.addEventListener("click", function(){
                    SetTotalStatistics();
                });
                buttonResetStatistics.addEventListener("click", function(){
                    ResetStatistics(true);
                });
                buttonHelp.addEventListener("click", function(){
                    HelpButtonAction();
                });
                selectLogMaterial.addEventListener("change",function(){
                    UpdateHistory();
                });
                selectLogMulti.addEventListener("change",function(){
                    UpdateHistory();
                });
                if(totalStatistics === false){
                    ResetStatistics(false);
                }
                /*
            This will only trigger if totalStatistics is true.
            The selects won't keep their data because the log gets rebuilt for each node...
            Therefore I needed to "hard-code" this on
            */
                for(var i=0; i<gainedMaterials.length;i++){
                    AddOption(gainedMaterials[i], document.getElementById("selectLogMaterial"));
                }
                if(multiCollections[0] > 0){
                    AddOption("nothing", document.getElementById("selectLogMulti"));
                }
                for(var j=0;j<(multiCollections.length-1);j++){
                    if(multiCollections[(j+1)] !== undefined){
                        AddOption((j+1), document.getElementById("selectLogMulti"));
                    }
                }
                GetRightTiming();
                MainLoop(1000, true);
                clearInterval(setupInterval);
            }
        }
    }, 5000);
}

/*
If someone clicks on the checkBox (id=checkBoxTotalStatistics) it will execute this code.
It update the "totalStatistics" variable and prints into console what the current state of data-keeping is
*/
function SetTotalStatistics(){
    checkBox = document.getElementById("checkBoxTotalStatistics");
    if(checkBox.checked === true){
        SetStorageVariable("totalStatistics", "true", false);
        console.log("Now tracking total statistics");
    }
    else{
        SetStorageVariable("totalStatistics", "false", false);
        console.log("Now collecting statistics from this node only");
    }
}

/*
Pretty self-explaining. It basically resets the variables to their base state.
This only gets triggered by the reset-button (id=buttonResetStatistics) and every time the log gets built and the "totalStatistics" variable is set to false
*/
function ResetStatistics(showReset){
    totalExp = 0;
    avgExp = 0;
    thenLength = 0;			//This is to prevent the interval to loop over the drop more than once
    totalLength = 1;		//Same as "thenLength" variable, just that this is for a total statistic reference
    rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    raritiesCollected = [0,0,0,0,0];	//Array of 0's for the rarity-meter
    amountNothing = 0;		//Used for the "Nothing x" output
    amountMaterials = [];	//Array for how much of the item that dropped/ has been created was dropped/made exactly
    gainedMaterials = [];	//Same as "amountMaterials" just for the name storage (I might change this to a dictionary at some point)
    multiCollections = [];
    totalStatistics = false;
    totalStatisitics = SetStorageVariable("totalStatistics", "false", showReset);
    avgMaterials = 0;
    materialDic = {};
    multiDic = {};
    document.getElementById("selectLogMulti").options.length = 1;
    document.getElementById("selectLogMaterial").options.length = 1;
    console.log("Everything has been re-set");
}

/*
This updates the colorful div that displays the rarity-meter.
It takes the rarityArray, which was created earlier with the for-loop and the totalLength variable to set the width of the different divs
setting the nothing-div afterwards might be optimisable.
*/
function UpdateStatisticDivs(rarityArray, totalLength){
    var divWidth = 0;
    var colorArray = ["#999", "#48c730", "#2f84c7", "#bd33de", "#f14c02"];
    mainDiv = document.createElement("div");
    mainDiv.id = "mainDiv";
    mainDiv.style.overflow = "hidden";
    mainDiv.style.color = "black";
    for(var i=0; i<rarityArray.length;i++){
        if(rarityArray[i] > 0){
            div = document.createElement("div");
            div.innerText = Math.round(rarityArray[i] / totalLength * 100) + "%";
            div.style.float= "left";
            div.id = "rarityDiv" + i;
            div.style.backgroundColor = colorArray[i];
            div.style.width = (rarityArray[i] / totalLength * 492) + "px";
            divWidth += rarityArray[i] / totalLength * 492;
            mainDiv.appendChild(div);
        }
    }
    if(divWidth <490){
        div = document.createElement("div");
        div.innerText = Math.round((492-divWidth)/492 * 100)+ "%";
        div.style.float= "left";
        div.id = "rarityDivNothing";
        div.style.backgroundColor = "#fff";
        div.style.width = (492 - divWidth) + "px";
        mainDiv.appendChild(div);
    }
    document.getElementById("logDiv").appendChild(mainDiv);
}

/*
Simple function to parse in a string and then return the same string just with blank spaces, plus signs and brackets removed.
*/
function createAmountString(stringtoBeConverted){
    stringtoBeConverted = stringtoBeConverted.replace(" ","");
    stringtoBeConverted = stringtoBeConverted.replace("+","");
    stringtoBeConverted = stringtoBeConverted.replace("(","");
    return stringtoBeConverted;
}

function MainLoop(timerVar, loopOnce){
    var mainInterval = setInterval(function(){
        var results = document.getElementsByClassName("roundResult areaName");
        //This if-clause is to prevent looping over the same thing too often, it'll only execute every time the node drops something
        if(results.length > thenLength){
            var resultsText = document.getElementsByClassName("roundResult areaName")[0].innerText;
            var output = "You have collected";
            /*
            This two if clauses are necessary because Goz made two different exp-display ways.
            Because of this the code checks for both types of classes and if either of them has a length greater than 1,
            it'll start slicing the result array for the exp dropped(and total experience) and the dropped amount
            */
            if(document.getElementsByClassName("hourMin xsmall").length >0){
                amount = resultsText.slice(resultsText.lastIndexOf("]")+3, document.getElementsByClassName("hourMin xsmall")[0].innerText.length * (-1));
                expDropped = document.getElementsByClassName("hourMin xsmall")[0].innerHTML;
                totalExp += Number(expDropped.substring(4,expDropped.lastIndexOf("<")));
            }
            else if(document.getElementsByClassName("statValue").length >0){
                amount = resultsText.slice(resultsText.lastIndexOf("]")+3, document.getElementsByClassName("statValue")[0].innerText.length * (-1));
                expDropped = document.getElementsByClassName("statValue")[0].innerHTML;
                totalExp += Number(expDropped.substring(0, expDropped.indexOf("E")-1));
            }
            else{
                console.log("ERROR: Exp-display changed, please contact creator of this script or similar responsibles");
                amount =0;
                expDropped=0;
                totalExp=0;
            }
            avgExp = Math.floor(totalExp/(totalLength));
            if(isNaN(avgExp)){ //If exp values happen to be NaN you can see that in the output later on.
                avgExp = "invalid input";
            }
            if(isNaN(totalExp)){
                totalExp = "invalid input";
            }
            var rawAmount = amount;
            amount = amount.replace(" ", "");
            if(resultsText.indexOf("found") !== -1 || resultsText.indexOf("created") !== -1){ //If the result string contains "found" it automatically recognizeses this as a drop, otherwise it's a "nothing-drop"
                lastCollectedMaterial = resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]"));
                if(gainedMaterials.indexOf(lastCollectedMaterial) == -1){ //If the collected material is not in the gainedMaterials array, the indexOf returns -1, thus it adds this variable to the array and everything else
                    gainedMaterials.push(lastCollectedMaterial);
                    amountMaterials.push(0);
                    AddOption(lastCollectedMaterial,  document.getElementById("selectLogMaterial"));
                    materialDic[lastCollectedMaterial] = "</br>" + resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + amount;
                }
                else{
                    materialDic[lastCollectedMaterial] += "</br>" + resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + amount;
                }
            }
            else{ //If "nothing" drops, the variable gets +1 (Used later on)
                amountNothing++;
            }
            if(amount.length > 3){ //This should only execute when mastery, Create Rate/Drop Rate or whatever procs on the drop.
                amount = resultsText.slice(resultsText.lastIndexOf("]")+3,resultsText.lastIndexOf("]")+6);
            }
            amount = createAmountString(amount);
            for(var i=0; i<gainedMaterials.length; i++){ //This for-loop is to get the amount that was gathered/created and afterwards puts it into the output string.
                if(resultsText.indexOf(gainedMaterials[i]) != -1){
                    amountMaterials[i] += Number(amount);
                }
                output += "</br>"+ gainedMaterials[i] + " x" + amountMaterials[i];
            }
            if(amountNothing > 0){ //Reuse of "amountNothing" variable.
                output += "</br>Nothing x" + amountNothing;
            }
            output += "</br>and " + totalExp + " total experience(" + avgExp + " average experience)</br>on this node.</br>";
            if(amount === "ou"){
                amount = "nothing";
            }
            //Please. Do. Not. Hate. Me. I know this leaves a lot of "undefined" entries in the array, but I have yet to find a different way to handle this
            if(multiCollections[amount] === undefined && amount !== "nothing"){
                multiCollections[amount] = 1;
                AddOption(amount, document.getElementById("selectLogMulti"));
                multiDic[amount] = "</br>" + resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + rawAmount;
            }
            else if(amount === "nothing"){
                if( $("#selectLogMulti option[value='nothing']").length === 0){ // "nothing" as an option for multi instead of displaying "ou" if it is not present already
                    AddOption(amount, document.getElementById("selectLogMulti"));
                    multiCollections[0] = 1;
                    multiDic[amount] = "</br>" + resultsText.slice(1, resultsText.indexOf("]")) +  " - " + "You didn't find anything.";
                }
                else{
                    multiCollections[0] = amountNothing;
                    multiDic[amount] += "</br>" + resultsText.slice(1, resultsText.indexOf("]")) +  " - " + "You didn't find anything.";
                }
            }
            else
            {
                multiCollections[amount]++;
                multiDic[amount] += "</br>" + resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + rawAmount;
            }
            avgMaterials = 0; //Reset this to 0 to avoid wrong output (Would get way too high if not re-set)
            //This adds up the total multi-collections or -creations that you have achieved and finally add it to the output
            for(var j=0;j<multiCollections.length;j++){
                if(multiCollections[j] !== 0 && multiCollections[j] !== undefined){
                    output += "You found/created a material x"+j + " " + multiCollections[j] + " time(s).</br>";
                    avgMaterials += (j) * multiCollections[j];
                }
            }
            avgMaterials = (avgMaterials / totalLength).toFixed(2);
            output += "Average materials collected/created: " + avgMaterials + "</br>";
            if(totalStatistics === true){ //This is necessary because totalLength is > results.length after you switch nodes, thus causing some problems
                output += "Total collection attempts: " + totalLength;
            }
            else{
                output+= "Total collection attempts: " + results.length;
            }
            document.getElementById("logDiv").innerHTML = output; //print output to the html of that div (Jquery is love)
            output = ""; //Reset output variable since it gets build it up every time from scratch; This might eat resources(?)
            for(var  k=0;k<rarities.length;k++){ //for-loop iterates how many materials of each rarity have been collected.
                if(results[0].innerHTML.indexOf(rarities[k]) !== -1){
                    raritiesCollected[k]++;
                }
            }
            UpdateStatisticDivs(raritiesCollected, totalLength);
            UpdateHistory();
            totalLength++;

        }
        thenLength = results.length;
        if(document.getElementsByClassName("roundResult damage areaDepleted").length !== 0){
            document.getElementsByTagName("title")[0].innerText = "Node depleted";
            alert("Node depleted");}

        else{
            if(document.getElementsByClassName("nodeRemaining").length !== 0){
                console.log(document.getElementsByClassName("nodeRemaining")[0].innerText);
                document.getElementsByTagName("title")[0].innerText = document.getElementsByClassName("nodeRemaining")[0].innerText;
            }
            else if(document.getElementsByClassName("titleHeader").length > 0){
                document.getElementsByTagName("title")[0].innerText = document.getElementsByClassName("titleHeader")[0].innerText.slice(document.getElementsByClassName("titleHeader")[0].innerText.indexOf("]")+ 1);
            }
        }
        if(loopOnce && results.length > 0){
            clearInterval(mainInterval);
        }
        else if(loopOnce && results.length === 0){
            clearInterval(mainInterval);
            setTimeout(MainLoop(5000,true), 5000);
        }
    }, timerVar);
}

/*
Patch notes 1.42
10th.June.2016
-	Started doing patch notes, yay!
- 	Commented variables, moved them to the ResetStatistics function
- 	Cleaned up the UpdateStatisticDivs function from junk lines
-	Renamed and rearranged variables in "SetupLog" function
- 	Created fall-back else in the amount,expDropped and totalExp if-clause to report an error to the console
11th.June.2016
-   Added a dictionary variable "materialDic" that helps build up the displayed log of a specific material
-   Added a history log for specific materials/multis
-   Removed alert from ResetStatistics as it was kind of annoying
-   Removed the Limit function since it was a pointless (and unallowed) feature anyway
-   Reworded some labels on the checkbox and console outputs
-   Renamed script to "Just statistics v1.42" instead of the original name "Collection history"
Ninja patch:
-   Added everything to it's own div inside the original div (class ="skillresultsheader")
-	Fixed a bug where the select(s) would not reset their data properly
12th.June.2016
-   Fixed a bug where the multi would display "ou" if you didn't find anything
-   Also fixed the display of this so it does not display the time twice
-   Fixed a bug where if you would execute the jquery command to get this script while you have already collected/created materials it would not execute the script correctly
-   Fixed a bug where the multi-select would not reset/rebuild properly

Patch notes 1.43
14th.June.2016
-   Re-did the setup of the log requirements so that it now checks for an existing id(logDiv) and not for the text of the last element
    This will make further implementation easier
-   Started to save the "totalStatistics" variable in the local storage. This is just the beginning of session-continued data collection (Still in it's early steps)
-   Created a help button and added functionality to it (It appends text to the end of the div)
-   Optimized the main Interval to set a "perfect" interval time via function.
-   Created a function(GetRightTiming) to calculate the "perfect" interval time based on the passed between 25% and 50%
-   Moved the node-information into the main-loop as this should have a good interval now
*/
