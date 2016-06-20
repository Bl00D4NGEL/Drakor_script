// ==UserScript==
// @name         Just statistics v1.52
// @version      1.52
// @description  Collection/Creation log (Tracks drops/creates, multidrops/-creates, displays the different rarities that dropped and more...)
// @author       Dominik "Bl00D4NGEL" Peters
// @match        http://www.drakor.com*
// ==/UserScript==

/*
Variable declaration
PS: Global vars are ugly
*/
var version = "v1.52";
console.log("You're currently using version " + version);
//Variable declaration; getting the data out of local storage
var thenLength =  0;//This is to prevent the interval to loop over the drop more than once
var displayNerdStuff = RetrieveVariable("displayNerdStuff", false, "true");
var totalExp = Number(RetrieveVariable("totalExp", 0, displayNerdStuff));
var totalLength = Number(RetrieveVariable("totalLength", 1, displayNerdStuff));		//this is for a total statistic reference
var amountNothing = Number(RetrieveVariable("amountNothing", 0, displayNerdStuff));		//Used for the "Nothing x" output
var totalStatistics = RetrieveVariable("totalStatistics", false, displayNerdStuff);
var displayRarity = RetrieveVariable("displayRarity", false, displayNerdStuff);
var maxMulti = Number(RetrieveVariable("maxMulti", 0, displayNerdStuff));
var collected = Number(RetrieveVariable("collected", 0, displayNerdStuff));
var rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];


// Array declaration; getting the data out of local storage
var raritiesCollected = [];
var amountMaterials = [];	//Array for how much of the item that dropped/ has been created was dropped/made exactly
var gainedMaterials = [];	//Same as "amountMaterials" just for the name storage (I might change this to a dictionary at some point)
var multiCollections = [];
for(var rarity =0; rarity<5; rarity++){
    raritiesCollected[rarity] = Number(RetrieveVariable(("rarity" +rarity), 0, displayNerdStuff));
}
for(var multiCollection = 0; multiCollection < maxMulti; multiCollection++){
    multiCollections[multiCollection] = Number(RetrieveVariable(("multiCollection" + multiCollection), 0, displayNerdStuff));
}
for(var item = 0; item < collected; item++){
    amountMaterials[item] = Number(RetrieveVariable(("amountMaterials" + item), 0, displayNerdStuff));
    gainedMaterials[item] = RetrieveVariable(("gainedMaterials" + item), "", displayNerdStuff);
}

// Object declaration; getting the data out of local storage
var materialDic = {};
var multiDic = {};
nothingString = "nothing"; //Just a string containing the word "nothing" to remove the warnings from other things.
multiDic[nothingString] = RetrieveVariable("multiDic_nothing", " ", displayNerdStuff); //Need to hardcode this because mutliDic_Nothing does not have a number..
for(var materialDiCEntry = 0; materialDiCEntry < collected; materialDiCEntry++){
    var materialDicName = ("materialDic_"+ GetStorageVariable(("gainedMaterials"+materialDiCEntry))); //String built to reduce length of following line
    materialName = GetStorageVariable(("gainedMaterials"+materialDiCEntry)); //String built to reduce length of following line
    materialDic[materialName] = RetrieveVariable(materialDicName, "", displayNerdStuff);
}
for(var multiDiCEntry = 0; multiDiCEntry < maxMulti; multiDiCEntry++){
    multiDic[multiDiCEntry] = RetrieveVariable(("multiDic_" + multiDiCEntry), "", displayNerdStuff);
}
setInterval(function(){ //This might be ugly, but currently I don't know a way to solve an auto-rebuilding setup more dynamically
    if(document.getElementsByClassName("skillBox").length > 0){ //If the titleHeader class has a length of above 0, create the graphical log part
        if(document.getElementById("logDiv") === null){ //If there is not "logDiv" div start the setup of the log
            SetupLog();
        }
    }
}, 5000);

/*
Gets called each time the checkbox "display rarities below" is ticked.
If is has a "true" value it'll display the rarities and some other info about them below everything else
If it has a "false" value it'll delete the child to remove the data until it gets called again
*/
function DisplayRarities(){
    if(document.getElementById("checkBoxRarities").checked){
        var colorArray = ["#999", "#48c730", "#2f84c7", "#bd33de", "#f14c02"]; //Colors of each rarity ordered by common -> legendary
        var lengthVar = totalLength - 1;
        if(totalLength > 1){
            rarityLog = document.createElement("small");
            rarityLog.innerHTML = "</br>";
            rarityLog.id = "rarityLog";
            rarityLog.style.fontSize = "14px";
            rarityLog.innerHTML = "<b>Rarities collected: </b>";
            for(var rarity = 0; rarity<rarities.length;rarity++){
                rarityLog.innerHTML += "<p style='color:" + colorArray[rarity] + "'>" + rarities[rarity] + ": " + raritiesCollected[rarity] + "/" + lengthVar + " " + (100*(raritiesCollected[rarity]/lengthVar)).toFixed(1) +  "%</p>";
            }
            rarityLog.innerHTML += "<p style='color:#fff'>Nothing: " + amountNothing + "/" + lengthVar + " " + (100*(amountNothing/lengthVar)).toFixed(1) + "%</p>";
            document.getElementById("logDiv").appendChild(rarityLog);
        }
    }
    else if(document.getElementById("rarityLog") !== null){
        document.getElementById("logDiv").removeChild(document.getElementById("rarityLog"));
    }
}
/*
timeInMs gets calculated down to hours, minutes and seconds and gets output as a string
example ConvertIntoSmallerTimeFormat(3600000) [1 hour in milliseconds]
output: 1 Hour(s) 0 Minute(s) 0 Second(s)
*/
function ConvertIntoSmallerTimeFormat(timeInMs){
    output = "";
    milliseconds = timeInMs % 1000;
    timeInMs -= milliseconds;
    timeInMs = timeInMs / 1000;
    if(timeInMs > 0){
        seconds = timeInMs % 60;
        output = seconds + " and Second(s)" + output;
        timeInMs -= seconds;
        timeInMs = timeInMs / 60;
        if(timeInMs > 0){
            minutes = timeInMs % 60;
            output = minutes + " Minute(s) " + output;
            timeInMs -= minutes;
            timeInMs = timeInMs / 60;
            if(timeInMs > 0){
                hours = timeInMs % 24;
                output = hours + " Hour(s) " + output;
                timeInMs -= hours;
            }
        }
    }
    return output;
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

/*
Function to get the right timer when to refresh data
Gets triggered by SetupLog()
*/
function GetRightTiming(){
    console.log("Starting to find correct refresh-rate");
    var timerSet = false; //Using this variable to prevent multi-starting of mainLoops
    var myTimer = setInterval(function(){ //Starting the timer in 500 ms interval to look for the 2 second left thing
        if(document.getElementsByClassName("skillTimer").length > 0){ //Preventing error-message spam because it would otherwise try to read the text of this
            timerText = document.getElementById("skill-timer").innerText;
            if(timerText.indexOf("(2)") !== -1 && !timerSet){ //If the timer only has 2 seconds left, start a timeout for 3 seconds
                timerSet = true;
                setTimeout(function(){
                    var newTime = timerText.slice(timerText.indexOf("(")+1, timerText.indexOf(")"));
                    newTime = Number(newTime) + 1; //Add 1 because of the 3 seconds timeout, this can cause off-numbers but this gets handlded in the mainInterval
                    console.log("Refreshing every " + newTime + " seconds");
                    MainLoop(2000, true);
                    MainLoop(newTime*1000);
                    clearInterval(myTimer); //Clear the mess that got started
                }, 3000, myTimer);
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
This function updates the log over the rarity-bar whenever the select has changed it's object
The printed log gets built up in the interval each time something is collected
*/
function UpdateHistory(){
    var filterArray = [];
    var materialLog;
    if(document.getElementById("materialLog") === null){ //If the material log hasn't been build yet, do so, else just change the innerHTML
        filterArray = [materialDic[document.getElementById("selectLogMaterial").value], multiDic[document.getElementById("selectLogMulti").value]];
        materialLog = document.createElement("small");
        materialLog.innerHTML = "";
        materialLog.id = "materialLog";
        materialLog.style.fontSize = "14px";
        document.getElementById("logDiv").appendChild(materialLog);
    }
    else{
        filterArray = [materialDic[document.getElementById("selectLogMaterial").value], multiDic[document.getElementById("selectLogMulti").value]];
        materialLog = document.getElementById("materialLog");
        materialLog.innerHTML = "";
    }
    for(var i=0;i<filterArray.length;i++){
        if( filterArray[i] !== "---Select a material---"  &&  filterArray[i] !== "---Select a multi---" && filterArray[i] !== undefined){
            materialLog.innerHTML += filterArray[i];
        }
    }
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
        helpDiv.innerHTML = "This is just a </br>simple help file!(Work in progress)" +
            "<h5>What does that [NBA] and [BA] mean in front of my title?</h5>" +
            "<p>Basic explanation of the tags are: </br>" +
            "[NBA] = No Buff Active - [BA] = Buff Active </br>" +
            "This means that it will basically display if you currently got a food buff active or not.</p></br>" +
            "<h5>Can I contribute in any way?</h5>" +
            "<p>Sure! If you got any suggestion feel free to message Bl00D4NGEL with it. </br>" +
            "Can I help with this help file? </br>" +
            "Sure thing. Just message Bl00D4NGEL once again with any idea of what could be added to this.</p>";
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
    var checkBoxTotalStatistics = document.createElement("input");
    var checkBoxRarities = document.createElement("input");
    var checkBoxNerdStuff = document.createElement("input");
    var checkBoxTotalStatisticsText = document.createElement("small");
    var checkBoxRaritiesText = document.createElement("small");
    var checkBoxNerdStuffText = document.createElement("small");
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
    checkBoxRaritiesText.innerHTML = "Display rarities below? </br>";
    checkBoxNerdStuffText.innerHTML = "Display the nerdy things in the console? </br>";
    emptyLine.innerHTML = "</br>";
    selectLogMulti.style.padding = "4px";
    selectLogMaterial.style.padding = "4px";
    checkBoxTotalStatistics.type = "checkbox";
    checkBoxTotalStatistics.id = "checkBoxTotalStatistics";
    checkBoxRarities.type = "checkbox";
    checkBoxRarities.id = "checkBoxRarities";
    checkBoxNerdStuff.type = "checkbox";
    checkBoxNerdStuff.id = "checkBoxNerdStuff";
    selectLogMaterial.id = "selectLogMaterial";
    selectLogMulti.id = "selectLogMulti";
    buttonResetStatistics.id = "buttonResetStatistics";
    if(totalStatistics === "true"){
        checkBoxTotalStatistics.checked = true;
    }
    else{
        checkBoxTotalStatistics.checked = false;
    }
    if(displayRarity === "true"){
        checkBoxRarities.checked = true;
    }
    else{
        checkBoxRarities.checked = false;
    }
    if(displayNerdStuff === "true"){
        checkBoxNerdStuff.checked = true;
    }
    else{
        checkBoxNerdStuff.checked = false;
    }
    fragment.appendChild(checkBoxTotalStatistics);
    fragment.appendChild(checkBoxTotalStatisticsText);
    fragment.appendChild(checkBoxRarities);
    fragment.appendChild(checkBoxRaritiesText);
    fragment.appendChild(checkBoxNerdStuff);
    fragment.appendChild(checkBoxNerdStuffText);
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
        WriteCheckboxStatus(checkBoxTotalStatistics, "totalStatistics");
    }, checkBoxTotalStatistics);
    checkBoxRarities.addEventListener("click", function(){
        DisplayRarities();
        WriteCheckboxStatus(checkBoxRarities, "displayRarity");
    }, checkBoxRarities);
    checkBoxNerdStuff.addEventListener("click", function(){
        WriteCheckboxStatus(checkBoxNerdStuff, "displayNerdStuff");
    }, checkBoxNerdStuff);
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
    if(totalStatistics === "false"){
        ResetStatistics();
    }
    /*
    This will only trigger if totalStatistics is true.
    The selects won't keep their data because the log gets rebuilt for each node...
    Therefore I needed to "hard-code" this on
    */
    for(var i=0; i<gainedMaterials.length;i++){
        AddOption(gainedMaterials[i], document.getElementById("selectLogMaterial"));
    }
    if(amountNothing > 0){
        AddOption("nothing", document.getElementById("selectLogMulti"));
    }
    for(var j=0;j<(multiCollections.length-1);j++){
        if(multiCollections[(j+1)] !== undefined && multiCollections[(j+1)] > 0 ){
            AddOption((j+1), document.getElementById("selectLogMulti"));
        }
    }
    newStart = new Date();
    startTimeInMS = newStart.getTime();
    GetRightTiming();
    DisplayRarities();
}

/*
If someone clicks on a checkBox this gets executed
Takes two argument, the checkbox that got clicked and the associated variable that should be written into localstorage
*/
function WriteCheckboxStatus(checkBox, variableToChange){
    SetStorageVariable(variableToChange, checkBox.checked, "true");
}

/*
Pretty self-explaining. It basically resets the variables to their base state.
This only gets triggered by the reset-button (id=buttonResetStatistics) and every time the log gets built if the "totalStatistics" variable is set to false
*/
function ResetStatistics(){
    localStorage.clear(); //Clear the local storage and set all the vars to their base value after
    displayNerdStuff = SetStorageVariable("displayNerdStuff", document.getElementById("checkBoxNerdStuff").checked, displayNerdStuff);
    totalExp = Number(SetStorageVariable("totalExp", 0, displayNerdStuff));
    thenLength = Number(SetStorageVariable("thenLength", 0, displayNerdStuff));			//This is to prevent the interval to loop over the drop more than once
    totalLength = Number(SetStorageVariable("totalLength", 1, displayNerdStuff));		//Same as "thenLength" variable, just that this is for a total statistic reference
    amountNothing = Number(SetStorageVariable("amountNothing", 0, displayNerdStuff));		//Used for the "Nothing x" output
    maxMulti = 0;
    Number(SetStorageVariable("maxMulti", 0, displayNerdStuff));
    collected = Number(SetStorageVariable("collected", 0, displayNerdStuff));
    for(var rarity = 0; rarity<5; rarity++){
        raritiesCollected[rarity] = Number(SetStorageVariable(("rarity" +rarity), 0, displayNerdStuff));
    }
    multiCollections = [];
    amountMaterials = [];
    gainedMaterials = [];
    materialDic = {};
    multiDic = {};
    rarities = ["Common", "Superior", "Rare", "Epic", "Legendary"];
    totalStatistics = SetStorageVariable("totalStatistics", document.getElementById("checkBoxTotalStatistics").checked, displayNerdStuff);
    displayRarity = SetStorageVariable("displayRarity", document.getElementById("checkBoxRarities").checked, displayNerdStuff);
    document.getElementById("selectLogMulti").options.length = 1;
    document.getElementById("selectLogMaterial").options.length = 1;
    document.getElementById("logDiv").innerHTML = "";
    if(document.getElementById("checkBoxRarities").checked){
        DisplayRarities();
    }
    console.log("Everything has been re-set");
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
        if(results.length === 0){ //If-clause to clear the interval to prevent multiple mainloops running at the same time.
            clearInterval(mainInterval);
        }
        else{
            //This if-clause is to prevent looping over the same thing too often in case the timer-variable thing goes wrong or there is lag or anything else that would cause multi-logging
            if(results.length > thenLength){
                //Following part is just a quick test if the timer-variable is okay, since if it is asynced by over 5 seconds it should calculated a new one.
                //Otherwise this is just sitting here, doing nothing.
                timerText = document.getElementById("skill-timer").innerText;
                newDate = new Date();
                newTime = newDate.getTime();
                timeDiff = newTime - startTimeInMS;
                timeString = ConvertIntoSmallerTimeFormat(timeDiff);
                var output = "You have been working on this node/pattern for " + timeString + ".</br>";
                var currentTime = timerText.slice(timerText.indexOf("(")+1, timerText.indexOf(")"));
                if((timerVar/1000) % currentTime > 5 && !loopOnce){
                    console.log("Refresh time is over 5 seconds off.");
                    setTimeout(function(){
                        clearInterval(mainInterval);
                    }, 5000, mainInterval);
                    GetRightTiming();
                }
                var resultsHTML = document.getElementsByClassName("roundResult areaName")[0].innerHTML;
                var resultsText = document.getElementsByClassName("roundResult areaName")[0].innerText;
                if(resultsText.indexOf("Your combines are complete.") === 0){
                    resultsHTML = document.getElementsByClassName("roundResult areaName")[1].innerHTML;
                    resultsText = document.getElementsByClassName("roundResult areaName")[1].innerText;
                }
                output += "You have collected/created:";
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
                var avgExp = Math.floor(totalExp/(totalLength));
                SetStorageVariable("totalExp", totalExp, displayNerdStuff);
                if(isNaN(avgExp)){ //If exp values happen to be NaN you can see that in the output later on.
                    avgExp = "invalid input";
                }
                if(isNaN(totalExp)){
                    totalExp = "invalid input";
                }
                var rawAmount = amount;
                amount = amount.replace(" ", "");
                if(resultsText.indexOf("found") === -1 && resultsText.indexOf("created") === -1){
                    amountNothing++;
                    SetStorageVariable("amountNothing", amountNothing, displayNerdStuff);
                }
                else if(resultsText.indexOf("found") !== -1 || resultsText.indexOf("created") !== -1){ //If the result string contains "found" it automatically recognizeses this as a drop, otherwise it's a "nothing-drop"
                    if(resultsText.indexOf("Your combines are complete.") === -1){
                    }
                    lastCollectedMaterial = resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]"));
                    if(gainedMaterials.indexOf(lastCollectedMaterial) == -1){ //If the collected material is not in the gainedMaterials array, the indexOf returns -1, thus it adds this variable to the array and everything else
                        gainedMaterials.push(lastCollectedMaterial);
                        amountMaterials.push(0);
                        AddOption(lastCollectedMaterial,  document.getElementById("selectLogMaterial"));
                        materialDic[lastCollectedMaterial] = resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + amount + "</br>";
                        SetStorageVariable(("materialDic_" + lastCollectedMaterial), materialDic[lastCollectedMaterial], displayNerdStuff);
                    }
                    else{
                        materialDic[lastCollectedMaterial] += resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + amount + "</br>";
                        SetStorageVariable(("materialDic_" + lastCollectedMaterial), materialDic[lastCollectedMaterial], displayNerdStuff);
                    }
                }
                if(amount.length > 3){ //This should only execute when mastery, Create Rate/Drop Rate or whatever procs on the drop.
                    amount = resultsText.slice(resultsText.lastIndexOf("]")+3,resultsText.lastIndexOf("]")+6);
                }
                if(collected < gainedMaterials.length){
                    collected = Number(SetStorageVariable("collected", gainedMaterials.length, displayNerdStuff));
                }
                amount = createAmountString(amount);
                for(var i=0; i<gainedMaterials.length; i++){ //This for-loop is to get the amount that was gathered/created and afterwards puts it into the output string.
                    if(resultsText.indexOf(gainedMaterials[i]) != -1){
                        amountMaterials[i] += Number(amount);
                        amountMaterials[i] = Number(SetStorageVariable(("amountMaterials" + i), amountMaterials[i], displayNerdStuff));
                        gainedMaterials[i] = SetStorageVariable(("gainedMaterials" + i), gainedMaterials[i], displayNerdStuff);
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
                if(amount === "nothing"){
                    if( $("#selectLogMulti option[value='nothing']").length === 0){ // "nothing" as an option for multi instead of displaying "ou" if it is not present already
                        AddOption(amount, document.getElementById("selectLogMulti"));
                        multiCollections[0] = 1;
                        multiDic[amount] = resultsText.slice(1, resultsText.indexOf("]")) +  " - You didn't find anything.</br>";
                        SetStorageVariable(("multiDic_" + amount), multiDic[amount], displayNerdStuff);
                    }
                    else{
                        multiCollections[0] = amountNothing;
                        multiDic[amount] += resultsText.slice(1, resultsText.indexOf("]")) +  " - You didn't find anything.</br>";
                        SetStorageVariable(("multiDic_" + amount), multiDic[amount], displayNerdStuff);
                    }
                }
                else if(multiCollections[amount] === undefined || multiCollections[amount] === 0){
                    multiCollections[amount] = 1;
                    multiCollections[amount] = Number(SetStorageVariable(("multiCollection" + amount), multiCollections[amount], displayNerdStuff));
                    AddOption(amount, document.getElementById("selectLogMulti"));
                    multiDic[amount] = resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + rawAmount + "</br>";
                    SetStorageVariable(("multiDic_" + amount), multiDic[amount], displayNerdStuff);
                }
                else
                {
                    multiCollections[amount]++;
                    multiCollections[amount] = Number(SetStorageVariable(("multiCollection" + amount), multiCollections[amount], displayNerdStuff));
                    multiDic[amount] += resultsText.slice(1, resultsText.indexOf("]")) +  " - " + resultsText.substring(resultsText.lastIndexOf("[")+1,resultsText.lastIndexOf("]")) + " x" + rawAmount + "</br>";
                    SetStorageVariable(("multiDic_" + amount), multiDic[amount], displayNerdStuff);
                }
                if(maxMulti < multiCollections.length){ //Only if the maxMulti is lower than the actual multiColletions array -> write to local storage
                    maxMulti = Number(SetStorageVariable("maxMulti", multiCollections.length, displayNerdStuff));
                }
                var avgMaterials = 0; //Reset this to 0 to avoid wrong output (Would get way too high if not re-set)
                //This adds up the total multi-collections or -creations that you have achieved and finally add it to the output
                for(var j=0;j<multiCollections.length;j++){
                    if(multiCollections[j] !== 0 && multiCollections[j] !== undefined){
                        output += "You found/created a material x"+j + " " + multiCollections[j] + " time(s). (" + (multiCollections[j]/totalLength*100).toFixed(1) + "%)</br>";
                        avgMaterials += (j) * multiCollections[j];
                    }
                }
                avgMaterials = (avgMaterials / totalLength).toFixed(2);
                output += "Average materials collected/created: " + avgMaterials + "</br>";
                output += "Total collection attempts/creations on this node/pattern: " + results.length + "</br>";
                output += "Total collection attempts/creations in general: " + totalLength + "</br>";
                document.getElementById("logDiv").innerHTML = output; //print output to the html of that div (Jquery is love)
                output = ""; //Reset output variable since it gets build it up every time from scratch; This might eat resources(?)
                for(var  k=0;k<rarities.length;k++){ //for-loop iterates how many materials of each rarity have been collected.
                    if(resultsHTML.indexOf(rarities[k]) !== -1){
                        raritiesCollected[k]++;
                        SetStorageVariable(("rarity" + k), raritiesCollected[k], displayNerdStuff);
                    }
                }
                UpdateHistory();
                totalLength++;
                if(document.getElementById("checkBoxRarities").checked){
                    DisplayRarities();
                }
                SetStorageVariable("totalLength", totalLength, displayNerdStuff);

            }
        }
        thenLength = results.length;
        SetStorageVariable("thenLength", thenLength, displayNerdStuff);
        var foodBuffInfo = "[NBA] ";
        if(document.getElementsByClassName("drIcon cardNone slot_default").length === 0){
            foodBuffInfo = "[BA] ";
        }
        else
        {
            foodBuffInfo = "[NBA] ";
        }
        if(document.getElementsByClassName("roundResult damage areaDepleted").length !== 0){
            document.getElementsByTagName("title")[0].innerText = foodBuffInfo +"Node depleted";
            alert("Node depleted");}

        else{
            if(document.getElementsByClassName("nodeRemaining").length !== 0){
                console.log(document.getElementsByClassName("nodeRemaining")[0].innerText);
                document.getElementsByTagName("title")[0].innerText = foodBuffInfo + document.getElementsByClassName("nodeRemaining")[0].innerText.slice(0, document.getElementsByClassName("nodeRemaining")[0].innerText.indexOf("%")+1) + " left";
            }
            else if(document.getElementsByClassName("titleHeader").length > 0){
                document.getElementsByTagName("title")[0].innerText = foodBuffInfo + document.getElementsByClassName("titleHeader")[0].innerText.slice(document.getElementsByClassName("titleHeader")[0].innerText.indexOf("]")+ 1);
            }
            else{
                document.getElementsByTagName("title")[0].innerText = 'Drakor "Innovative & Unique Browser Based RPG." (PBBG, MPOG, MMORPG) [BETA]';
            }
        }
        if(loopOnce){
            clearInterval(mainInterval);
        }
        else if(loopOnce && document.getElementById("logDiv").innerHTML === ""){
            console.log("Something went wrong building up the main log.. trying again in 5 seconds");
            clearInterval(mainInterval);
            setTimeout(function(){
                MainLoop(100,true);
            }, 5000);
        }
    }, timerVar, timerVar);
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

Patch notes 1.5
14th.June.2016
-   Re-did the setup of the log requirements so that it now checks for an existing id(logDiv) and not for the text of the last element
    This will make further implementation easier
-   Started to save the "totalStatistics" variable in the local storage. This is just the beginning of session-continued data collection (Still in it's early steps)
-   Created a help button and added functionality to it (It appends text to the end of the div)
-   Optimized the main Interval to set a "perfect" interval time via function.
-   Created a function(GetRightTiming) to calculate the "perfect" interval time based on the passed between 25% and 50%
-   Moved the node-information into the main-loop as this should have a good interval now
15th.June.2016
-   Optimized the GetRightTiming function a little more and tried to fix a few more bugs connected to it
-   Added a 5 second interval that loops over, only really executes code if the graphical log isn't built yet
-   Fixed a "typo" in the ouput variable of the Mainloop, "You have collected" => "You have collected/ created"
17th.June.2016
-   Re-did the whole GetRightTiming function that it now waits until the attempt will end in 2 seconds and then do it's thing
-   Now checking if the refresh vs real time is synced in the MainLoop
-   Added a food buff status-tag to the title header. (NBA = No Buff Active; BA = Buff Active) - Also made this available in v1.42 as this was easy to implement
18th.June.2016
-   Finalized the data-over-session storage of statistics. This is still experimental so no guarantee that it will work 100%
-   You can now see how long you have been working on a node
-   Added the display of how many total attempts and how many node attempts you've done
-   Added a few lines to the help-file

Patch notes 1.51
18th.June.2016
-   Added a checkbox to the top to display the rarities below
-   Changed the conditions for the rarity-meter to be displayed and added it to the new checkbox
-   Changed SetTotalStatstics => WriteCheckboxStatus, this will wrrite the value of the checkbox into the local storage
-   Adjusted the text of how long you've been working on a node as it was only "covering" collection and not crafting
-   Adjusted the total-attempt display as it was only "covering" collection but not crafting

Patch notes 1.52
19th.June.2016
-   Fixed a bug where the last attempt of a crafting skill would cause a some weird stuff e.g. nothingrarity +1 and so on
-   Adjusted the ResetStatistics function to be up to latest standards
-   Added a checkbox for the "nerdy" stuff (Basically a log of what gets written/ loaded into/out of local storage)
-   Removed the rarity-meter (RIP somewhere around early June - 19th.June.2016)
-   Added a small % to the "You'Ve collected something x amount of times" thing
*/
